import "server-only";

import { getActivePtaxRate } from "@/lib/pricing/ptax";
import { resolveProductDescription } from "@/lib/products/description";
import {
  buildProductSearchOrFilter,
  productMatchesAllTokens,
  tokenizeSearchQuery,
} from "@/lib/products/search";
import { QUOTE_ICMS_RATE, resolveQuoteGrossPrices } from "@/lib/quotes/quote-pricing-core";
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
          commercial_name,
          product_prices (
            price_usd,
            status
          )
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

  const metadata = parseMetadata(data.internal_notes);

  const items = ((data.quote_items ?? []) as Array<Record<string, unknown>>)
    .sort(
      (a, b) =>
        Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0)
    )
    .map((item) => {
      const productRaw = item.products as
        | {
            internal_code: string;
            commercial_name: string;
            product_prices?: Array<{ price_usd: number | null; status: string }>;
          }
        | Array<{
            internal_code: string;
            commercial_name: string;
            product_prices?: Array<{ price_usd: number | null; status: string }>;
          }>
        | null;
      const product = Array.isArray(productRaw) ? productRaw[0] : productRaw;
      const pkgRaw = item.product_packages as
        | { name: string }
        | { name: string }[]
        | null;
      const pkg = Array.isArray(pkgRaw) ? pkgRaw[0] : pkgRaw;

      const activePrices = (product?.product_prices ?? []).filter(
        (p) => p.status === "ativo"
      );
      const hasUsd = activePrices.some((p) => p.price_usd != null);
      const unitPrice = Number(item.unit_price);
      const minPrice = item.min_price != null ? Number(item.min_price) : null;
      const maxPrice = item.max_price != null ? Number(item.max_price) : null;
      const ptax = metadata.ptax;

      return {
        id: String(item.id),
        product_id: String(item.product_id),
        package_id: item.package_id ? String(item.package_id) : null,
        product_code: product?.internal_code ?? "—",
        product_name: product?.commercial_name ?? "—",
        package_name: pkg?.name ?? null,
        quantity: Number(item.quantity),
        unit_price: unitPrice,
        unit_price_usd: hasUsd ? Math.round((unitPrice / ptax) * 100) / 100 : null,
        pricing_currency: hasUsd ? ("USD" as const) : ("BRL" as const),
        min_price: minPrice,
        max_price: maxPrice,
        min_price_usd:
          hasUsd && minPrice != null
            ? Math.round((minPrice / ptax) * 100) / 100
            : null,
        max_price_usd:
          hasUsd && maxPrice != null
            ? Math.round((maxPrice / ptax) * 100) / 100
            : null,
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
    metadata,
    customer,
    items,
  };
}

function mapProductRow(
  product: Record<string, unknown>,
  ptaxRate: number
): ProductSearchResult {
  const activePrices = ((product.product_prices ?? []) as Array<{
    price_usd: number | null;
    price_brl: number | null;
    min_price: number | null;
    max_price: number | null;
    package_id: string | null;
    status: string;
  }>).filter((p) => p.status === "ativo");
  const activePrice =
    activePrices.find((p) => !p.package_id) ?? activePrices[0];

  const ipiRule = ((product.tax_rules ?? []) as Array<{
    region: string;
    ipi_rate: number;
    status: string;
  }>).find((r) => r.region === "ipi" && r.status === "ativo");

  const ipiRate = Number(ipiRule?.ipi_rate ?? 0);

  if (!activePrice) {
    return {
      id: String(product.id),
      internal_code: String(product.internal_code),
      commercial_name: String(product.commercial_name),
      description: resolveProductDescription(
        product.description as string | null,
        product.technical_notes as string | null
      ),
      inci_name: (product.inci_name as string | null) ?? null,
      unit: String(product.unit),
      price_brl_display: null,
      price_usd_display: null,
      min_price: null,
      max_price: null,
      min_price_usd: null,
      max_price_usd: null,
      pricing_currency: "BRL",
      ipi_rate: ipiRate,
      icms_rate: QUOTE_ICMS_RATE,
      packages: [],
    };
  }

  try {
    const gross = resolveQuoteGrossPrices({
      price_usd:
        activePrice.price_usd != null ? Number(activePrice.price_usd) : null,
      price_brl:
        activePrice.price_brl != null ? Number(activePrice.price_brl) : null,
      min_price:
        activePrice.min_price != null ? Number(activePrice.min_price) : null,
      max_price:
        activePrice.max_price != null ? Number(activePrice.max_price) : null,
      ipi_rate: ipiRate,
      ptax_rate: ptaxRate,
    });

    return {
      id: String(product.id),
      internal_code: String(product.internal_code),
      commercial_name: String(product.commercial_name),
      description: resolveProductDescription(
        product.description as string | null,
        product.technical_notes as string | null
      ),
      inci_name: (product.inci_name as string | null) ?? null,
      unit: String(product.unit),
      price_brl_display: gross.gross_brl,
      price_usd_display: gross.gross_usd,
      min_price: gross.gross_min_brl,
      max_price: gross.gross_max_brl,
      min_price_usd: gross.gross_min_usd,
      max_price_usd: gross.gross_max_usd,
      pricing_currency: gross.pricing_currency,
      ipi_rate: gross.ipi_rate,
      icms_rate: gross.icms_rate,
      packages: ((product.product_packages ?? []) as Array<{
        id: string;
        name: string;
        is_default: boolean;
        status: string;
      }>)
        .filter((p) => p.status === "ativo")
        .map((p) => ({
          id: p.id,
          name: p.name,
          is_default: p.is_default,
        })),
    };
  } catch {
    return {
      id: String(product.id),
      internal_code: String(product.internal_code),
      commercial_name: String(product.commercial_name),
      description: null,
      inci_name: null,
      unit: String(product.unit),
      price_brl_display: null,
      price_usd_display: null,
      min_price: null,
      max_price: null,
      min_price_usd: null,
      max_price_usd: null,
      pricing_currency: "BRL",
      ipi_rate: ipiRate,
      icms_rate: QUOTE_ICMS_RATE,
      packages: [],
    };
  }
}

export async function getProductsByIds(
  ids: string[]
): Promise<ProductSearchResult[]> {
  if (ids.length === 0) return [];

  const { supabase } = await createTenantClient();
  const ptax = await getActivePtaxRate();
  const uniqueIds = [...new Set(ids)];

  const { data, error } = await supabase
    .from("products")
    .select(
      `
      id,
      internal_code,
      commercial_name,
      inci_name,
      description,
      technical_notes,
      unit,
      product_prices (
        price_usd,
        price_brl,
        min_price,
        max_price,
        package_id,
        status
      ),
      product_packages (
        id,
        name,
        is_default,
        status
      ),
      tax_rules (
        region,
        ipi_rate,
        status
      )
    `
    )
    .in("id", uniqueIds)
    .eq("status", "ativo");

  if (error) throw new Error(error.message);

  const productMap = new Map(
    (data ?? []).map((product) => [
      product.id,
      mapProductRow(product as Record<string, unknown>, ptax.rate),
    ])
  );

  return uniqueIds
    .map((id) => productMap.get(id))
    .filter((product): product is ProductSearchResult => product != null);
}

export async function searchProducts(query: string): Promise<ProductSearchResult[]> {
  const { supabase } = await createTenantClient();
  const ptax = await getActivePtaxRate();
  const tokens = tokenizeSearchQuery(query);

  let builder = supabase
    .from("products")
    .select(
      `
      id,
      internal_code,
      commercial_name,
      inci_name,
      description,
      technical_notes,
      unit,
      product_prices (
        price_usd,
        price_brl,
        min_price,
        max_price,
        package_id,
        status
      ),
      product_packages (
        id,
        name,
        is_default,
        status
      ),
      tax_rules (
        region,
        ipi_rate,
        status
      )
    `
    )
    .eq("status", "ativo")
    .order("commercial_name", { ascending: true })
    .limit(tokens.length > 0 ? 80 : 20);

  const orFilter = buildProductSearchOrFilter(tokens);
  if (orFilter) {
    builder = builder.or(orFilter);
  }

  const { data, error } = await builder;
  if (error) throw new Error(error.message);

  const filtered = (data ?? []).filter((product) =>
    productMatchesAllTokens(product, tokens)
  );

  return filtered.slice(0, 20).map((product) =>
    mapProductRow(product as Record<string, unknown>, ptax.rate)
  );
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
