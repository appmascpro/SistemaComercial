import "server-only";

import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabaseAdminEnv } from "./env";

let adminClient: SupabaseClient | undefined;

export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const env = getSupabaseAdminEnv();
  if (!env.ok) {
    throw new Error(
      `Variáveis do Supabase admin ausentes: ${env.missing.join(", ")}`
    );
  }

  adminClient = createClient(env.url, env.serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  return adminClient;
}
