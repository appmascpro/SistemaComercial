"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { generateSampleNumber } from "@/lib/samples/numbering";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { SampleFormInput, SampleStatus } from "@/types/sample";

export interface SampleActionState {
  error?: string;
  success?: string;
  sampleId?: string;
}

function defaultFollowUpDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
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

    const { data: sample, error: sampleError } = await supabase
      .from("samples")
      .insert({
        tenant_id: tenantId,
        customer_id: input.customer_id,
        seller_id: profile.id,
        sample_number: sampleNumber,
        status: "pendente",
        follow_up_date: input.follow_up_date || defaultFollowUpDate(),
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
      status: "pendente",
    }));

    const { error: itemsError } = await supabase
      .from("sample_items")
      .insert(sampleItems);

    if (itemsError) {
      await supabase.from("samples").delete().eq("id", sample.id);
      throw new Error(itemsError.message);
    }

    revalidatePath("/amostras");
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

export async function updateSampleStatusAction(
  sampleId: string,
  status: SampleStatus,
  feedback?: string
): Promise<SampleActionState> {
  try {
    const { supabase } = await createTenantClient();
    const now = new Date().toISOString();
    const patch: Record<string, unknown> = { status };

    if (status === "enviada") patch.sent_at = now;
    if (status === "entregue") patch.delivered_at = now;
    if (status === "feedback_recebido") {
      patch.feedback_at = now;
      if (feedback?.trim()) patch.feedback = feedback.trim();
    }

    const { error } = await supabase
      .from("samples")
      .update(patch)
      .eq("id", sampleId);

    if (error) throw new Error(error.message);

    revalidatePath("/amostras");
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
