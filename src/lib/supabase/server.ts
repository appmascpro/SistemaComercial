import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublicEnv } from "./env";

export async function createClient() {
  const env = getSupabasePublicEnv();
  if (!env.ok) {
    throw new Error(
      `Variáveis públicas do Supabase ausentes: ${env.missing.join(", ")}`
    );
  }

  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // Ignorado em Server Components sem mutação de cookies
        }
      },
    },
  });
}
