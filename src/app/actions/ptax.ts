"use server";

import { revalidatePath } from "next/cache";
import {
  syncPtaxFromBcbForCurrentTenant,
  updateActivePtaxRate,
} from "@/lib/pricing/ptax";

export interface PtaxActionState {
  error?: string;
  success?: string;
}

export async function updatePtaxAction(
  _prevState: PtaxActionState,
  formData: FormData
): Promise<PtaxActionState> {
  const rawRate = String(formData.get("rate") ?? "")
    .trim()
    .replace(",", ".");
  const validFrom = String(formData.get("valid_from") ?? "").trim();
  const rate = Number(rawRate);

  if (!rawRate || !Number.isFinite(rate) || rate <= 0) {
    return { error: "Informe a PTAX venda do dia (ex.: 5.078)." };
  }

  try {
    await updateActivePtaxRate(rate, validFrom || undefined, {
      source: "manual",
    });
    revalidatePath("/configuracoes");
    revalidatePath("/produtos");
    revalidatePath("/cotacoes");
    return {
      success: `PTAX atualizada para R$ ${rate.toFixed(4)}/USD.`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível salvar a PTAX.",
    };
  }
}

export async function syncPtaxFromBcbAction(): Promise<PtaxActionState> {
  try {
    const result = await syncPtaxFromBcbForCurrentTenant();
    revalidatePath("/configuracoes");
    revalidatePath("/produtos");
    revalidatePath("/cotacoes");
    return { success: result.message };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível consultar o BCB.",
    };
  }
}
