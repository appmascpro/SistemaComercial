import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { CustomerDetail, CustomerListItem } from "@/types/customer";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getCustomersForTenant(
  limit = 100
): Promise<{ customers: CustomerListItem[]; total: number }> {
  const { supabase } = await createTenantClient();

  const { count } = await supabase
    .from("customers")
    .select("*", { count: "exact", head: true });

  const { data, error } = await supabase
    .from("customers")
    .select(
      "id, company_name, trade_name, document, document_type, city, state, email, phone, segment, status, created_at"
    )
    .order("company_name", { ascending: true })
    .limit(limit);

  if (error) throw new Error(error.message);

  return {
    customers: (data ?? []) as CustomerListItem[],
    total: count ?? data?.length ?? 0,
  };
}

export async function getCustomerById(id: string): Promise<CustomerDetail | null> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("customers")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const [{ count: quotesCount }, { count: ordersCount }] = await Promise.all([
    supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", id),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("customer_id", id),
  ]);

  return {
    id: data.id,
    company_name: data.company_name,
    trade_name: data.trade_name,
    document: data.document,
    document_type: data.document_type,
    segment: data.segment,
    purchase_potential: data.purchase_potential,
    email: data.email,
    phone: data.phone,
    address_line: data.address_line,
    address_number: data.address_number,
    address_complement: data.address_complement,
    neighborhood: data.neighborhood,
    city: data.city,
    state: data.state,
    zip_code: data.zip_code,
    country: data.country,
    status: data.status,
    notes: data.notes,
    created_at: data.created_at,
    stats: {
      quotes_count: quotesCount ?? 0,
      orders_count: ordersCount ?? 0,
    },
  };
}

export async function getCustomerQuotes(customerId: string, limit = 10) {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("quotes")
    .select("id, quote_number, status, total, created_at, valid_until")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function getCustomerOrders(customerId: string, limit = 10) {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("orders")
    .select("id, order_number, status, total, created_at, quote_id")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);
  return data ?? [];
}

export { unwrapRelation };
