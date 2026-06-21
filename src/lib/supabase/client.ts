import { createBrowserClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "./env";

let browserClient: SupabaseClient | undefined;

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const env = getSupabasePublicEnv();
  if (!env.ok) {
    throw new Error(
      `Variáveis públicas do Supabase ausentes: ${env.missing.join(", ")}`
    );
  }

  browserClient = createBrowserClient(env.url, env.anonKey);
  return browserClient;
}
