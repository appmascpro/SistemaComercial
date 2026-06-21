"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { VisitContactType } from "@/types/visit";

export interface FollowupActionState {
  error?: string;
  success?: string;
}

export async function completeOrderFollowupAction(input: {
  followupId: string;
  contact_type?: VisitContactType;
  conversation_summary?: string;
  contact_person_name?: string;
  contact_person_phone?: string;
  next_action_date?: string;
}): Promise<FollowupActionState> {
  try {
    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();

    const { data: followup, error: fetchError } = await supabase
      .from("followups")
      .select(
        `
        id,
        title,
        notes,
        status,
        related_id,
        customer_id,
        customers ( company_name, city, state )
      `
      )
      .eq("id", input.followupId)
      .eq("related_type", "order")
      .maybeSingle();

    if (fetchError || !followup) {
      return { error: "Follow-up não encontrado." };
    }

    if (followup.status === "concluido") {
      return { error: "Este follow-up já foi concluído." };
    }

    const customer = Array.isArray(followup.customers)
      ? followup.customers[0]
      : followup.customers;

    const summary =
      input.conversation_summary?.trim() ||
      `Follow-up concluído: ${followup.title ?? "pedido"}`;

    const { error: visitError } = await supabase.from("visits").insert({
      tenant_id: tenantId,
      customer_id: followup.customer_id,
      seller_id: profile.id,
      contact_type: input.contact_type ?? "whatsapp",
      visited_at: new Date().toISOString(),
      conversation_summary: summary,
      contact_person_name: input.contact_person_name?.trim() || "Cliente",
      contact_person_phone: input.contact_person_phone?.trim() || null,
      next_action_date: input.next_action_date?.trim() || null,
      city: customer?.city ?? null,
      state: customer?.state ?? null,
      notes: followup.notes,
      status: "realizada",
    });

    if (visitError) {
      throw new Error(visitError.message);
    }

    const { error: updateError } = await supabase
      .from("followups")
      .update({
        status: "concluido",
        completed_at: new Date().toISOString(),
        notes: input.conversation_summary?.trim()
          ? `${followup.notes ?? ""}\n\nContato: ${input.conversation_summary.trim()}`.trim()
          : followup.notes,
      })
      .eq("id", input.followupId);

    if (updateError) throw new Error(updateError.message);

    revalidatePath("/");
    revalidatePath("/visitas");
    revalidatePath(`/pedidos/${followup.related_id}`);

    return { success: "Follow-up registrado e concluído." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível concluir o follow-up.",
    };
  }
}
