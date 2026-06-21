import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";
import { dateDaysFromNow } from "@/lib/utils";

function addDaysIso(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString();
}

export async function createOrderVisitAndFollowups(
  supabase: SupabaseClient,
  params: {
    tenantId: string;
    orderId: string;
    orderNumber: string;
    customerId: string;
    sellerId: string;
    city?: string | null;
    state?: string | null;
  }
): Promise<void> {
  const now = new Date().toISOString();
  const followUp10 = dateDaysFromNow(10);
  const followUp15 = dateDaysFromNow(15);

  const { error: visitError } = await supabase.from("visits").insert({
    tenant_id: params.tenantId,
    customer_id: params.customerId,
    seller_id: params.sellerId,
    contact_type: "presencial",
    visited_at: now,
    conversation_summary: "Pedido feito",
    contact_person_name: "Cliente",
    next_action_date: followUp10,
    city: params.city ?? null,
    state: params.state ?? null,
    notes: `Pedido ${params.orderNumber}. Follow-up em 10 dias para conferir recebimento; segundo contato em 15 dias.`,
    status: "realizada",
  });

  if (visitError) {
    console.error("Erro ao registrar visita do pedido:", visitError.message);
  }

  const followups = [
    {
      tenant_id: params.tenantId,
      customer_id: params.customerId,
      seller_id: params.sellerId,
      related_type: "order",
      related_id: params.orderId,
      title: `Conferir recebimento — pedido ${params.orderNumber}`,
      due_at: addDaysIso(10),
      status: "pendente",
      notes: "Verificar se chegou tudo ok com o pedido.",
    },
    {
      tenant_id: params.tenantId,
      customer_id: params.customerId,
      seller_id: params.sellerId,
      related_type: "order",
      related_id: params.orderId,
      title: `Segundo contato pós-pedido ${params.orderNumber}`,
      due_at: addDaysIso(15),
      status: "pendente",
      notes: "Retorno comercial 15 dias após o pedido.",
    },
  ];

  const { error: followupsError } = await supabase
    .from("followups")
    .insert(followups);

  if (followupsError) {
    console.error("Erro ao registrar follow-ups do pedido:", followupsError.message);
  }
}
