import type {
  ImportFieldKey,
  ImportProfile,
  ImportPersistRow,
  ParsedImportResult,
  ParsedProductRow,
} from "./types";
import { buildHeaderMap } from "./map-row";
import { mapRowToParsedProduct } from "./map-row";

function isRowEmpty(values: Record<string, unknown>): boolean {
  return Object.values(values).every(
    (value) => value === null || value === undefined || String(value).trim() === ""
  );
}

export function mapRowsFromSpreadsheet(
  fileName: string,
  profile: ImportProfile,
  headers: string[],
  rawRows: Record<string, unknown>[]
): ParsedImportResult {
  const { mappedFields, ignoredHeaders, unmappedHeaders } = buildHeaderMap(
    headers,
    profile
  );

  const rows: ParsedProductRow[] = [];

  rawRows.forEach((rawRow, index) => {
    if (isRowEmpty(rawRow)) return;

    const rowNumber = index + 2;
    rows.push(
      mapRowToParsedProduct(rawRow, rowNumber, mappedFields, headers, profile)
    );
  });

  const issues = validateMappedRows(rows, mappedFields, profile);
  const importableCount = rows.filter((row) => {
    if (!row.commercial_name) return false;
    if (row.price_brl !== null || row.price_usd !== null) return true;
    return row.min_price !== null || row.max_price !== null;
  }).length;

  return {
    profileId: profile.id,
    fileName,
    headers,
    mappedFields,
    ignoredHeaders,
    unmappedHeaders,
    rows,
    issues,
    hasCriticalErrors: importableCount === 0,
    importableCount,
    skippedCount: rows.length - importableCount,
  };
}

function validateMappedRows(
  rows: ParsedProductRow[],
  mappedFields: Partial<Record<ImportFieldKey, string>>,
  profile: ImportProfile
) {
  const issues: ParsedImportResult["issues"] = [];
  const isTavares = profile.id === "tavares";

  // Modo tolerante: erros de coluna viram aviso se houver linhas importáveis
  const colMissingSeverity = isTavares ? "warning" : "error";

  if (!mappedFields.commercial_name) {
    issues.push({
      rowNumber: 0,
      field: "commercial_name",
      message: isTavares
        ? 'Coluna "PRODUTO" não encontrada na planilha.'
        : 'Coluna "nome comercial" não encontrada na planilha.',
      severity: colMissingSeverity,
    });
  }

  if (isTavares) {
    if (!mappedFields.net_price && !mappedFields.min_price && !mappedFields.max_price) {
      issues.push({
        rowNumber: 0,
        message:
          'Nenhuma coluna de preço detectada (PREÇO NET, PREÇO MÍNIMO ou PREÇO MÁXIMO).',
        severity: colMissingSeverity,
      });
    } else if (!mappedFields.net_price) {
      issues.push({
        rowNumber: 0,
        field: "net_price",
        message:
          'Coluna "PREÇO NET" não detectada — preços serão lidos de MÍNIMO/MÁXIMO com ICMS 18%.',
        severity: "warning",
      });
    }
    if (!mappedFields.currency) {
      issues.push({
        rowNumber: 0,
        field: "currency",
        message: 'Coluna "MOEDA" não detectada — será inferida pelo símbolo ($/R$).',
        severity: "warning",
      });
    }
  } else {
    if (!mappedFields.package_name) {
      issues.push({
        rowNumber: 0,
        field: "package_name",
        message: 'Coluna "embalagem/tamanho" não encontrada.',
        severity: "error",
      });
    }
    if (!mappedFields.price_brl && !mappedFields.price_usd) {
      issues.push({
        rowNumber: 0,
        message: "Nenhuma coluna de preço encontrada.",
        severity: "error",
      });
    }
  }

  if (rows.length === 0) {
    issues.push({
      rowNumber: 0,
      message: "A planilha não contém linhas de dados para importar.",
      severity: "error",
    });
  }

  for (const row of rows) {
    if (!row.commercial_name) {
      issues.push({
        rowNumber: row.rowNumber,
        field: "commercial_name",
        message: isTavares
          ? "PRODUTO é obrigatório."
          : "Nome comercial é obrigatório.",
        severity: "error",
      });
    }

    if (isTavares) {
      if (
        row.net_price === null &&
        row.min_price === null &&
        row.max_price === null
      ) {
        continue;
      }

      if (row.packages.length === 0) {
        issues.push({
          rowNumber: row.rowNumber,
          field: "package_name",
          message: "Sem embalagem — será usado 'Padrão'.",
          severity: "warning",
        });
      }
    } else {
      if (!row.package_name) {
        issues.push({
          rowNumber: row.rowNumber,
          field: "package_name",
          message: "Embalagem/tamanho é obrigatório.",
          severity: "error",
        });
      }

      if (row.price_brl === null && row.price_usd === null) {
        issues.push({
          rowNumber: row.rowNumber,
          message: "Informe pelo menos preço em real ou preço em dólar.",
          severity: "error",
        });
      }
    }

    if (row.price_brl !== null && row.price_brl < 0) {
      issues.push({
        rowNumber: row.rowNumber,
        field: "price_brl",
        message: "Preço em real não pode ser negativo.",
        severity: "error",
      });
    }

    if (row.price_usd !== null && row.price_usd < 0) {
      issues.push({
        rowNumber: row.rowNumber,
        field: "price_usd",
        message: "Preço em dólar não pode ser negativo.",
        severity: "error",
      });
    }

    if (!row.internal_code && row.commercial_name) {
      issues.push({
        rowNumber: row.rowNumber,
        field: "internal_code",
        message: "Código interno ausente — será gerado automaticamente.",
        severity: "warning",
      });
    }
  }

  return issues;
}

export function toPersistRows(rows: ParsedProductRow[]): ImportPersistRow[] {
  return rows
    .filter((row) => {
      if (!row.commercial_name) return false;
      if (row.price_brl !== null || row.price_usd !== null) return true;
      return row.min_price !== null || row.max_price !== null;
    })
    .map((row) => {
      const packages =
        row.packages.length > 0
          ? row.packages
          : [{ name: "Padrão", type: "geral" as const }];

      return {
        rowNumber: row.rowNumber,
        internal_code: row.internal_code ?? "",
        commercial_name: row.commercial_name!,
        description: row.description,
        ncm: row.ncm,
        inci_name: row.inci_name,
        supplier_name: row.supplier_name,
        category: row.category,
        subcategory: row.subcategory,
        unit: row.unit ?? "kg",
        packages,
        price_usd: row.price_usd,
        price_brl: row.price_brl,
        min_price: row.min_price,
        max_price: row.max_price,
        icms_4: row.icms_4,
        icms_7: row.icms_7,
        icms_12: row.icms_12,
        icms_18: row.icms_18,
        ipi_rate: row.ipi_rate,
        stock_quantity: row.stock_quantity ?? 0,
        status: row.status ?? "ativo",
        technical_notes: row.technical_notes,
      };
    });
}
