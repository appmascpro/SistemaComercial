import "server-only";

import { parseMetadata } from "@/lib/quotes/build-items";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { OrderDetail, OrderListItem } from "@/types/order";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getOrdersForTenant(limit = 50): Promise<OrderListItem[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      total,
      ordered_at,
      created_at,
      quote_id,
      customers (
        company_name,
        city,
        state
      ),
      quotes (
        quote_number
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const customer = unwrapRelation(row.customers);
    const quote = unwrapRelation(row.quotes);

    return {
      id: row.id,
      order_number: row.order_number,
      status: row.status,
      total: Number(row.total),
      ordered_at: row.ordered_at,
      created_at: row.created_at,
      quote_id: row.quote_id,
      customer: {
        company_name: customer?.company_name ?? "—",
        city: customer?.city ?? null,
        state: customer?.state ?? null,
      },
      quote_number: quote?.quote_number ?? null,
    };
  });
}

export async function getOrderById(id: string): Promise<OrderDetail | null> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      status,
      payment_terms,
      payment_method,
      subtotal,
      discount_total,
      icms_total,
      ipi_total,
      tax_total,
      total,
      ordered_at,
      notes,
      created_at,
      quote_id,
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
      quotes (
        quote_number
      ),
      order_items (
        id,
        product_id,
        quantity,
        unit_price,
        discount_percent,
        icms_rate,
        ipi_rate,
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

  if (error) throw new Error(error.message);
  if (!data) return null;

  const customer = unwrapRelation(data.customers);
  const quote = unwrapRelation(data.quotes);

  const items = ((data.order_items ?? []) as Array<Record<string, unknown>>)
    .sort((a, b) => Number(a.sort_order ?? 0) - Number(b.sort_order ?? 0))
    .map((item) => {
      const product = unwrapRelation(
        item.products as
          | { internal_code: string; commercial_name: string }
          | { internal_code: string; commercial_name: string }[]
      );
      const pkg = unwrapRelation(
        item.product_packages as { name: string } | { name: string }[] | null
      );

      return {
        id: String(item.id),
        product_id: String(item.product_id),
        product_code: product?.internal_code ?? "—",
        product_name: product?.commercial_name ?? "—",
        package_name: pkg?.name ?? null,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        discount_percent: Number(item.discount_percent),
        icms_rate: Number(item.icms_rate),
        ipi_rate: Number(item.ipi_rate),
        line_total: Number(item.line_total),
      };
    });

  return {
    id: data.id,
    order_number: data.order_number,
    status: data.status,
    payment_terms: data.payment_terms,
    payment_method: data.payment_method,
    subtotal: Number(data.subtotal),
    discount_total: Number(data.discount_total),
    icms_total: Number(data.icms_total),
    ipi_total: Number(data.ipi_total),
    tax_total: Number(data.tax_total),
    total: Number(data.total),
    ordered_at: data.ordered_at,
    notes: data.notes,
    created_at: data.created_at,
    quote_id: data.quote_id,
    quote_number: quote?.quote_number ?? null,
    customer: {
      id: customer?.id ?? "",
      company_name: customer?.company_name ?? "—",
      trade_name: customer?.trade_name ?? null,
      document: customer?.document ?? null,
      email: customer?.email ?? null,
      phone: customer?.phone ?? null,
      city: customer?.city ?? null,
      state: customer?.state ?? null,
    },
    items,
  };
}

export async function getOrderByQuoteId(quoteId: string) {
  const { supabase } = await createTenantClient();

  const { data } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .eq("quote_id", quoteId)
    .maybeSingle();

  return data;
}

export async function getQuoteForConversion(quoteId: string) {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("quotes")
    .select(
      `
      id,
      quote_number,
      status,
      customer_id,
      seller_id,
      subtotal,
      discount_total,
      icms_total,
      ipi_total,
      tax_total,
      total,
      notes,
      internal_notes,
      quote_items (
        id,
        product_id,
        package_id,
        quantity,
        unit_price,
        discount_percent,
        discount_amount,
        icms_rate,
        icms_amount,
        ipi_rate,
        ipi_amount,
        line_subtotal,
        line_total,
        sort_order
      )
    `
    )
    .eq("id", quoteId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const metadata = parseMetadata(data.internal_notes);
  return { quote: data, metadata };
}
