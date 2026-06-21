import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import type { TeamMember } from "@/types/team";
import type { UserRole } from "@/types/auth";

const VALID_ROLES: UserRole[] = ["admin", "gerente", "vendedor", "financeiro"];

function parseRole(value: string | null | undefined): UserRole {
  if (value && VALID_ROLES.includes(value as UserRole)) {
    return value as UserRole;
  }
  return "vendedor";
}

export async function getTeamMembersForTenant(
  tenantId: string
): Promise<TeamMember[]> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from("profiles")
    .select("id, email, full_name, role, is_active, created_at")
    .eq("tenant_id", tenantId)
    .order("full_name");

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((row) => ({
    id: row.id,
    email: row.email,
    full_name: row.full_name,
    role: parseRole(row.role),
    is_active: row.is_active,
    created_at: row.created_at,
  }));
}

export async function countActiveAdminsInTenant(
  tenantId: string,
  excludeUserId?: string
): Promise<number> {
  const admin = createAdminClient();

  let query = admin
    .from("profiles")
    .select("id", { count: "exact", head: true })
    .eq("tenant_id", tenantId)
    .eq("role", "admin")
    .eq("is_active", true);

  if (excludeUserId) {
    query = query.neq("id", excludeUserId);
  }

  const { count, error } = await query;

  if (error) {
    throw new Error(error.message);
  }

  return count ?? 0;
}
