import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { SampleFollowupItem } from "@/types/followup";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getSampleFollowupsBySampleId(
  sampleId: string
): Promise<SampleFollowupItem[]> {
  const { supabase } = await createTenantClient();

  const { data: sample, error: sampleError } = await supabase
    .from("samples")
    .select("id, sample_number, status")
    .eq("id", sampleId)
    .maybeSingle();

  if (sampleError || !sample) return [];

  const { data, error } = await supabase
    .from("followups")
    .select(
      `
      id,
      title,
      notes,
      status,
      due_at,
      completed_at,
      created_at,
      customers (
        id,
        company_name,
        city,
        state,
        phone
      )
    `
    )
    .eq("related_type", "sample")
    .eq("related_id", sampleId)
    .order("due_at", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? [])
    .map((row) => {
      const customer = unwrapRelation(row.customers);
      if (!customer) return null;

      return {
        id: String(row.id),
        title: row.title ? String(row.title) : null,
        notes: row.notes ? String(row.notes) : null,
        status: String(row.status) as SampleFollowupItem["status"],
        due_at: String(row.due_at),
        completed_at: row.completed_at ? String(row.completed_at) : null,
        created_at: String(row.created_at),
        sample: {
          id: sample.id,
          sample_number: sample.sample_number,
          status: sample.status,
        },
        customer: {
          id: customer.id,
          company_name: customer.company_name,
          city: customer.city,
          state: customer.state,
          phone: customer.phone,
        },
      };
    })
    .filter((item): item is SampleFollowupItem => item != null);
}
