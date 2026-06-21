import type { ImportProfile } from "./types";

const STANDARD_COLUMNS: ImportProfile["columns"] = [
  {
    field: "internal_code",
    aliases: [
      "codigo interno",
      "código interno",
      "cod interno",
      "internal_code",
      "sku",
    ],
  },
  {
    field: "commercial_name",
    aliases: [
      "nome comercial",
      "produto",
      "nome do produto",
      "commercial_name",
      "nome",
    ],
    required: true,
  },
  {
    field: "inci_name",
    aliases: ["inci name", "inci", "inci_name", "nome inci"],
  },
  {
    field: "supplier_name",
    aliases: ["fornecedor", "industria", "indústria", "fabricante"],
  },
  {
    field: "category",
    aliases: ["categoria", "category", "grupo"],
  },
  {
    field: "subcategory",
    aliases: ["subcategoria", "sub category"],
  },
  {
    field: "unit",
    aliases: ["unidade", "unit", "und"],
  },
  {
    field: "package_name",
    aliases: [
      "embalagem",
      "embalagem/tamanho",
      "tamanho",
      "package",
      "package_name",
    ],
    required: true,
  },
  {
    field: "price_usd",
    aliases: ["preco em dolar", "preço em dólar", "preco usd", "usd", "dolar"],
  },
  {
    field: "price_brl",
    aliases: ["preco em real", "preço em real", "preco brl", "brl", "real"],
  },
  {
    field: "min_price",
    aliases: ["preco minimo", "preço mínimo", "min_price"],
  },
  {
    field: "max_price",
    aliases: ["preco maximo", "preço máximo", "max_price"],
  },
  {
    field: "icms_4",
    aliases: ["icms 4%", "icms 4", "icms_4"],
  },
  {
    field: "icms_7",
    aliases: ["icms 7%", "icms 7", "icms_7"],
  },
  {
    field: "icms_12",
    aliases: ["icms 12%", "icms 12", "icms_12"],
  },
  {
    field: "icms_18",
    aliases: ["icms 18%", "icms 18", "icms_18"],
  },
  {
    field: "ipi_rate",
    aliases: ["ipi %", "ipi", "ipi_rate", "ipi%"],
  },
  {
    field: "stock_quantity",
    aliases: ["estoque", "stock", "stock_quantity"],
  },
  {
    field: "status",
    aliases: ["status", "situacao", "situação", "estoque/status"],
  },
  {
    field: "technical_notes",
    aliases: ["observacoes tecnicas", "observações técnicas", "observacoes"],
  },
];

/** Colunas de preço calculado — ignoradas (fórmulas Excel) */
export const TAVARES_IGNORED_HEADER_PATTERNS: RegExp[] = [
  /emb\s*industri/i,
  /fracionad/i,
  /preco\s*\/?\s*kg\s*full/i,
  /pre[cç]o\s*\/?\s*kg\s*full/i,
  /com\s*icms/i,
  /^\d+\s*%\s*icms/i,
  /icms\s*\d+\s*%/i,
];

/** Perfil padrão para novas empresas do SaaS */
export const standardProfile: ImportProfile = {
  id: "standard",
  label: "Padrão ConectaInsumos",
  description: "Colunas essenciais para qualquer tenant do sistema.",
  columns: STANDARD_COLUMNS,
};

/** Perfil genérico estendido */
export const principalProfile: ImportProfile = {
  id: "principal",
  label: "Genérico estendido",
  description: "Planilhas com colunas extras preservadas em observações.",
  captureExtraColumns: true,
  columns: STANDARD_COLUMNS,
};

/**
 * Perfil TC Química / Tavares Chemical
 * Importa apenas dados de cadastro; preços com ICMS são calculados no backend.
 */
export const tavaresProfile: ImportProfile = {
  id: "tavares",
  label: "TC Química (Tavares)",
  description:
    "Planilha oficial Tavares. Leitura inteligente — ignora fórmulas ICMS e importa só o que for válido.",
  multiRowHeader: true,
  ignoreHeaderPatterns: TAVARES_IGNORED_HEADER_PATTERNS,
  defaultIcmsRates: { icms_7: 7, icms_12: 12, icms_18: 18 },
  codePrefix: "TAV",
  columns: [
    {
      field: "commercial_name",
      aliases: ["produto"],
      required: true,
    },
    {
      field: "description",
      aliases: ["descricao", "descrição"],
    },
    {
      field: "ncm",
      aliases: ["ncm"],
    },
    {
      field: "package_name",
      aliases: ["embalagem", "embalagens"],
    },
    {
      field: "package_fractional",
      aliases: [
        "embalagem fracionada",
        "fracionada",
        "fracionad",
        "emb fracionada",
      ],
    },
    {
      field: "package_industrial",
      aliases: [
        "embalagem industrial",
        "emb industrial",
        "emb industri",
        "industrial",
      ],
    },
    {
      field: "currency",
      aliases: ["moeda"],
      required: true,
    },
    {
      field: "ipi_rate",
      aliases: ["ipi%", "ipi", "ipi %"],
    },
    {
      field: "net_price",
      aliases: [
        "preco net sem imposto",
        "preço net sem imposto",
        "preco net",
        "preço net",
        "preco net / sem imposto",
        "preço net / sem imposto",
        "preco net/sem imposto",
        "preço net/sem imposto",
      ],
      required: true,
    },
    {
      field: "inci_name",
      aliases: ["inci name", "inci"],
    },
  ],
};

export const importProfiles = [
  tavaresProfile,
  standardProfile,
  principalProfile,
] as const;

export function getImportProfile(id: string) {
  return importProfiles.find((profile) => profile.id === id) ?? tavaresProfile;
}
