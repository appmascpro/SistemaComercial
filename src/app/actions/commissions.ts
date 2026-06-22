"use server";

import { revalidatePath } from "next/cache";
import { createTenantClient } from "@/lib/supabase/tenant-db";

export interface CommissionActionState {
  error?: string;
  success?: string;
}

export async function markCommissionPaidAction(
  commissionId: string
): Promise<CommissionActionState> {
  try {
    const { supabase } = await createTenantClient();

    const { data: commission, error: fetchError } = await supabase
      .from("commissions")
      .select("id, status, order_id")
      .eq("id", commissionId)
      .maybeSingle();

    if (fetchError || !commission) {
      return { error: "Comissão não encontrada." };
    }

    if (commission.status !== "liberada" && commission.status !== "proporcional") {
      return {
        error: "Só é possível marcar como paga comissão liberada ou proporcional.",
      };
    }

    const { error } = await supabase
      .from("commissions")
      .update({
        status: "paga",
        paid_at: new Date().toISOString(),
      })
      .eq("id", commissionId);

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/comissoes");
    revalidatePath(`/pedidos/${commission.order_id}`);

    return { success: "Comissão marcada como paga." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar a comissão.",
    };
  }
}
