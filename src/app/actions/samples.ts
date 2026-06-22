"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createSampleFollowups } from "@/lib/samples/sample-followup";
import { generateSampleNumber } from "@/lib/samples/numbering";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type {
  SampleFeedbackInput,
  SampleFormInput,
  SampleStatus,
} from "@/types/sample";

export interface SampleActionState {
  error?: string;
  success?: string;
  sampleId?: string;
}

function normalizeSentAt(value?: string): string | null {
  if (!value?.trim()) return null;
  return `${value.trim()}T12:00:00.000Z`;
}

async function scheduleFollowupsIfNeeded(
  supabase: Awaited<ReturnType<typeof createTenantClient>>["supabase"],
  params: {
    tenantId: string;
    sampleId: string;
    sampleNumber: string;
    customerId: string;
    sellerId: string;
    sentAt: string | null;
    autoFollowUp: boolean;
    alreadyScheduled: boolean;
  }
) {
  if (!params.autoFollowUp || params.alreadyScheduled) return;

  await createSampleFollowups(supabase, {
    tenantId: params.tenantId,
    sampleId: params.sampleId,
    sampleNumber: params.sampleNumber,
    customerId: params.customerId,
    sellerId: params.sellerId,
    sentAt: params.sentAt,
  });
}

export async function createSampleAction(
  input: SampleFormInput
): Promise<SampleActionState> {
  try {
    if (!input.items.length) {
      return { error: "Adicione ao menos um produto à amostra." };
    }

    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();
    const sampleNumber = await generateSampleNumber();
    const sentAt = normalizeSentAt(input.sent_at);
    const initialStatus: SampleStatus = sentAt ? "enviado" : "pendente";

    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .insert({
        tenant_id: tenantId,
        customer_id: input.customer_id,
        seller_id: profile.id,
        sample_number: sampleNumber,
        status: initialStatus,
        sent_at: sentAt,
        carrier_id: input.carrier_id || null,
        carrier_name: input.carrier_name?.trim() || null,
        tracking_code: input.tracking_code?.trim() || null,
        internal_cost:
          input.internal_cost != null && Number.isFinite(input.internal_cost)
            ? input.internal_cost
            : null,
        auto_follow_up: input.auto_follow_up ?? true,
        notes: input.notes?.trim() || null,
      })
      .select("id")
      .single();

    if (sampleError || !sample) {
      throw new Error(sampleError?.message ?? "Erro ao criar amostra.");
    }

    const sampleItems = input.items.map((item) => ({
      tenant_id: tenantId,
      sample_id: sample.id,
      product_id: item.product_id,
      package_id: item.package_id ?? null,
      quantity: item.quantity,
      status: initialStatus === "enviado" ? "enviado" : "pendente",
    }));

    const { error: itemsError } = await supabase
      .from("sample_items")
      .insert(sampleItems);

    if (itemsError) {
      await supabase.from("samples").delete().eq("id", sample.id);
      throw new Error(itemsError.message);
    }

    if (initialStatus === "enviado") {
      await scheduleFollowupsIfNeeded(supabase, {
        tenantId,
        sampleId: sample.id,
        sampleNumber,
        customerId: input.customer_id,
        sellerId: profile.id,
        sentAt,
        autoFollowUp: input.auto_follow_up ?? true,
        alreadyScheduled: false,
      });
    }

    revalidatePath("/");
    revalidatePath("/amostras");
    revalidatePath("/visitas");
    return {
      success: `Amostra ${sampleNumber} registrada.`,
      sampleId: sample.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível salvar a amostra.",
    };
  }
}

