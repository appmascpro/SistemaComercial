import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";

export interface CarrierOption {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
}

export async function getCarriersForSelect(): Promise<CarrierOption[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("carriers")
    .select("id, name, city, state")
    .eq("status", "ativo")
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);
  return data ?? [];
}
