import { createTenantClient } from "@/lib/supabase/tenant-db";
import { calculateBrlFromUsd, getActivePtaxRate } from "@/lib/pricing/ptax";
import { resolveProductDescription } from "@/lib/products/description";
import { resolveQuoteGrossPrices } from "@/lib/quotes/quote-pricing-core";

export interface ProductListItem {
  id: string;
  internal_code: string;
  commercial_name: string;
  description: string | null;
  inci_name: string | null;
  status: string;
  unit: string;
  price_brl: number | null;
  price_usd: number | null;
  price_brl_display: number | null;
  min_price_brl: number | null;
  max_price_brl: number | null;
  min_price_usd: number | null;
  max_price_usd: number | null;
  ipi_rate: number | null;
  pricing_currency: "USD" | "BRL";
}

export async function getProductsForTenant(
  limit = 500
): Promise<{
  products: ProductListItem[];
  total: number;
  ptax: Awaited<ReturnType<typeof getActivePtaxRate>>;
}> {
  const { supabase } = await createTenantClient();
  const ptax = await getActivePtaxRate();

  const { count } = await supabase
    .from("products")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      internal_code,
      commercial_name,
      inci_name,
      status,
      unit,
      technical_notes,
      product_prices (
        price_brl,
        price_usd,
        min_price,
        max_price,
        status
      ),
      tax_rules (
        region,
        ipi_rate,
        status
      )
    `
    )
    .order("internal_code", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  const products: ProductListItem[] = (data ?? []).map((product) => {
    const activePrice = (product.product_prices ?? []).find(
      (p: { status: string }) => p.status === "ativo"
    );

    const priceUsd = activePrice?.price_usd ?? null;
    const priceBrl = activePrice?.price_brl ?? null;
    const minNet = activePrice?.min_price ?? null;
    const maxNet = activePrice?.max_price ?? null;
    const pricingCurrency = priceUsd != null ? "USD" : "BRL";
    const priceBrlDisplay =
      priceBrl ??
      (priceUsd != null ? calculateBrlFromUsd(priceUsd, ptax.rate) : null);

    const ipiRule = (product.tax_rules ?? []).find(
      (rule: { region: string; status: string }) =>
        rule.region === "ipi" && rule.status === "ativo"
    );
    const ipiRaw =
      ipiRule?.ipi_rate != null ? Number(ipiRule.ipi_rate) : null;
    const ipi_rate =
      ipiRaw != null && ipiRaw > 0 ? ipiRaw : null;
    const ipiForCalc = ipi_rate ?? 0;

    let min_price_brl: number | null = null;
    let max_price_brl: number | null = null;
    let min_price_usd: number | null = null;
    let max_price_usd: number | null = null;

    if (
      priceUsd != null ||
      priceBrl != null ||
      minNet != null ||
      maxNet != null
    ) {
      try {
        const gross = resolveQuoteGrossPrices({
          price_usd: priceUsd != null ? Number(priceUsd) : null,
          price_brl: priceBrl != null ? Number(priceBrl) : null,
          min_price: minNet != null ? Number(minNet) : null,
          max_price: maxNet != null ? Number(maxNet) : null,
          ipi_rate: ipiForCalc,
          ptax_rate: ptax.rate,
        });
        min_price_brl = gross.gross_min_brl;
        max_price_brl = gross.gross_max_brl;
        min_price_usd = gross.gross_min_usd;
        max_price_usd = gross.gross_max_usd;
      } catch {
        /* preço incompleto */
      }
    }

    return {
      id: product.id,
      internal_code: product.internal_code,
      commercial_name: product.commercial_name,
      description: resolveProductDescription(null, product.technical_notes),
      inci_name: product.inci_name,
      status: product.status,
      unit: product.unit,
      price_brl: priceBrl,
      price_usd: priceUsd,
      price_brl_display: priceBrlDisplay,
      min_price_brl,
      max_price_brl,
      min_price_usd,
      max_price_usd,
      ipi_rate,
      pricing_currency: pricingCurrency,
    };
  });

  return { products, total: count ?? products.length, ptax };
}

export interface CompanyProfile {
  legal_name: string;
  trade_name: string | null;
  cnpj: string | null;
  state_registration: string | null;
  municipal_registration: string | null;
  email: string | null;
  phone: string | null;
  website: string | null;
  address_line: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export interface PaymentAccountProfile {
  name: string;
  bank_name: string | null;
  agency: string | null;
  account_number: string | null;
  pix_key: string | null;
  holder_name: string | null;
  holder_document: string | null;
}

export async function getCompanyProfile(): Promise<{
  company: CompanyProfile | null;
  payment: PaymentAccountProfile | null;
}> {
  const { supabase } = await createTenantClient();

  const { data: company } = await supabase
    .from("companies")
    .select(
      "legal_name, trade_name, cnpj, state_registration, municipal_registration, email, phone, website, address_line, neighborhood, city, state, zip_code"
    )
    .eq("is_default", true)
    .maybeSingle();

  const { data: payment } = await supabase
    .from("payment_accounts")
    .select(
      "name, bank_name, agency, account_number, pix_key, holder_name, holder_document"
    )
    .eq("is_default", true)
    .maybeSingle();

  return { company, payment };
}
