import "server-only";

import { getRequiredTenantId } from "@/lib/auth/tenant";
import { createClient } from "@/lib/supabase/server";

/** Cliente Supabase da sessão + tenant_id garantido (RLS filtra por tenant). */
export async function createTenantClient() {
  const [supabase, tenantId] = await Promise.all([
    createClient(),
    getRequiredTenantId(),
  ]);

  return { supabase, tenantId };
}
