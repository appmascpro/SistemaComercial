export const COMMISSION_DEFAULT_CATEGORY = "__default__";

export interface CommissionCategoryRate {
  id: string;
  category: string;
  commission_rate: number;
}

export interface CommissionRatesConfig {
  defaultRate: number;
  rates: CommissionCategoryRate[];
  /** Categorias existentes nos produtos ainda sem taxa cadastrada */
  unconfiguredCategories: string[];
  usesLegacyMarginRule: boolean;
}
