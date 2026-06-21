import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import {
  getMicroRegionBySlug,
  getMicroRegionsOrdered,
  type MicroRegion,
} from "@/lib/service-cities/micro-regions";

export interface ServiceCity {
  id: string;
  city: string;
  state: string;
  region: string | null;
}

export interface ServiceCityWithRegion extends ServiceCity {
  regionName: string | null;
  expansionPriority: number | null;
}

export async function getServiceCities(): Promise<ServiceCityWithRegion[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("service_cities")
    .select("id, city, state, region")
    .eq("status", "ativo");

  if (error) throw new Error(error.message);

  const rows = data ?? [];

  return rows
    .map((row) => {
      const micro = row.region ? getMicroRegionBySlug(row.region) : null;
      return {
        ...row,
        regionName: micro?.name ?? null,
        expansionPriority: micro?.expansionPriority ?? null,
      };
    })
    .sort((a, b) => {
      const pa = a.expansionPriority ?? 999;
      const pb = b.expansionPriority ?? 999;
      if (pa !== pb) return pa - pb;
      return a.city.localeCompare(b.city, "pt-BR");
    });
}

export function getMicroRegionsForRoutes(): MicroRegion[] {
  return getMicroRegionsOrdered();
}

export async function getServiceCityCount(): Promise<number> {
  const { supabase } = await createTenantClient();
  const { count, error } = await supabase
    .from("service_cities")
    .select("*", { count: "exact", head: true })
    .eq("status", "ativo");

  if (error) throw new Error(error.message);
  return count ?? 0;
}
