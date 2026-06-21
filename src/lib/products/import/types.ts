export type ImportFieldKey =
  | "internal_code"
  | "commercial_name"
  | "description"
  | "ncm"
  | "inci_name"
  | "supplier_name"
  | "category"
  | "subcategory"
  | "unit"
  | "package_name"
  | "package_fractional"
  | "package_industrial"
  | "currency"
  | "net_price"
  | "price_usd"
  | "price_brl"
  | "min_price"
  | "max_price"
  | "icms_4"
  | "icms_7"
  | "icms_12"
  | "icms_18"
  | "ipi_rate"
  | "stock_quantity"
  | "status"
  | "technical_notes";

export type ImportProfileId = "standard" | "principal" | "tavares";

export type PackageImportType = "fracionada" | "industrial" | "geral";

export interface ProductPackageImport {
  name: string;
  type: PackageImportType;
}

export interface ImportColumnMapping {
  field: ImportFieldKey;
  aliases: string[];
  required?: boolean;
}

export interface ImportProfile {
  id: ImportProfileId;
  label: string;
  description: string;
  columns: ImportColumnMapping[];
  /** Colunas extras preservadas em observações (perfil genérico) */
  captureExtraColumns?: boolean;
  /** Colunas de fórmula/preço calculado — ignoradas na importação */
  ignoreHeaderPatterns?: RegExp[];
  /** Usa leitor de planilha com cabeçalho em múltiplas linhas */
  multiRowHeader?: boolean;
  /** ICMS padrão aplicado no backend (alíquotas 7/12/18) */
  defaultIcmsRates?: { icms_7: number; icms_12: number; icms_18: number };
  /** Prefixo para códigos sequenciais (ex.: TAV → TAV-001) */
  codePrefix?: string;
}

export interface ParsedProductRow {
  rowNumber: number;
  internal_code: string | null;
  commercial_name: string | null;
  description: string | null;
  ncm: string | null;
  inci_name: string | null;
  supplier_name: string | null;
  category: string | null;
  subcategory: string | null;
  unit: string | null;
  package_name: string | null;
  package_fractional: string | null;
  package_industrial: string | null;
  packages: ProductPackageImport[];
  currency: string | null;
  net_price: number | null;
  price_usd: number | null;
  price_brl: number | null;
  min_price: number | null;
  max_price: number | null;
  icms_4: number | null;
  icms_7: number | null;
  icms_12: number | null;
  icms_18: number | null;
  ipi_rate: number | null;
  stock_quantity: number | null;
  status: string | null;
  technical_notes: string | null;
  extra_fields: Record<string, string>;
}

export type ValidationSeverity = "error" | "warning";

export interface RowValidationIssue {
  rowNumber: number;
  field?: ImportFieldKey;
  message: string;
  severity: ValidationSeverity;
}

export interface ParsedImportResult {
  profileId: ImportProfileId;
  fileName: string;
  headers: string[];
  mappedFields: Partial<Record<ImportFieldKey, string>>;
  ignoredHeaders: string[];
  unmappedHeaders: string[];
  rows: ParsedProductRow[];
  issues: RowValidationIssue[];
  hasCriticalErrors: boolean;
  /** Linhas que serão importadas (modo tolerante) */
  importableCount?: number;
  /** Linhas ignoradas por falta de dados essenciais */
  skippedCount?: number;
}

export interface ImportPersistRow {
  rowNumber: number;
  internal_code: string;
  commercial_name: string;
  description: string | null;
  ncm: string | null;
  inci_name: string | null;
  supplier_name: string | null;
  category: string | null;
  subcategory: string | null;
  unit: string;
  packages: ProductPackageImport[];
  price_usd: number | null;
  price_brl: number | null;
  min_price: number | null;
  max_price: number | null;
  icms_4: number | null;
  icms_7: number | null;
  icms_12: number | null;
  icms_18: number | null;
  ipi_rate: number | null;
  stock_quantity: number;
  status: string;
  technical_notes: string | null;
}

export interface ImportPersistPayload {
  fileName: string;
  profileId: ImportProfileId;
  rows: ImportPersistRow[];
}

export interface ImportPersistResult {
  success: boolean;
  importId?: string;
  totalRows: number;
  successRows: number;
  errorRows: number;
  errors: Array<{ rowNumber: number; message: string }>;
  message: string;
}
