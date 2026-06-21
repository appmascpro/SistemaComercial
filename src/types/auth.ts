export type UserRole = "admin" | "gerente" | "vendedor" | "financeiro";

export interface UserProfile {
  id: string;
  tenant_id: string;
  email: string;
  full_name: string;
  role: UserRole;
  avatar_url?: string;
}

export const USER_ROLE_LABELS: Record<UserRole, string> = {
  admin: "Administrador",
  gerente: "Gerente",
  vendedor: "Vendedor",
  financeiro: "Financeiro",
};
