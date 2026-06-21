"use server";

import { revalidatePath } from "next/cache";
import { requireAdminProfile } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import {
  countActiveAdminsInTenant,
  getTeamMembersForTenant,
} from "@/lib/users/queries";
import type { InviteUserInput } from "@/types/team";
import type { UserRole } from "@/types/auth";

export interface UserActionState {
  error?: string;
  success?: string;
}

const VALID_ROLES: UserRole[] = ["admin", "gerente", "vendedor", "financeiro"];

function normalizeInviteInput(input: InviteUserInput) {
  const fullName = input.full_name.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!fullName) {
    throw new Error("Informe o nome completo do usuário.");
  }

  if (!email || !email.includes("@")) {
    throw new Error("Informe um e-mail válido.");
  }

  if (password.length < 8) {
    throw new Error("A senha deve ter no mínimo 8 caracteres.");
  }

  if (!VALID_ROLES.includes(input.role)) {
    throw new Error("Perfil inválido.");
  }

  return { fullName, email, password, role: input.role };
}

export async function inviteUserAction(
  input: InviteUserInput
): Promise<UserActionState> {
  try {
    const adminProfile = await requireAdminProfile();
    const { fullName, email, password, role } = normalizeInviteInput(input);
    const admin = createAdminClient();

    const { data: existing } = await admin
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existing) {
      throw new Error("Já existe um usuário com este e-mail.");
    }

    const { data: created, error: createError } =
      await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { full_name: fullName },
      });

    if (createError || !created.user) {
      throw new Error(createError?.message ?? "Falha ao criar usuário.");
    }

    const { error: profileError } = await admin.from("profiles").insert({
      id: created.user.id,
      tenant_id: adminProfile.tenant_id,
      email,
      full_name: fullName,
      role,
      is_active: true,
    });

    if (profileError) {
      await admin.auth.admin.deleteUser(created.user.id);
      throw new Error(profileError.message);
    }

    revalidatePath("/usuarios");

    return {
      success: `${fullName} cadastrado com sucesso. O vendedor já pode entrar com o e-mail e senha informados.`,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível cadastrar o usuário.",
    };
  }
}

export async function updateTeamMemberRoleAction(
  userId: string,
  role: UserRole
): Promise<UserActionState> {
  try {
    const adminProfile = await requireAdminProfile();

    if (!VALID_ROLES.includes(role)) {
      throw new Error("Perfil inválido.");
    }

    const admin = createAdminClient();
    const members = await getTeamMembersForTenant(adminProfile.tenant_id);
    const target = members.find((member) => member.id === userId);

    if (!target) {
      throw new Error("Usuário não encontrado.");
    }

    if (target.role === "admin" && role !== "admin") {
      const otherAdmins = await countActiveAdminsInTenant(
        adminProfile.tenant_id,
        userId
      );
      if (otherAdmins === 0) {
        throw new Error("Não é possível remover o último administrador.");
      }
    }

    const { error } = await admin
      .from("profiles")
      .update({ role })
      .eq("id", userId)
      .eq("tenant_id", adminProfile.tenant_id);

    if (error) {
      throw new Error(error.message);
    }

    revalidatePath("/usuarios");

    return { success: "Perfil atualizado." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o perfil.",
    };
  }
}

export async function toggleTeamMemberActiveAction(
  userId: string,
  isActive: boolean
): Promise<UserActionState> {
  try {
    const adminProfile = await requireAdminProfile();

    if (userId === adminProfile.id && !isActive) {
      throw new Error("Você não pode desativar sua própria conta.");
    }

    const admin = createAdminClient();
    const members = await getTeamMembersForTenant(adminProfile.tenant_id);
    const target = members.find((member) => member.id === userId);

    if (!target) {
      throw new Error("Usuário não encontrado.");
    }

    if (target.role === "admin" && !isActive) {
      const otherAdmins = await countActiveAdminsInTenant(
        adminProfile.tenant_id,
        userId
      );
      if (otherAdmins === 0) {
        throw new Error("Não é possível desativar o último administrador.");
      }
    }

    const { error: profileError } = await admin
      .from("profiles")
      .update({ is_active: isActive })
      .eq("id", userId)
      .eq("tenant_id", adminProfile.tenant_id);

    if (profileError) {
      throw new Error(profileError.message);
    }

    const { error: authError } = await admin.auth.admin.updateUserById(userId, {
      ban_duration: isActive ? "none" : "876000h",
    });

    if (authError) {
      throw new Error(authError.message);
    }

    revalidatePath("/usuarios");

    return {
      success: isActive ? "Usuário reativado." : "Usuário desativado.",
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível alterar o status do usuário.",
    };
  }
}

export async function resetTeamMemberPasswordAction(
  userId: string,
  password: string
): Promise<UserActionState> {
  try {
    const adminProfile = await requireAdminProfile();

    if (password.length < 8) {
      throw new Error("A senha deve ter no mínimo 8 caracteres.");
    }

    const admin = createAdminClient();
    const members = await getTeamMembersForTenant(adminProfile.tenant_id);
    const target = members.find((member) => member.id === userId);

    if (!target) {
      throw new Error("Usuário não encontrado.");
    }

    const { error } = await admin.auth.admin.updateUserById(userId, {
      password,
    });

    if (error) {
      throw new Error(error.message);
    }

    return { success: "Senha redefinida com sucesso." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível redefinir a senha.",
    };
  }
}
