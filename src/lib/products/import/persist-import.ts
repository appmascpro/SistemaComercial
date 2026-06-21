import { getRequiredTenantId } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";
import {
  assignInternalCodes,
  normalizeProductName,
} from "@/lib/products/internal-code";
import { parsePackageSize } from "./normalize";
import { getImportProfile } from "./profiles";
import type {
  ImportPersistPayload,
  ImportPersistResult,
  ImportPersistRow,
} from "./types";

const BATCH_SIZE = 50;

/** @deprecated import from @/lib/auth/tenant */
export { getTenantId, getRequiredTenantId } from "@/lib/auth/tenant";

function packageLabel(pkg: ImportPersistRow["packages"][number]): string {
  if (pkg.type === "fracionada") return `${pkg.name} (fracionada)`;
  if (pkg.type === "industrial") return `${pkg.name} (industrial)`;
  return pkg.name;
}

function chunk<T>(items: T[], size: number): T[][] {
  const result: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    result.push(items.slice(i, i + size));
  }
  return result;
}

export async function persistProductImport(
  payload: ImportPersistPayload
): Promise<ImportPersistResult> {
  const supabase = await createClient();
  const tenantId = await getRequiredTenantId();
  const totalRows = payload.rows.length;
  const errors: Array<{ rowNumber: number; message: string }> = [];
  const validFrom = new Date().toISOString().slice(0, 10);

  const { data: importRecord, error: importError } = await supabase
    .from("product_imports")
    .insert({
      tenant_id: tenantId,
      file_name: payload.fileName,
      total_rows: totalRows,
      success_rows: 0,
      error_rows: 0,
      status: "processando",
      started_at: new Date().toISOString(),
      error_details: [],
    })
    .select("id")
    .single();

  if (importError || !importRecord) {
    return {
      success: false,
      totalRows,
      successRows: 0,
      errorRows: totalRows,
      errors: [
        {
          rowNumber: 0,
          message: importError?.message ?? "Erro ao registrar importação",
        },
      ],
      message: "Não foi possível iniciar a importação.",
    };
  }

  try {
    const profile = getImportProfile(payload.profileId);
    const codePrefix = profile.codePrefix ?? "PRD";

    const { data: existingProducts, error: existingError } = await supabase
      .from("products")
      .select("id, internal_code, commercial_name")
      .eq("tenant_id", tenantId);

    if (existingError) {
      throw new Error(existingError.message);
    }

    const assignedCodes = assignInternalCodes(
      payload.rows,
      existingProducts ?? [],
      codePrefix
    );

    const existingByName = new Map(
      (existingProducts ?? []).map((product) => [
        normalizeProductName(product.commercial_name),
        product,
      ])
    );

    const prepared = payload.rows.map((row, index) => {
      const internalCode = assignedCodes[index] ?? assignedCodes[0];
      const existing = existingByName.get(normalizeProductName(row.commercial_name));

      return {
        row,
        internalCode,
        existingId: existing?.id ?? null,
      };
    });

    const productPayload = (row: ImportPersistRow, internalCode: string) => ({
      tenant_id: tenantId,
      internal_code: internalCode,
      commercial_name: row.commercial_name,
      inci_name: row.inci_name,
      supplier_name: row.supplier_name,
      category: row.category,
      subcategory: row.subcategory,
      unit: row.unit,
      stock_quantity: row.stock_quantity,
      status: row.status,
      technical_notes: row.technical_notes,
    });

    const productsToInsert = prepared
      .filter((item) => !item.existingId)
      .map(({ row, internalCode }) => productPayload(row, internalCode));

    const productsToUpdate = prepared
      .filter((item) => item.existingId)
      .map(({ row, internalCode, existingId }) => ({
        id: existingId as string,
        payload: productPayload(row, internalCode),
      }));

    for (const batch of chunk(productsToInsert, BATCH_SIZE)) {
      const { error } = await supabase.from("products").insert(batch);
      if (error) throw new Error(`Produtos: ${error.message}`);
    }

    for (const batch of chunk(productsToUpdate, BATCH_SIZE)) {
      await Promise.all(
        batch.map(({ id, payload }) =>
          supabase.from("products").update(payload).eq("id", id)
        )
      );
    }

    const internalCodes = prepared.map((p) => p.internalCode);
    const { data: products, error: productsError } = await supabase
      .from("products")
      .select("id, internal_code")
      .eq("tenant_id", tenantId)
      .in("internal_code", internalCodes);

    if (productsError || !products) {
      throw new Error(productsError?.message ?? "Falha ao buscar produtos");
    }

    const productIdByCode = new Map(
      products.map((p) => [p.internal_code, p.id])
    );

    const productIds = [...productIdByCode.values()];

    if (productIds.length > 0) {
      await supabase
        .from("product_prices")
        .update({ status: "inativo" })
        .eq("tenant_id", tenantId)
        .in("product_id", productIds)
        .eq("status", "ativo");

      await supabase
        .from("tax_rules")
        .delete()
        .eq("tenant_id", tenantId)
        .in("product_id", productIds);
    }

    const { data: existingPackages } = await supabase
      .from("product_packages")
      .select("id, product_id, name")
      .eq("tenant_id", tenantId)
      .in("product_id", productIds.length > 0 ? productIds : ["00000000-0000-0000-0000-000000000000"]);

    const packageIdByKey = new Map(
      (existingPackages ?? []).map((p) => [`${p.product_id}:${p.name}`, p.id])
    );

    const packagesToInsert: Array<Record<string, unknown>> = [];
    const packagesToUpdate: Array<{ id: string; payload: Record<string, unknown> }> = [];
    const pricesToInsert: Array<Record<string, unknown>> = [];
    const taxRulesToInsert: Array<Record<string, unknown>> = [];

    let successRows = 0;

    for (const { row, internalCode } of prepared) {
      const productId = productIdByCode.get(internalCode);
      if (!productId) {
        errors.push({
          rowNumber: row.rowNumber,
          message: "Produto não encontrado após gravação.",
        });
        continue;
      }

      try {
        for (const pkg of row.packages) {
          const name = packageLabel(pkg);
          const key = `${productId}:${name}`;
          const { size_value, size_unit } = parsePackageSize(pkg.name);
          const packagePayload = {
            tenant_id: tenantId,
            product_id: productId,
            name,
            size_value,
            size_unit,
            status: "ativo",
          };

          const existingId = packageIdByKey.get(key);
          if (existingId) {
            packagesToUpdate.push({ id: existingId, payload: packagePayload });
          } else {
            packagesToInsert.push(packagePayload);
          }
        }

        const icmsRules = [
          { region: "icms_4", rate: row.icms_4 },
          { region: "icms_7", rate: row.icms_7 },
          { region: "icms_12", rate: row.icms_12 },
          { region: "icms_18", rate: row.icms_18 },
        ].filter((r) => r.rate !== null);

        for (const rule of icmsRules) {
          taxRulesToInsert.push({
            tenant_id: tenantId,
            product_id: productId,
            region: rule.region,
            icms_rate: rule.rate,
            ipi_rate: 0,
            status: "ativo",
            is_active: true,
          });
        }

        if (row.ipi_rate !== null) {
          taxRulesToInsert.push({
            tenant_id: tenantId,
            product_id: productId,
            region: "ipi",
            icms_rate: 0,
            ipi_rate: row.ipi_rate,
            status: "ativo",
            is_active: true,
          });
        }

        successRows += 1;
      } catch (error) {
        errors.push({
          rowNumber: row.rowNumber,
          message: error instanceof Error ? error.message : "Erro desconhecido",
        });
      }
    }

    for (const batch of chunk(packagesToInsert, BATCH_SIZE)) {
      const { data, error } = await supabase
        .from("product_packages")
        .insert(batch)
        .select("id, product_id, name");
      if (error) throw new Error(`Embalagens: ${error.message}`);
      for (const pkg of data ?? []) {
        packageIdByKey.set(`${pkg.product_id}:${pkg.name}`, pkg.id);
      }
    }

    for (const batch of chunk(packagesToUpdate, BATCH_SIZE)) {
      await Promise.all(
        batch.map(({ id, payload }) =>
          supabase.from("product_packages").update(payload).eq("id", id)
        )
      );
    }

    for (const { row, internalCode } of prepared) {
      const productId = productIdByCode.get(internalCode);
      if (!productId) continue;

      for (const pkg of row.packages) {
        const name = packageLabel(pkg);
        const packageId = packageIdByKey.get(`${productId}:${name}`);
        if (!packageId) continue;

        pricesToInsert.push({
          tenant_id: tenantId,
          product_id: productId,
          package_id: packageId,
          price_usd: row.price_usd,
          price_brl: row.price_brl,
          min_price: row.min_price,
          max_price: row.max_price,
          valid_from: validFrom,
          status: "ativo",
        });
      }
    }

    for (const batch of chunk(pricesToInsert, BATCH_SIZE)) {
      const { error } = await supabase.from("product_prices").insert(batch);
      if (error) throw new Error(`Preços: ${error.message}`);
    }

    for (const batch of chunk(taxRulesToInsert, BATCH_SIZE)) {
      const { error } = await supabase.from("tax_rules").insert(batch);
      if (error) throw new Error(`Impostos: ${error.message}`);
    }

    const errorRows = errors.length;
    const finalStatus =
      successRows === 0 ? "falhou" : errorRows > 0 ? "parcial" : "concluido";

    await supabase
      .from("product_imports")
      .update({
        success_rows: successRows,
        error_rows: errorRows,
        status: finalStatus,
        finished_at: new Date().toISOString(),
        error_details: errors,
      })
      .eq("id", importRecord.id);

    return {
      success: successRows > 0 && errorRows === 0,
      importId: importRecord.id,
      totalRows,
      successRows,
      errorRows,
      errors,
      message:
        errorRows === 0
          ? `${successRows} produto(s) importado(s) com sucesso.`
          : `${successRows} importado(s), ${errorRows} com erro.`,
    };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro desconhecido na importação";

    await supabase
      .from("product_imports")
      .update({
        status: "falhou",
        finished_at: new Date().toISOString(),
        error_details: [{ rowNumber: 0, message }],
      })
      .eq("id", importRecord.id);

    return {
      success: false,
      importId: importRecord.id,
      totalRows,
      successRows: 0,
      errorRows: totalRows,
      errors: [{ rowNumber: 0, message }],
      message: `Falha ao importar produtos: ${message}`,
    };
  }
}
