import {
  inferCurrencyFromCells,
  resolvePricesFromCurrency,
} from "@/lib/pricing/currency";
import { netFromGross } from "@/lib/quotes/quote-pricing-core";
import type { ImportProfile, ParsedImportResult, ParsedProductRow } from "./types";
import { normalizeHeader, parseNumeric, parseString } from "./normalize";

export interface TavaresColumnMap {
  headerRowIndex: number;
  dataStartRow: number;
  produto: number;
  descricao: number | null;
  ncm: number | null;
  moeda: number | null;
  ipi: number | null;
  netPrice: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  inci: number | null;
  embalagemCols: number[];
}

function cellText(matrix: unknown[][], row: number, col: number): string {
  return String(matrix[row]?.[col] ?? "").trim();
}

function findColInRow(
  matrix: unknown[][],
  rowIndex: number,
  patterns: string[]
): number | null {
  const row = matrix[rowIndex] ?? [];
  for (let c = 0; c < row.length; c++) {
    const n = normalizeHeader(cellText(matrix, rowIndex, c));
    if (!n) continue;
    if (patterns.some((p) => n === p || n.includes(p))) return c;
  }
  return null;
}

/** Planilha Tavares: linha 0 = grupos ICMS, linha 1 = cabeçalhos, linha 2+ = dados */
export function detectTavaresColumns(matrix: unknown[][]): TavaresColumnMap | null {
  if (matrix.length < 2) return null;

  let headerRowIndex = -1;
  for (let r = 0; r < Math.min(matrix.length, 10); r++) {
    const n = normalizeHeader(cellText(matrix, r, 0));
    if (n === "produto") {
      headerRowIndex = r;
      break;
    }
  }

  if (headerRowIndex < 0) return null;

  const produto = 0;
  const descricao = findColInRow(matrix, headerRowIndex, ["descricao", "descrição"]) ?? 2;
  const ncm = findColInRow(matrix, headerRowIndex, ["ncm"]) ?? 4;
  const moeda =
    findColInRow(matrix, headerRowIndex, ["moeda"]) ?? 12;
  const ipi = findColInRow(matrix, headerRowIndex, ["ipi"]) ?? 14;
  const netPrice = findColInRow(matrix, headerRowIndex, [
    "preco net",
    "preço net",
    "sem imposto",
  ]);
  const minPrice = findColInRow(matrix, headerRowIndex, [
    "preco minimo",
    "preço mínimo",
    "preco min",
    "preço min",
    "minimo 18",
    "minimo",
    "mínimo",
  ]);
  const maxPrice = findColInRow(matrix, headerRowIndex, [
    "preco maximo",
    "preço máximo",
    "preco max",
    "preço max",
    "maximo 18",
    "maximo",
    "máximo",
  ]);
  const inci =
    findColInRow(matrix, headerRowIndex, ["inci name", "inci"]) ?? 27;

  const embalagensCol =
    findColInRow(matrix, headerRowIndex, ["embalagem", "embalagens"]) ?? 5;

  const embalagemCols: number[] = [];
  for (let c = embalagensCol + 1; c < moeda; c++) {
    embalagemCols.push(c);
  }

  const rowAbove = headerRowIndex > 0 ? matrix[headerRowIndex - 1] : [];
  const hasIcmsGroupRow = (rowAbove ?? []).some((cell) => {
    const n = normalizeHeader(String(cell ?? ""));
    return n.includes("icms");
  });

  const dataStartRow = hasIcmsGroupRow
    ? headerRowIndex + 2
    : headerRowIndex + 1;

  return {
    headerRowIndex,
    dataStartRow,
    produto,
    descricao,
    ncm,
    moeda,
    ipi,
    netPrice,
    minPrice,
    maxPrice,
    inci,
    embalagemCols,
  };
}

/**
 * CSV Tavares às vezes grava 3,25 como 325 e 8,97 como 897 (sem separador decimal).
 */
export function parseTavaresDecimal(
  value: unknown,
  kind: "price" | "percent"
): number | null {
  const parsed = parseNumeric(value);
  if (parsed === null) return null;

  if (typeof value === "string") {
    if (value.includes(",") || value.includes(".")) return parsed;
  }

  if (typeof value === "number") {
    if (kind === "percent" && parsed > 30) return parsed / 100;
    if (kind === "price" && parsed >= 100) return parsed / 100;
  }

  return parsed;
}

