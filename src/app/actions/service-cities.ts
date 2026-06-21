"use server";

import { revalidatePath } from "next/cache";
import { getRequiredTenantId } from "@/lib/auth/tenant";
import citiesSp from "@/lib/service-cities/cities-sp.json";
import type { ServiceCityEntry } from "@/lib/service-cities/micro-regions";
import { getServiceCityCount } from "@/lib/service-cities/queries";
import { createClient } from "@/lib/supabase/server";

export async function getServiceCitiesAction() {
  const { getServiceCities } = await import("@/lib/service-cities/queries");
  return getServiceCities();
}

export async function seedServiceCitiesAction(): Promise<{
  success: boolean;
  inserted: number;
  message: string;
}> {
  const supabase = await createClient();
  const tenantId = await getRequiredTenantId();

  const existing = await getServiceCityCount();
  if (existing > 0) {
    return {
      success: true,
      inserted: 0,
      message: `${existing} cidade(s) já cadastrada(s).`,
    };
  }

  const rows = (citiesSp as ServiceCityEntry[]).map((entry) => ({
    tenant_id: tenantId,
    city: entry.city,
    state: entry.state,
    region: entry.region,
    status: "ativo" as const,
  }));

  const batchSize = 100;
  let inserted = 0;

  for (let i = 0; i < rows.length; i += batchSize) {
    const batch = rows.slice(i, i + batchSize);
    const { error } = await supabase.from("service_cities").insert(batch);
    if (error) {
      return {
        success: false,
        inserted,
        message: error.message,
      };
    }
    inserted += batch.length;
  }

  revalidatePath("/rotas");
  revalidatePath("/rotas/nova");

  return {
    success: true,
    inserted,
    message: `${inserted} cidades de atuação cadastradas.`,
  };
}

/** Preenche/atualiza micro-região nas cidades já existentes. */
export async function syncServiceCityRegionsAction(): Promise<{
  success: boolean;
  updated: number;
  message: string;
}> {
  const supabase = await createClient();
  const tenantId = await getRequiredTenantId();
  const entries = citiesSp as ServiceCityEntry[];

  let updated = 0;

  for (const entry of entries) {
    const { data, error } = await supabase
      .from("service_cities")
      .update({ region: entry.region })
      .eq("tenant_id", tenantId)
      .eq("city", entry.city)
      .eq("state", entry.state)
      .is("region", null)
      .select("id");

    if (error) {
      return { success: false, updated, message: error.message };
    }
    updated += data?.length ?? 0;
  }

  if (updated > 0) {
    revalidatePath("/rotas");
    revalidatePath("/rotas/nova");
  }

  return {
    success: true,
    updated,
    message:
      updated > 0
        ? `${updated} cidade(s) vinculada(s) à micro-região.`
        : "Micro-regiões já estão atualizadas.",
  };
}
