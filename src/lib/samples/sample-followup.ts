import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

function addDaysFrom(base: Date, days: number): string {
  const date = new Date(base);
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

function dateOnlyFromIso(iso: string): string {
  return iso.slice(0, 10);
}

export async function createSampleFollowups(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    sampleId: string;
    sampleNumber: string;
    customerId: string;
    sellerId: string;
    sentAt?: string | null;
  }
): Promise<void> {
  const { count, error: countError } = await supabase
    .from("followups")
    .select("*", { count: "exact", head: true })
    .eq("related_type", "sample")
    .eq("related_id", params.sampleId);

  if (countError) {
    console.error("Erro ao verificar follow-ups da amostra:", countError.message);
    return;
  }

  if ((count ?? 0) > 0) return;

  const base = params.sentAt ? new Date(params.sentAt) : new Date();
  const label = params.sampleNumber || "amostra";

  const followups = [
    {
      tenant_id: params.tenantId,
      customer_id: params.customerId,
      seller_id: params.sellerId,
      related_type: "sample",
      related_id: params.sampleId,
      title: `Follow-up amostra ${label} — 2 dias`,
      due_at: addDaysFrom(base, 2),
      status: "pendente",
      notes: "Confirmar recebimento da amostra pelo cliente.",
    },
    {
      tenant_id: params.tenantId,
      customer_id: params.customerId,
      seller_id: params.sellerId,
      related_type: "sample",
      related_id: params.sampleId,
      title: `Follow-up amostra ${label} — 7 dias`,
      due_at: addDaysFrom(base, 7),
      status: "pendente",
      notes: "Coletar retorno técnico inicial sobre a amostra.",
    },
    {
      tenant_id: params.tenantId,
      customer_id: params.customerId,
      seller_id: params.sellerId,
      related_type: "sample",
      related_id: params.sampleId,
      title: `Follow-up amostra ${label} — 15 dias`,
      due_at: addDaysFrom(base, 15),
      status: "pendente",
      notes: "Retorno comercial pós-teste da amostra.",
    },
    {
      tenant_id: params.tenantId,
      customer_id: params.customerId,
      seller_id: params.sellerId,
      related_type: "sample",
      related_id: params.sampleId,
      title: `Conversão — amostra ${label}`,
      due_at: addDaysFrom(base, 15),
      status: "pendente",
      notes:
        "Tentativa de conversão: gerar cotação ou pedido com base no feedback da amostra.",
    },
  ];

  const { error: insertError } = await supabase.from("followups").insert(followups);

  if (insertError) {
    console.error("Erro ao registrar follow-ups da amostra:", insertError.message);
    return;
  }

  await supabase
    .from("samples")
    .update({
      followups_scheduled: true,
      follow_up_date: dateOnlyFromIso(addDaysFrom(base, 2)),
      auto_follow_up: true,
    })
    .eq("id", params.sampleId);
}
