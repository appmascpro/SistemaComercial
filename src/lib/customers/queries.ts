import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type {
  CustomerDetail,
  CustomerListItem,
  CustomerSampleListItem,
  CustomerVisitHistoryItem,
} from "@/types/customer";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function mapCustomerRow(data: Record<string, unknown>): Omit<CustomerDetail, "stats"> {
  return {
    id: String(data.id),
    company_name: String(data.company_name),
    trade_name: data.trade_name ? String(data.trade_name) : null,
    document: data.document ? String(data.document) : null,
    document_type: data.document_type as CustomerDetail["document_type"],
    segment: data.segment ? String(data.segment) : null,
    customer_type: data.customer_type as CustomerDetail["customer_type"],
    lead_status: data.lead_status as CustomerDetail["lead_status"],
    purchase_potential: data.purchase_potential
      ? String(data.purchase_potential)
      : null,
    potential_volume: data.potential_volume ? String(data.potential_volume) : null,
    products_of_interest: data.products_of_interest
      ? String(data.products_of_interest)
      : null,
    current_supplier: data.current_supplier ? String(data.current_supplier) : null,
    pain_point: data.pain_point ? String(data.pain_point) : null,
    buyer_name: data.buyer_name ? String(data.buyer_name) : null,
    buyer_phone: data.buyer_phone ? String(data.buyer_phone) : null,
    email: data.email ? String(data.email) : null,
    phone: data.phone ? String(data.phone) : null,
    address_line: data.address_line ? String(data.address_line) : null,
    address_number: data.address_number ? String(data.address_number) : null,
    address_complement: data.address_complement
      ? String(data.address_complement)
      : null,
    neighborhood: data.neighborhood ? String(data.neighborhood) : null,
    city: data.city ? String(data.city) : null,
    state: data.state ? String(data.state) : null,
    zip_code: data.zip_code ? String(data.zip_code) : null,
    country: String(data.country ?? "BR"),
    status: String(data.status),
    notes: data.notes ? String(data.notes) : null,
    last_visit_at: data.last_visit_at ? String(data.last_visit_at) : null,
    next_visit_at: data.next_visit_at ? String(data.next_visit_at) : null,
    created_at: String(data.created_at),
  };
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
      "id, company_name, trade_name, document, document_type, city, state, email, phone, segment, lead_status, status, next_visit_at, created_at"
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

  const [
    { count: quotesCount },
    { count: ordersCount },
    { count: samplesCount },
    { count: visitsCount },
  ] = await Promise.all([
    supabase.from("quotes").select("*", { count: "exact", head: true }).eq("customer_id", id),
    supabase.from("orders").select("*", { count: "exact", head: true }).eq("customer_id", id),
    supabase.from("samples").select("*", { count: "exact", head: true }).eq("customer_id", id),
    supabase.from("visits").select("*", { count: "exact", head: true }).eq("customer_id", id),
  ]);

  return {
    ...mapCustomerRow(data as Record<string, unknown>),
    stats: {
      quotes_count: quotesCount ?? 0,
      orders_count: ordersCount ?? 0,
      samples_count: samplesCount ?? 0,
      visits_count: visitsCount ?? 0,
    },
  };
}

export async function getCustomerQuotes(customerId: string, limit = 20) {
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

export async function getCustomerOrders(customerId: string, limit = 20) {
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

export async function getCustomerSamples(
  customerId: string,
  limit = 20
): Promise<CustomerSampleListItem[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("samples")
    .select("id, sample_number, status, sent_at, created_at")
    .eq("customer_id", customerId)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    sample_number: row.sample_number,
    status: row.status,
    sent_at: row.sent_at,
    created_at: row.created_at,
  }));
}

export async function getCustomerVisitHistory(
  customerId: string,
  limit = 30
): Promise<CustomerVisitHistoryItem[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("visits")
    .select(
      `
      id,
      visited_at,
      contact_type,
      conversation_summary,
      contact_person_name,
      contact_person_phone,
      products_of_interest,
      next_action,
      next_action_date,
      notes,
      profiles ( full_name )
    `
    )
    .eq("customer_id", customerId)
    .order("visited_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const seller = unwrapRelation(
      row.profiles as { full_name: string | null } | { full_name: string | null }[] | null
    );

    return {
      id: row.id,
      visited_at: row.visited_at,
      contact_type: row.contact_type,
      conversation_summary: row.conversation_summary,
      contact_person_name: row.contact_person_name,
      contact_person_phone: row.contact_person_phone,
      products_of_interest: row.products_of_interest,
      next_action: row.next_action,
      next_action_date: row.next_action_date,
      notes: row.notes,
      seller_name: seller?.full_name ?? null,
    };
  });
}

export { unwrapRelation };
