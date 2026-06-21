function collectMissing(vars: Record<string, string | undefined>): string[] {
  return Object.entries(vars)
    .filter(([, value]) => !value?.trim())
    .map(([key]) => key);
}

export function getSupabasePublicEnv() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  const missing = collectMissing({
    NEXT_PUBLIC_SUPABASE_URL: url,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: anonKey,
  });

  if (missing.length > 0) {
    return { ok: false as const, missing };
  }

  return { ok: true as const, url: url!, anonKey: anonKey! };
}

export function getSupabaseAdminEnv() {
  const publicEnv = getSupabasePublicEnv();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  const missing = collectMissing({
    SUPABASE_SERVICE_ROLE_KEY: serviceRoleKey,
  });

  if (!publicEnv.ok) {
    return { ok: false as const, missing: [...publicEnv.missing, ...missing] };
  }

  if (missing.length > 0) {
    return { ok: false as const, missing };
  }

  return {
    ok: true as const,
    url: publicEnv.url,
    serviceRoleKey: serviceRoleKey!,
  };
}

export function getSupabaseProjectRef(url: string): string {
  try {
    return new URL(url).hostname.split(".")[0] ?? "desconhecido";
  } catch {
    return "desconhecido";
  }
}