function isDataRowEmpty(line: unknown[]): boolean {
  return line.every(
    (v) => v === null || v === undefined || String(v).trim() === ""
  );
}

function buildNotes(description: string | null, ncm: string | null): string | null {
  const parts: string[] = [];
  if (description) parts.push(`Descrição: ${description}`);
  if (ncm) parts.push(`NCM: ${ncm}`);
  return parts.length > 0 ? parts.join("\n") : null;
}

function extractPackages(
  line: unknown[],
  embalagemCols: number[]
): ParsedProductRow["packages"] {
  const packages: ParsedProductRow["packages"] = [];
  const seen = new Set<string>();

  for (const col of embalagemCols) {
    const value = line[col];
    const size = parseNumeric(value);
    if (size === null || size <= 0) continue;

    const name = Number.isInteger(size) ? `${size} kg` : `${size} kg`;
    if (seen.has(name)) continue;
    seen.add(name);
    packages.push({ name, type: "geral" });
  }

  return packages;
}

function isImportableTavaresRow(row: ParsedProductRow): boolean {
  if (!row.commercial_name) return false;
  return (
    row.price_brl !== null ||
    row.price_usd !== null ||
    row.min_price !== null ||
    row.max_price !== null
  );
}

export function parseTavaresLayout(
  fileName: string,
  matrix: unknown[][],
  profile: ImportProfile
): ParsedImportResult {
  const colMap = detectTavaresColumns(matrix);
  const defaultIcms = profile.defaultIcmsRates;

  if (!colMap) {
    return {
      profileId: "tavares",
      fileName,
      headers: [],
      mappedFields: {},
      ignoredHeaders: ["Colunas ICMS calculadas"],
      unmappedHeaders: [],
      rows: [],
      issues: [
        {
          rowNumber: 0,
          message: 'Cabeçalho "PRODUTO" não encontrado nesta planilha.',
          severity: "error",
        },
      ],
      hasCriticalErrors: true,
      importableCount: 0,
      skippedCount: 0,
    };
  }

  const rows: ParsedProductRow[] = [];
  const issues: ParsedImportResult["issues"] = [];

  for (let i = colMap.dataStartRow; i < matrix.length; i++) {
    const line = matrix[i] ?? [];
    if (isDataRowEmpty(line)) continue;

    const rowNumber = i + 1;
    const commercial_name = parseString(line[colMap.produto]);
    if (!commercial_name) continue;

    const description =
      colMap.descricao !== null ? parseString(line[colMap.descricao]) : null;
    const ncm = colMap.ncm !== null ? parseString(line[colMap.ncm]) : null;
    const moedaCell = colMap.moeda !== null ? line[colMap.moeda] : null;
    const netPriceCell =
      colMap.netPrice !== null ? line[colMap.netPrice] : null;
    const ipi_rate =
      colMap.ipi !== null
        ? parseTavaresDecimal(line[colMap.ipi], "percent")
        : null;
    const inci_name =
      colMap.inci !== null ? parseString(line[colMap.inci]) : null;

    const minGross =
      colMap.minPrice !== null
        ? parseTavaresDecimal(line[colMap.minPrice], "price")
        : null;
    const maxGross =
      colMap.maxPrice !== null
        ? parseTavaresDecimal(line[colMap.maxPrice], "price")
        : null;
    const ipiForNet = ipi_rate ?? 0;
    const min_price =
      minGross != null ? netFromGross(minGross, ipiForNet) : null;
    const max_price =
      maxGross != null ? netFromGross(maxGross, ipiForNet) : null;

    let net_price =
      colMap.netPrice !== null
        ? parseTavaresDecimal(line[colMap.netPrice], "price")
        : null;

    if (net_price === null) {
      net_price = max_price ?? min_price ?? null;
    }

    const priceHintCell =
      netPriceCell ??
      (colMap.maxPrice !== null ? line[colMap.maxPrice] : null) ??
      (colMap.minPrice !== null ? line[colMap.minPrice] : null);
    const currency = inferCurrencyFromCells(moedaCell, priceHintCell);
    const prices = resolvePricesFromCurrency(currency, net_price);

    let packages = extractPackages(line, colMap.embalagemCols);

    if (packages.length === 0) {
      packages = [{ name: "Padrão", type: "geral" }];
      issues.push({
        rowNumber,
        message: `Linha ${rowNumber}: sem tamanho em EMBALAGENS — usando "Padrão".`,
        severity: "warning",
      });
    }

    if (
      net_price === null &&
      min_price === null &&
      max_price === null
    ) {
      issues.push({
        rowNumber,
        message: `Linha ${rowNumber}: sem PREÇO NET, MÍNIMO ou MÁXIMO — ignorada na importação.`,
        severity: "warning",
      });
    }

    rows.push({
      rowNumber,
      internal_code: null,
      commercial_name,
      description,
      ncm,
      inci_name,
      supplier_name: null,
      category: null,
      subcategory: null,
      unit: "kg",
      package_name: packages[0]?.name ?? null,
      package_fractional: null,
      package_industrial: null,
      packages,
      currency,
      net_price,
      price_usd: prices.price_usd,
      price_brl: prices.price_brl,
      min_price,
      max_price,
      icms_4: null,
      icms_7: defaultIcms?.icms_7 ?? null,
      icms_12: defaultIcms?.icms_12 ?? null,
      icms_18: defaultIcms?.icms_18 ?? null,
      ipi_rate,
      stock_quantity: null,
      status: "ativo",
      technical_notes: buildNotes(description, ncm),
      extra_fields: {},
    });
  }

  const importableCount = rows.filter(isImportableTavaresRow).length;

  const skippedCount = rows.length - importableCount;

  if (rows.length === 0) {
    issues.push({
      rowNumber: 0,
      message: "Nenhuma linha de produto encontrada após o cabeçalho.",
      severity: "error",
    });
  }

  if (colMap.netPrice === null && colMap.minPrice === null && colMap.maxPrice === null) {
    issues.unshift({
      rowNumber: 0,
      message:
        'Nenhuma coluna de preço detectada (PREÇO NET, PREÇO MÍNIMO ou PREÇO MÁXIMO).',
      severity: "error",
    });
  } else if (colMap.netPrice === null && (colMap.minPrice !== null || colMap.maxPrice !== null)) {
    issues.unshift({
      rowNumber: 0,
      message:
        "Planilha sem PREÇO NET — preços serão lidos de MÍNIMO/MÁXIMO com ICMS 18% (bruto convertido para líquido).",
      severity: "warning",
    });
  }

  issues.unshift({
    rowNumber: 0,
    message: `Planilha Tavares detectada: ${rows.length} produtos, MOEDA=${colMap.moeda ?? "?"}, PREÇO NET=${colMap.netPrice ?? "—"}, MÍN=${colMap.minPrice ?? "—"}, MÁX=${colMap.maxPrice ?? "—"}, INCI=${colMap.inci ?? "?"}.`,
    severity: "warning",
  });

  return {
    profileId: "tavares",
    fileName,
    headers: [
      "PRODUTO",
      "DESCRIÇÃO",
      "NCM",
      "EMBALAGENS",
      "MOEDA",
      "IPI%",
      "PREÇO NET",
      "INCI NAME",
    ],
    mappedFields: {
      commercial_name: "PRODUTO",
      description: "DESCRIÇÃO",
      ncm: "NCM",
      currency: "MOEDA",
      ipi_rate: "IPI%",
      ...(colMap.netPrice !== null ? { net_price: "PREÇO NET" } : {}),
      ...(colMap.minPrice !== null ? { min_price: "PREÇO MÍNIMO" } : {}),
      ...(colMap.maxPrice !== null ? { max_price: "PREÇO MÁXIMO" } : {}),
      inci_name: "INCI NAME",
    },
    ignoredHeaders: [
      "7% ICMS / 12% ICMS / 18% ICMS (EMB INDUSTRIAL, FRACIONADO) — calculado no sistema",
    ],
    unmappedHeaders: [],
    rows,
    issues,
    hasCriticalErrors: importableCount === 0,
    importableCount,
    skippedCount,
  };
}
