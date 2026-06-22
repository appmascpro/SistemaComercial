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
    const nextActionDate =
      input.next_action_date?.trim() || defaultNextContactDate();

    const { data: visit, error: visitError } = await supabase
      .from("visits")
      .insert({
        tenant_id: tenantId,
        customer_id: input.customer_id,
        seller_id: profile.id,
        route_id: input.route_id || null,
        contact_type: input.contact_type,
        visited_at: visitedAt,
        conversation_summary: input.conversation_summary.trim(),
        contact_person_name: input.contact_person_name.trim(),
        contact_person_phone: input.contact_person_phone?.trim() || null,
        products_of_interest: input.products_of_interest?.trim() || null,
        next_action: input.next_action?.trim() || null,
        next_action_date: nextActionDate,
        visit_result: input.visit_result || null,
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

    const customerPatch: Record<string, unknown> = {
      last_visit_at: visitedAt,
      next_visit_at: nextActionDate,
      buyer_name: input.contact_person_name.trim(),
    };

    if (input.contact_person_phone?.trim()) {
      customerPatch.buyer_phone = input.contact_person_phone.trim();
    }
    if (input.products_of_interest?.trim()) {
      customerPatch.products_of_interest = input.products_of_interest.trim();
    }
    if (input.pain_point?.trim()) {
      customerPatch.pain_point = input.pain_point.trim();
    }
    if (input.current_supplier?.trim()) {
      customerPatch.current_supplier = input.current_supplier.trim();
    }
    if (input.potential_volume?.trim()) {
      customerPatch.potential_volume = input.potential_volume.trim();
    }
    if (input.lead_status) {
      customerPatch.lead_status = input.lead_status;
    }

    await supabase
      .from("customers")
      .update(customerPatch)
      .eq("id", input.customer_id);

    if (input.route_stop_id) {
      await supabase
        .from("route_stops")
        .update({
          visit_id: visit.id,
          status: "visitado",
          completed_at: new Date().toISOString(),
        })
        .eq("id", input.route_stop_id);

      if (input.route_id) {
        const { count } = await supabase
          .from("route_stops")
          .select("*", { count: "exact", head: true })
          .eq("route_id", input.route_id)
          .neq("status", "visitado");

        if (count === 0) {
          await supabase
            .from("routes")
            .update({
              status: "concluida",
              finished_at: new Date().toISOString(),
            })
            .eq("id", input.route_id);
        } else {
          await supabase
            .from("routes")
            .update({
              status: "em_andamento",
              started_at: new Date().toISOString(),
            })
            .eq("id", input.route_id)
            .eq("status", "planejada");
        }
      }
    }

    revalidatePath("/");
    revalidatePath("/visitas");
    revalidatePath("/clientes");
    revalidatePath("/rotas");
    revalidatePath("/rotas/hoje");
    revalidatePath(`/clientes/${input.customer_id}`);
    if (input.route_id) {
      revalidatePath(`/rotas/${input.route_id}`);
    }

    return {
      success: "Contato registrado e histórico atualizado.",
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
