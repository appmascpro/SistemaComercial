import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import {
  COMMISSION_DEFAULT_CATEGORY,
  type CommissionRatesConfig,
} from "@/types/commission-rate";

export async function getCommissionRatesConfig(): Promise<CommissionRatesConfig> {
  const { supabase } = await createTenantClient();

  const [{ data: rates, error: ratesError }, { data: products, error: productsError }] =
    await Promise.all([
      supabase
        .from("commission_category_rates")
        .select("id, category, commission_rate")
        .eq("status", "ativo")
        .order("category"),
      supabase
        .from("products")
        .select("category")
        .eq("status", "ativo"),
    ]);

  if (ratesError) throw new Error(ratesError.message);
  if (productsError) throw new Error(productsError.message);

  const rows = rates ?? [];
  const defaultRow = rows.find((row) => row.category === COMMISSION_DEFAULT_CATEGORY);
  const categoryRates = rows.filter(
    (row) => row.category !== COMMISSION_DEFAULT_CATEGORY
  );

  const configured = new Set(
    categoryRates.map((row) => row.category.toLowerCase())
  );

  const discovered = new Set<string>();
  for (const product of products ?? []) {
    const category = product.category?.trim();
    if (!category) continue;
    if (!configured.has(category.toLowerCase())) {
      discovered.add(category);
    }
  }

  const hasCustomRules = rows.length > 0;

  return {
    defaultRate: defaultRow ? Number(defaultRow.commission_rate) : 3,
    rates: categoryRates.map((row) => ({
      id: row.id,
      category: row.category,
      commission_rate: Number(row.commission_rate),
    })),
    unconfiguredCategories: [...discovered].sort((a, b) =>
      a.localeCompare(b, "pt-BR")
    ),
    usesLegacyMarginRule: !hasCustomRules,
  };
}

export async function getCommissionRateMap(): Promise<Map<string, number>> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("commission_category_rates")
    .select("category, commission_rate")
    .eq("status", "ativo");

  if (error) throw new Error(error.message);

  const map = new Map<string, number>();
  for (const row of data ?? []) {
    map.set(row.category.toLowerCase(), Number(row.commission_rate));
  }
  return map;
}

export function getDefaultCommissionRate(map: Map<string, number>): number | null {
  const value = map.get(COMMISSION_DEFAULT_CATEGORY);
  return value != null ? value : null;
}
