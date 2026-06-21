import "server-only";

import { calculateBrlFromUsd, getActivePtaxRate } from "@/lib/pricing/ptax";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import { parseMetadata } from "@/lib/quotes/build-items";
import type {
  CustomerSearchResult,
  ProductSearchResult,
  QuoteDetail,
  QuoteListItem,
} from "@/types/quote";

export async function getQuotesForTenant(limit = 50): Promise<QuoteListItem[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      quote_number,
      status,
      valid_until,
      total,
      created_at,
      customers (
        company_name,
        city,
        state
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => {
    const customer = (Array.isArray(row.customers)
      ? row.customers[0]
      : row.customers) as {
      company_name: string;
      city: string | null;
      state: string | null;
    };

    return {
      id: row.id,
      quote_number: row.quote_number,
      status: row.status,
      valid_until: row.valid_until,
      total: Number(row.total),
      created_at: row.created_at,
      customer: {
        company_name: customer?.company_name ?? "—",
        city: customer?.city ?? null,
        state: customer?.state ?? null,
      },
    };
  });
}

export async function getQuoteById(id: string): Promise<QuoteDetail | null> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      quote_number,
      status,
      valid_until,
      customer_state,
      notes,
      subtotal,
      discount_total,
      icms_total,
      ipi_total,
      tax_total,
      total,
      created_at,
      internal_notes,
      customers (
        id,
        company_name,
        trade_name,
        document,
        email,
        phone,
        city,
        state
      ),
      quote_items (
        id,
        product_id,
        package_id,
        quantity,
        unit_price,
        min_price,
        max_price,
        discount_percent,
        discount_amount,
        icms_rate,
        icms_amount,
        ipi_rate,
        ipi_amount,
        line_subtotal,
        line_total,
        sort_order,
        products (
          internal_code,
          commercial_name
        ),
        product_packages (
          name
        )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) return null;

  const customer = (Array.isArray(data.customers)
    ? data.customers[0]
    : data.customers) as {
    id: string;
    company_name: string;
    trade_name: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
  };

  const items = ((data.quote_items ?? []) as Array<Record<string, unknown>>)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
    )
    .map((item) => {
      const productRaw = item.products as
        | { internal_code: string; commercial_name: string }
        | { internal_code: string; commercial_name: string }[]
        | null;
      const product = Array.isArray(productRaw) ? productRaw[0] : productRaw;
      const pkgRaw = item.product_packages as
        | { name: string }
        | { name: string }[]
        | null;
      const pkg = Array.isArray(pkgRaw) ? pkgRaw[0] : pkgRaw;

      return {
        id: String(item.id),
        product_id: String(item.product_id),
        package_id: item.package_id ? String(item.package_id) : null,
        product_code: product?.internal_code ?? "—",
        product_name: product?.commercial_name ?? "—",
        package_name: pkg?.name ?? null,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        min_price: item.min_price != null ? Number(item.min_price) : null,
        max_price: item.max_price != null ? Number(item.max_price) : null,
        discount_percent: Number(item.discount_percent),
        discount_amount: Number(item.discount_amount),
        icms_rate: Number(item.icms_rate),
        icms_amount: Number(item.icms_amount),
        ipi_rate: Number(item.ipi_rate),
        ipi_amount: Number(item.ipi_amount),
        line_subtotal: Number(item.line_subtotal),
        line_total: Number(item.line_total),
        sort_order: Number(item.sort_order),
      };
    });

  return {
    id: data.id,
    quote_number: data.quote_number,
    status: data.status,
    valid_until: data.valid_until,
    customer_state: data.customer_state,
    notes: data.notes,
    subtotal: Number(data.subtotal),
    discount_total: Number(data.discount_total),
    icms_total: Number(data.icms_total),
    ipi_total: Number(data.ipi_total),
    tax_total: Number(data.tax_total),
    total: Number(data.total),
    created_at: data.created_at,
    metadata: parseMetadata(data.internal_notes),
    customer,
    items,
  };
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const { supabase } = await createTenantClient();
  const ptax = await getActivePtaxRate();
  const term = query.trim();

  let builder = supabase
    .from("products")
    .select(
      `
      id,
      internal_code,
      commercial_name,
      unit,
      product_prices (
        price_usd,
        price_brl,
        status
      ),
      product_packages (
        id,
        name,
        is_default,
        status
      )
    `
    )
    .eq("status", "ativo")
    .order("commercial_name", { ascending: true })
    .limit(20);

  if (term) {
    builder = builder.or(
      `commercial_name.ilike.%${term}%,internal_code.ilike.%${term}%`
    );
  }

  const { data, error } = await builder;
  if (error) throw new Error(error.message);

  return (data ?? []).map((product) => {
    const activePrice = (product.product_prices ?? []).find(
      (p: { status: string }) => p.status === "ativo"
    );
    const priceUsd = activePrice?.price_usd ?? null;
    const priceBrl = activePrice?.price_brl ?? null;

    return {
      id: product.id,
      internal_code: product.internal_code,
      commercial_name: product.commercial_name,
      unit: product.unit,
      price_brl_display:
        priceBrl ??
        (priceUsd != null
          ? calculateBrlFromUsd(Number(priceUsd), ptax.rate)
          : null),
      pricing_currency: priceUsd != null ? "USD" : "BRL",
      packages: (product.product_packages ?? [])
        .filter((p: { status: string }) => p.status === "ativo")
        .map((p: { id: string; name: string; is_default: boolean }) => ({
          id: p.id,
          name: p.name,
          is_default: p.is_default,
        })),
    };
  });
}

export async function searchCustomers(
  query: string
): Promise<CustomerSearchResult[]> {
  const { supabase } = await createTenantClient();
  const term = query.trim();

  let builder = supabase
    .from("customers")
    .select("id, company_name, city, state, document")
    .eq("status", "ativo")
    .order("company_name", { ascending: true })
    .limit(20);

  if (term) {
    builder = builder.or(
      `company_name.ilike.%${term}%,document.ilike.%${term}%`
    );
  }

  const { data, error } = await builder;
  if (error) throw new Error(error.message);

  return data ?? [];
}

export async function getQuoteForPdf(id: string) {
  const quote = await getQuoteById(id);
  if (!quote) return null;

  const { getCompanyProfile } = await import("@/lib/company/get-company");
  const { company, payment } = await getCompanyProfile();

  return { quote, company, payment };
}
