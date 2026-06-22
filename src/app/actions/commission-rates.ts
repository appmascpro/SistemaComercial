"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import { COMMISSION_DEFAULT_CATEGORY } from "@/types/commission-rate";

export interface CommissionRateActionState {
  error?: string;
  success?: string;
}

function parseRate(raw: string): number | null {
  const normalized = raw.trim().replace(",", ".");
  const value = Number(normalized);
  if (!Number.isFinite(value) || value < 0 || value > 100) return null;
  return Math.round(value * 100) / 100;
}

async function upsertCategoryRate(
  tenantId: string,
  category: string,
  commissionRate: number
) {
  const { supabase } = await createTenantClient();

  const { data: existing } = await supabase
    .from("commission_category_rates")
    .select("id")
    .eq("category", category)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("commission_category_rates")
      .update({ commission_rate: commissionRate, status: "ativo" })
      .eq("id", existing.id);
    if (error) throw new Error(error.message);
    return;
  }

  const { error } = await supabase.from("commission_category_rates").insert({
    tenant_id: tenantId,
    category,
    commission_rate: commissionRate,
    status: "ativo",
  });

  if (error) throw new Error(error.message);
}

function revalidateCommissionPaths() {
  revalidatePath("/configuracoes");
  revalidatePath("/comissoes");
  revalidatePath("/pedidos");
}

export async function saveCommissionRatesAction(
  _prevState: CommissionRateActionState,
  formData: FormData
): Promise<CommissionRateActionState> {
  try {
    await requireAdminProfile();
    const { tenantId } = await createTenantClient();

    const defaultRaw = String(formData.get("default_rate") ?? "");
    const defaultRate = parseRate(defaultRaw);
    if (defaultRate == null) {
      return { error: "Informe a taxa padrão entre 0% e 100%." };
    }

    await upsertCategoryRate(tenantId, COMMISSION_DEFAULT_CATEGORY, defaultRate);

    const categories = formData.getAll("category").map((value) => String(value));
    const rates = formData.getAll("rate").map((value) => String(value));

    for (let index = 0; index < categories.length; index += 1) {
      const category = categories[index]?.trim();
      const rate = parseRate(rates[index] ?? "");
      if (!category || rate == null) continue;
      await upsertCategoryRate(tenantId, category, rate);
    }

    revalidateCommissionPaths();
    return { success: "Taxas de comissão salvas." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível salvar as taxas.",
    };
  }
}

export async function deleteCommissionCategoryRateAction(
  rateId: string
): Promise<CommissionRateActionState> {
  try {
    await requireAdminProfile();
    const { supabase } = await createTenantClient();

    const { error } = await supabase
      .from("commission_category_rates")
      .delete()
      .eq("id", rateId)
      .neq("category", COMMISSION_DEFAULT_CATEGORY);

    if (error) throw new Error(error.message);

    revalidateCommissionPaths();
    return { success: "Categoria removida." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível remover a categoria.",
    };
  }
}

export async function addCommissionCategoryAction(
  category: string,
  commissionRate: number
): Promise<CommissionRateActionState> {
  try {
    await requireAdminProfile();
    const { tenantId } = await createTenantClient();

    const normalizedCategory = category.trim();
    if (!normalizedCategory) {
      return { error: "Informe o nome da categoria." };
    }
    if (normalizedCategory === COMMISSION_DEFAULT_CATEGORY) {
      return { error: "Nome de categoria reservado." };
    }
    if (commissionRate < 0 || commissionRate > 100) {
      return { error: "Taxa deve estar entre 0% e 100%." };
    }

    await upsertCategoryRate(tenantId, normalizedCategory, commissionRate);

    revalidateCommissionPaths();
    return { success: `Taxa cadastrada para ${normalizedCategory}.` };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar a categoria.",
    };
  }
}
