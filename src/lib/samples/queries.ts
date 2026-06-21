import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { SampleDetail, SampleListItem } from "@/types/sample";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getSamplesForTenant(limit = 50): Promise<SampleListItem[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("samples")
    .select(
      `
      id,
      sample_number,
      status,
      sent_at,
      follow_up_date,
      created_at,
      customers ( company_name, city, state ),
      sample_items ( id )
    `
    )
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const customer = unwrapRelation(row.customers);
    const items = row.sample_items as Array<{ id: string }> | null;

    return {
      id: row.id,
      sample_number: row.sample_number,
      status: row.status,
      sent_at: row.sent_at,
      follow_up_date: row.follow_up_date,
      created_at: row.created_at,
      customer: {
        company_name: customer?.company_name ?? "—",
        city: customer?.city ?? null,
        state: customer?.state ?? null,
      },
      items_count: items?.length ?? 0,
    };
  });
}

export async function getSampleById(id: string): Promise<SampleDetail | null> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("samples")
    .select(
      `
      id,
      sample_number,
      status,
      sent_at,
      delivered_at,
      feedback,
      feedback_at,
      follow_up_date,
      auto_follow_up,
      notes,
      created_at,
      customers (
        id,
        company_name,
        city,
        state,
        email,
        phone
      ),
      sample_items (
        id,
        product_id,
        quantity,
        status,
        feedback,
        products ( internal_code, commercial_name ),
        product_packages ( name )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const customer = unwrapRelation(data.customers);

  const items = ((data.sample_items ?? []) as Array<Record<string, unknown>>).map(
    (item) => {
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
        status: String(item.status),
        feedback: item.feedback ? String(item.feedback) : null,
      };
    }
  );

  return {
    id: data.id,
    sample_number: data.sample_number,
    status: data.status,
    sent_at: data.sent_at,
    delivered_at: data.delivered_at,
    feedback: data.feedback,
    feedback_at: data.feedback_at,
    follow_up_date: data.follow_up_date,
    auto_follow_up: data.auto_follow_up,
    notes: data.notes,
    created_at: data.created_at,
    customer: {
      id: customer?.id ?? "",
      company_name: customer?.company_name ?? "—",
      city: customer?.city ?? null,
      state: customer?.state ?? null,
      email: customer?.email ?? null,
      phone: customer?.phone ?? null,
    },
    items,
  };
}
