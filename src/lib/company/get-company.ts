import { createAdminClient } from "@/lib/supabase/admin";
import { calculateBrlFromUsd, getActivePtaxRate } from "@/lib/pricing/ptax";
import { resolveProductDescription } from "@/lib/products/description";
import { getTenantId } from "@/lib/products/import/persist-import";

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
  pricing_currency: "USD" | "BRL";
}

export async function getProductsForTenant(
  limit = 500
): Promise<{
  products: ProductListItem[];
  total: number;
  ptax: Awaited<ReturnType<typeof getActivePtaxRate>>;
}> {
  const admin = createAdminClient();
  const tenantId = await getTenantId();
  const ptax = await getActivePtaxRate();

  const { count } = await admin
    .from("products")
    .select("*", { count: "exact", head: true })
    .eq("tenant_id", tenantId);

  const { data, error } = await admin
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
        status
      )
    `
    )
    .eq("tenant_id", tenantId)
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
    const pricingCurrency = priceUsd != null ? "USD" : "BRL";
    const priceBrlDisplay =
      priceBrl ??
      (priceUsd != null ? calculateBrlFromUsd(priceUsd, ptax.rate) : null);

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
  const admin = createAdminClient();
  const tenantId = await getTenantId();

  const { data: company } = await admin
    .from("companies")
    .select(
      "legal_name, trade_name, cnpj, state_registration, municipal_registration, email, phone, website, address_line, neighborhood, city, state, zip_code"
    )
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .maybeSingle();

  const { data: payment } = await admin
    .from("payment_accounts")
    .select(
      "name, bank_name, agency, account_number, pix_key, holder_name, holder_document"
    )
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .maybeSingle();

  return { company, payment };
}
