import {
  resolvePricesFromCurrency,
} from "@/lib/pricing/currency";
import type {
  ImportFieldKey,
  ImportProfile,
  PackageImportType,
  ParsedProductRow,
  ProductPackageImport,
} from "./types";
import {
  buildHeaderMap,
  mergeTechnicalNotes,
  parseNumeric,
  parseStockOrStatus,
  parseString,
} from "./header-map";

function isRowEmpty(values: Record<string, unknown>): boolean {
  return Object.values(values).every(
    (value) => value === null || value === undefined || String(value).trim() === ""
  );
}

function getFieldValue(
  row: Record<string, unknown>,
  mappedFields: Partial<Record<ImportFieldKey, string>>,
  field: ImportFieldKey
): unknown {
  const header = mappedFields[field];
  if (!header) return null;
  return row[header] ?? null;
}

function isPackageAvailable(value: unknown): boolean {
  const text = parseString(value);
  if (!text) return false;
  const upper = text.toUpperCase();
  return upper === "S" || upper === "SIM" || upper === "X" || upper === "1";
}

function extractPackages(
  rawRow: Record<string, unknown>,
  mappedFields: Partial<Record<ImportFieldKey, string>>,
  headers: string[]
): ProductPackageImport[] {
  const packages: ProductPackageImport[] = [];
  const seen = new Set<string>();

  const addPackage = (name: string, type: PackageImportType) => {
    const trimmed = name.trim();
    if (!trimmed || seen.has(`${type}:${trimmed}`)) return;
    seen.add(`${type}:${trimmed}`);
    packages.push({ name: trimmed, type });
  };

  const fractional = parseString(
    getFieldValue(rawRow, mappedFields, "package_fractional")
  );
  const industrial = parseString(
    getFieldValue(rawRow, mappedFields, "package_industrial")
  );
  const general = parseString(
    getFieldValue(rawRow, mappedFields, "package_name")
  );

  if (fractional) addPackage(fractional, "fracionada");
  if (industrial) addPackage(industrial, "industrial");
  if (general && !general.toLowerCase().includes("embalagen")) {
    addPackage(general, "geral");
  }

  for (const header of headers) {
    const match = header.match(/^EMBALAGEM_(\d+(?:[.,]\d+)?)/i);
    if (!match) continue;

    const value = rawRow[header];
    if (!isPackageAvailable(value) && !parseNumeric(value)) continue;

    const size = match[1].replace(",", ".");
    addPackage(`${size} kg`, "geral");
  }

  return packages;
}

function buildTechnicalNotes(
  description: string | null,
  ncm: string | null,
  baseNotes: string | null,
  extras: Record<string, string>
): string | null {
  const lines: string[] = [];

  if (description) lines.push(`Descrição: ${description}`);
  if (ncm) lines.push(`NCM: ${ncm}`);
  if (baseNotes) lines.push(baseNotes);

  const merged = mergeTechnicalNotes(lines.join("\n") || null, extras);
  return merged;
}

export function mapRowToParsedProduct(
  rawRow: Record<string, unknown>,
  rowNumber: number,
  mappedFields: Partial<Record<ImportFieldKey, string>>,
  headers: string[],
  profile: ImportProfile
): ParsedProductRow {
  const extra_fields: Record<string, string> = {};

  if (profile.captureExtraColumns) {
    for (const header of headers) {
      if (header.startsWith("coluna_")) continue;
      const value = parseString(rawRow[header]);
      if (value) extra_fields[header] = value;
    }
  }

  const statusRaw = parseString(getFieldValue(rawRow, mappedFields, "status"));
  const stockFromStatus = parseStockOrStatus(statusRaw);
  const stockFromField = parseNumeric(
    getFieldValue(rawRow, mappedFields, "stock_quantity")
  );

  const currency = parseString(getFieldValue(rawRow, mappedFields, "currency"));
  const netPrice = parseNumeric(getFieldValue(rawRow, mappedFields, "net_price"));
  const pricesFromNet = resolvePricesFromCurrency(currency, netPrice);

  const description = parseString(
    getFieldValue(rawRow, mappedFields, "description")
  );
  const ncm = parseString(getFieldValue(rawRow, mappedFields, "ncm"));

  const packages = extractPackages(rawRow, mappedFields, headers);
  const primaryPackage = packages[0]?.name ?? null;

  const priceUsd =
    parseNumeric(getFieldValue(rawRow, mappedFields, "price_usd")) ??
    pricesFromNet.price_usd;
  const priceBrl =
    parseNumeric(getFieldValue(rawRow, mappedFields, "price_brl")) ??
    pricesFromNet.price_brl;

  const defaultIcms = profile.defaultIcmsRates;

  return {
    rowNumber,
    internal_code: parseString(
      getFieldValue(rawRow, mappedFields, "internal_code")
    ),
    commercial_name: parseString(
      getFieldValue(rawRow, mappedFields, "commercial_name")
    ),
    description,
    ncm,
    inci_name: parseString(getFieldValue(rawRow, mappedFields, "inci_name")),
    supplier_name: parseString(
      getFieldValue(rawRow, mappedFields, "supplier_name")
    ),
    category: parseString(getFieldValue(rawRow, mappedFields, "category")),
    subcategory: parseString(
      getFieldValue(rawRow, mappedFields, "subcategory")
    ),
    unit: parseString(getFieldValue(rawRow, mappedFields, "unit")),
    package_name: primaryPackage,
    package_fractional: parseString(
      getFieldValue(rawRow, mappedFields, "package_fractional")
    ),
    package_industrial: parseString(
      getFieldValue(rawRow, mappedFields, "package_industrial")
    ),
    packages,
    currency,
    net_price: netPrice,
    price_usd: priceUsd,
    price_brl: priceBrl,
    min_price: parseNumeric(getFieldValue(rawRow, mappedFields, "min_price")),
    max_price: parseNumeric(getFieldValue(rawRow, mappedFields, "max_price")),
    icms_4: parseNumeric(getFieldValue(rawRow, mappedFields, "icms_4")),
    icms_7:
      parseNumeric(getFieldValue(rawRow, mappedFields, "icms_7")) ??
      defaultIcms?.icms_7 ??
      null,
    icms_12:
      parseNumeric(getFieldValue(rawRow, mappedFields, "icms_12")) ??
      defaultIcms?.icms_12 ??
      null,
    icms_18:
      parseNumeric(getFieldValue(rawRow, mappedFields, "icms_18")) ??
      defaultIcms?.icms_18 ??
      null,
    ipi_rate: parseNumeric(getFieldValue(rawRow, mappedFields, "ipi_rate")),
    stock_quantity: stockFromField ?? stockFromStatus.stock_quantity,
    status: stockFromStatus.status,
    technical_notes: buildTechnicalNotes(
      description,
      ncm,
      parseString(getFieldValue(rawRow, mappedFields, "technical_notes")),
      extra_fields
    ),
    extra_fields,
  };
}

export { buildHeaderMap } from "./header-map";
