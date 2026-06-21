/**
 * Repara preços USD/BRL no banco com base na planilha Tavares (encoding corrigido).
 * Uso: npx tsx scripts/repair-usd-prices.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";
import * as XLSX from "xlsx";
import { createClient } from "@supabase/supabase-js";
import { sheetToMatrix } from "../src/lib/products/import/spreadsheet-reader";
import { parseTavaresLayout } from "../src/lib/products/import/parse-tavares-layout";
import { tavaresProfile } from "../src/lib/products/import/profiles";
import { slugifyCode } from "../src/lib/products/import/normalize";
import { tavaresCompanyData } from "../src/lib/company/tavares-company";

function loadEnvLocal() {
  const envPath = resolve(process.cwd(), ".env.local");
  for (const line of readFileSync(envPath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq <= 0) continue;
    process.env[trimmed.slice(0, eq).trim()] = trimmed.slice(eq + 1).trim();
  }
}

loadEnvLocal();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const tenantId = process.env.DEFAULT_TENANT_ID!;

function readCsvWorkbook(path: string) {
  const buffer = readFileSync(path);
  const asUtf8 = new TextDecoder("utf-8", { fatal: false }).decode(buffer);
  const text = asUtf8.includes("\uFFFD")
    ? new TextDecoder("latin1").decode(buffer)
    : asUtf8;
  return XLSX.read(text, { type: "string", raw: false, FS: ";" });
}

async function main() {
  const admin = createClient(supabaseUrl, serviceKey);
  const wb = readCsvWorkbook("data/planilha-tavares.csv");
  const matrix = sheetToMatrix(wb);
  const parsed = parseTavaresLayout("planilha-tavares.csv", matrix, tavaresProfile);

  const usdRows = parsed.rows.filter((r) => r.price_usd != null);
  console.log(`Planilha: ${usdRows.length} produtos em USD, ${parsed.rows.length - usdRows.length} em BRL`);

  const { data: products } = await admin
    .from("products")
    .select("id, internal_code, commercial_name")
    .eq("tenant_id", tenantId);

  const byCode = new Map(
    (products ?? []).map((p) => [p.internal_code, p.id])
  );
  const byName = new Map(
    (products ?? []).map((p) => [p.commercial_name.trim().toUpperCase(), p.id])
  );

  let updated = 0;
  let skipped = 0;

  for (const row of parsed.rows) {
    const code =
      row.internal_code?.trim() ||
      `AUTO-${slugifyCode(row.commercial_name ?? "") || row.rowNumber}`;
    const productId =
      byCode.get(code) ??
      byName.get(row.commercial_name.trim().toUpperCase());

    if (!productId) {
      skipped++;
      continue;
    }

    const { data: activePrices } = await admin
      .from("product_prices")
      .select("id, price_usd, price_brl")
      .eq("product_id", productId)
      .eq("tenant_id", tenantId)
      .eq("status", "ativo");

    if (!activePrices?.length) continue;

    for (const price of activePrices) {
      const needsUpdate =
        price.price_usd !== row.price_usd || price.price_brl !== row.price_brl;

      if (!needsUpdate) continue;

      const { error } = await admin
        .from("product_prices")
        .update({
          price_usd: row.price_usd,
          price_brl: row.price_brl,
        })
        .eq("id", price.id);

      if (error) {
        console.error(`Erro ${row.commercial_name}:`, error.message);
      } else {
        updated++;
      }
    }
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: existingRate } = await admin
    .from("exchange_rates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .eq("status", "ativo")
    .maybeSingle();

  const ptaxPayload = {
    tenant_id: tenantId,
    from_currency: "USD",
    to_currency: "BRL",
    rate: tavaresCompanyData.quotationDefaults.ptax,
    valid_from: today,
    valid_until: null,
    status: "ativo",
  };

  if (existingRate?.id) {
    await admin.from("exchange_rates").update(ptaxPayload).eq("id", existingRate.id);
  } else {
    await admin.from("exchange_rates").insert(ptaxPayload);
  }

  console.log(`Preços atualizados: ${updated}, produtos não encontrados: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