export async function updateSampleAction(
  sampleId: string,
  input: SampleFormInput
): Promise<SampleActionState> {
  try {
    if (!input.items.length) {
      return { error: "Adicione ao menos um produto à amostra." };
    }

    const { supabase, tenantId } = await createTenantClient();

    const { data: existing, error: fetchError } = await supabase
      .from("samples")
      .select("id, status, sample_number, seller_id, followups_scheduled, auto_follow_up")
      .eq("id", sampleId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { error: "Amostra não encontrada." };
    }

    if (existing.status !== "pendente") {
      return { error: "Esta amostra não pode mais ser editada." };
    }

    const sentAt = normalizeSentAt(input.sent_at);
    const becomesSent = Boolean(sentAt);

    const { error: updateError } = await supabase
      .from("samples")
      .update({
        customer_id: input.customer_id,
        sent_at: sentAt,
        status: becomesSent ? "enviado" : "pendente",
        carrier_id: input.carrier_id || null,
        carrier_name: input.carrier_name?.trim() || null,
        tracking_code: input.tracking_code?.trim() || null,
        internal_cost:
          input.internal_cost != null && Number.isFinite(input.internal_cost)
            ? input.internal_cost
            : null,
        auto_follow_up: input.auto_follow_up ?? true,
        notes: input.notes?.trim() || null,
      })
      .eq("id", sampleId);

    if (updateError) throw new Error(updateError.message);

    const { error: deleteItemsError } = await supabase
      .from("sample_items")
      .delete()
      .eq("sample_id", sampleId);

    if (deleteItemsError) throw new Error(deleteItemsError.message);

    const sampleItems = input.items.map((item) => ({
      tenant_id: tenantId,
      sample_id: sampleId,
      product_id: item.product_id,
      package_id: item.package_id ?? null,
      quantity: item.quantity,
      status: becomesSent ? "enviado" : "pendente",
    }));

    const { error: itemsError } = await supabase
      .from("sample_items")
      .insert(sampleItems);

    if (itemsError) throw new Error(itemsError.message);

    if (becomesSent) {
      const profile = await requireProfile();
      await scheduleFollowupsIfNeeded(supabase, {
        tenantId,
        sampleId,
        sampleNumber: existing.sample_number ?? sampleId.slice(0, 8),
        customerId: input.customer_id,
        sellerId: existing.seller_id ?? profile.id,
        sentAt,
        autoFollowUp: existing.auto_follow_up ?? true,
        alreadyScheduled: existing.followups_scheduled ?? false,
      });
    }

    revalidatePath("/");
    revalidatePath("/amostras");
    revalidatePath(`/amostras/${sampleId}`);

    return {
      success: "Amostra atualizada com sucesso.",
      sampleId,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a amostra.",
    };
  }
}

export async function updateSampleStatusAction(
  sampleId: string,
  status: SampleStatus
): Promise<SampleActionState> {
  try {
    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();
    const now = new Date().toISOString();

    const { data: sample, error: fetchError } = await supabase
      .from("samples")
      .select(
        "id, sample_number, customer_id, seller_id, sent_at, auto_follow_up, followups_scheduled, status"
      )
      .eq("id", sampleId)
      .maybeSingle();

    if (fetchError || !sample) {
      return { error: "Amostra não encontrada." };
    }

    const patch: Record<string, unknown> = { status };

    if (status === "enviado") {
      patch.sent_at = sample.sent_at ?? now;
      await supabase
        .from("sample_items")
        .update({ status: "enviado" })
        .eq("sample_id", sampleId);
    }
    if (status === "recebido") patch.delivered_at = now;
    if (status === "testando") patch.feedback_at = now;
    if (status === "aprovado" || status === "reprovado") {
      patch.feedback_at = now;
    }

    const { error } = await supabase.from("samples").update(patch).eq("id", sampleId);

    if (error) throw new Error(error.message);

    if (status === "enviado") {
      await scheduleFollowupsIfNeeded(supabase, {
        tenantId,
        sampleId,
        sampleNumber: sample.sample_number ?? sampleId.slice(0, 8),
        customerId: sample.customer_id,
        sellerId: sample.seller_id ?? profile.id,
        sentAt: (patch.sent_at as string) ?? sample.sent_at,
        autoFollowUp: sample.auto_follow_up ?? true,
        alreadyScheduled: sample.followups_scheduled ?? false,
      });
    }

    revalidatePath("/");
    revalidatePath("/amostras");
    revalidatePath("/visitas");
    revalidatePath(`/amostras/${sampleId}`);

    return { success: "Status da amostra atualizado." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a amostra.",
    };
  }
}

export async function updateSampleFeedbackAction(
  sampleId: string,
  input: SampleFeedbackInput
): Promise<SampleActionState> {
  try {
    const { supabase } = await createTenantClient();
    const patch: Record<string, unknown> = {};

    if (input.feedback !== undefined) {
      patch.feedback = input.feedback?.trim() || null;
      if (input.feedback?.trim()) patch.feedback_at = new Date().toISOString();
    }
    if (input.next_action !== undefined) {
      patch.next_action = input.next_action;
    }
    if (input.status) {
      patch.status = input.status;
    }

    const { error } = await supabase
      .from("samples")
      .update(patch)
      .eq("id", sampleId);

    if (error) throw new Error(error.message);

    revalidatePath("/amostras");
    revalidatePath(`/amostras/${sampleId}`);

    return { success: "Retorno da amostra salvo." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar o retorno.",
    };
  }
}
