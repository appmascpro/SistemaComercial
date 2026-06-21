import { createClient } from "@/lib/supabase/server";
import type { UserProfile, UserRole } from "@/types/auth";

const VALID_ROLES: UserRole[] = ["admin", "gerente", "vendedor", "financeiro"];

function parseRole(value: string | null | undefined): UserRole {
  if (value && VALID_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }
  return "vendedor";
}

export async function getCurrentUser() {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) return null;
  return user;
}

export async function getCurrentProfile(): Promise<UserProfile | null> {
  const user = await getCurrentUser();
  if (!user) return null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, tenant_id, email, full_name, role, avatar_url, is_active")
    .eq("id", user.id)
    .maybeSingle();

  if (error || !data || data.is_active === false) return null;

  return {
    id: data.id,
    tenant_id: data.tenant_id,
    email: data.email,
    full_name: data.full_name,
    role: parseRole(data.role),
    avatar_url: data.avatar_url ?? undefined,
  };
}
