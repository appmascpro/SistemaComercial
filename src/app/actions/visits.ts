"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { VisitFormInput } from "@/types/visit";

export interface VisitActionState {
  error?: string;
  success?: string;
  visitId?: string;
}

function defaultNextContactDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export async function createVisitAction(
  input: VisitFormInput
): Promise<VisitActionState> {
  try {
    if (!input.customer_id) {
      return { error: "Selecione o cliente." };
    }
    if (!input.conversation_summary.trim()) {
      return { error: "Descreva como foi o contato." };
    }
    if (!input.contact_person_name.trim()) {
      return { error: "Informe com quem falou." };
    }

    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();

    const { data: customer, error: customerError } = await supabase
      .from("customers")
      .select("id, city, state")
      .eq("id", input.customer_id)
      .maybeSingle();

    if (customerError || !customer) {
      return { error: "Cliente não encontrado." };
    }

    const visitedAt = input.visited_at
      ? `${input.visited_at}T12:00:00`
      : new Date().toISOString();

    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        tenant_id: tenantId,
        customer_id: input.customer_id,
        seller_id: profile.id,
        contact_type: input.contact_type,
        visited_at: visitedAt,
        conversation_summary: input.conversation_summary.trim(),
        contact_person_name: input.contact_person_name.trim(),
        contact_person_phone: input.contact_person_phone?.trim() || null,
        next_action_date:
          input.next_action_date?.trim() || defaultNextContactDate(),
        city: customer.city,
        state: customer.state,
        notes: input.notes?.trim() || null,
        status: "realizada",
      })
      .select("id")
      .single();

    if (visitError || !visit) {
      throw new Error(visitError?.message ?? "Erro ao registrar visita.");
    }

    revalidatePath("/");
    revalidatePath("/visitas");

    return {
      success: "Visita registrada com sucesso.",
      visitId: visit.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar a visita.",
    };
  }
}
