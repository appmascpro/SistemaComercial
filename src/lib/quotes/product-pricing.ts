import "server-only";

import { calculateBrlFromUsd, getActivePtaxRate } from "@/lib/pricing/ptax";
import { resolvePriceBounds } from "@/lib/quotes/markup";
import { createTenantClient } from "@/lib/supabase/tenant-db";

export interface ProductQuotePricing {
  list_price: number;
  min_price: number;
  max_price: number;
  pricing_currency: "USD" | "BRL";
}

export async function getProductQuotePricing(
  productId: string,
  packageId: string | null
): Promise<ProductQuotePricing | null> {
  const { supabase } = await createTenantClient();
  const ptax = await getActivePtaxRate();

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      product_prices (
        price_usd,
        price_brl,
        min_price,
        max_price,
        package_id,
        status
      )
    `
    )
    .eq("id", productId)
    .maybeSingle();

  if (error || !data) return null;

  const active = ((data.product_prices ?? []) as Array<{
    price_usd: number | null;
    price_brl: number | null;
    min_price: number | null;
    max_price: number | null;
    package_id: string | null;
    status: string;
  }>).filter((p) => p.status === "ativo");

  const match =
    (packageId ? active.find((p) => p.package_id === packageId) : null) ??
    active.find((p) => !p.package_id) ??
    active[0];

  if (!match) return null;

  const priceUsd = match.price_usd != null ? Number(match.price_usd) : null;
  const priceBrl = match.price_brl != null ? Number(match.price_brl) : null;
  const listPrice =
    priceBrl ??
    (priceUsd != null ? calculateBrlFromUsd(priceUsd, ptax.rate) : null);

  if (listPrice == null) return null;

  const bounds = resolvePriceBounds(
    listPrice,
    match.min_price != null ? Number(match.min_price) : null,
    match.max_price != null ? Number(match.max_price) : null
  );

  return {
    list_price: bounds.list,
    min_price: bounds.min,
    max_price: bounds.max,
    pricing_currency: priceUsd != null ? "USD" : "BRL",
  };
}
