import "server-only";

import { getActivePtaxRate } from "@/lib/pricing/ptax";
import { resolveQuoteGrossPrices } from "@/lib/quotes/quote-pricing-core";
import { createTenantClient } from "@/lib/supabase/tenant-db";

export interface ProductQuotePricing {
  pricing_currency: "USD" | "BRL";
  ipi_rate: number;
  icms_rate: number;
  ptax_rate: number;
  /** Bruto com ICMS 18% — moeda de referência na cotação */
  unit_price_usd: number | null;
  min_price_usd: number | null;
  max_price_usd: number | null;
  /** Bruto com ICMS 18% em BRL (PTAX atual) */
  list_price: number;
  min_price: number;
  max_price: number;
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
      ),
      tax_rules (
        region,
        ipi_rate,
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

  const ipiRule = ((data.tax_rules ?? []) as Array<{
    region: string;
    ipi_rate: number;
    status: string;
  }>).find((r) => r.region === "ipi" && r.status === "ativo");

  const ipiRate = Number(ipiRule?.ipi_rate ?? 0);

  try {
    const gross = resolveQuoteGrossPrices({
      price_usd: match.price_usd != null ? Number(match.price_usd) : null,
      price_brl: match.price_brl != null ? Number(match.price_brl) : null,
      min_price: match.min_price != null ? Number(match.min_price) : null,
      max_price: match.max_price != null ? Number(match.max_price) : null,
      ipi_rate: ipiRate,
      ptax_rate: ptax.rate,
    });

    return {
      pricing_currency: gross.pricing_currency,
      ipi_rate: gross.ipi_rate,
      icms_rate: gross.icms_rate,
      ptax_rate: ptax.rate,
      unit_price_usd: gross.gross_usd,
      min_price_usd: gross.gross_min_usd,
      max_price_usd: gross.gross_max_usd,
      list_price: gross.gross_brl,
      min_price: gross.gross_min_brl,
      max_price: gross.gross_max_brl,
    };
  } catch {
    return null;
  }
}
