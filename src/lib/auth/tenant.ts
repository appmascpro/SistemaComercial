import { getCurrentProfile } from "@/lib/auth/session";

export async function getRequiredTenantId(): Promise<string> {
  const profile = await getCurrentProfile();

  if (!profile?.tenant_id) {
    throw new Error(
      "Sessão inválida ou usuário sem tenant vinculado. Faça login novamente."
    );
  }

  return profile.tenant_id;
}

/** Resolve tenant_id da sessão autenticada (substitui DEFAULT_TENANT_ID no app). */
export async function getTenantId(): Promise<string> {
  return getRequiredTenantId();
}
