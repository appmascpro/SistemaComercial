import type { UserRole } from "@/types/auth";

export interface TeamMember {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  is_active: boolean;
  created_at: string;
}

export interface InviteUserInput {
  full_name: string;
  email: string;
  password: string;
  role: UserRole;
}

export const INVITABLE_ROLES: UserRole[] = [
  "vendedor",
  "gerente",
  "financeiro",
  "admin",
];
