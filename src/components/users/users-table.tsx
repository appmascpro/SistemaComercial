"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  resetTeamMemberPasswordAction,
  toggleTeamMemberActiveAction,
  updateTeamMemberRoleAction,
} from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import { USER_ROLE_LABELS, type UserRole } from "@/types/auth";
import { INVITABLE_ROLES, type TeamMember } from "@/types/team";

interface UsersTableProps {
  members: TeamMember[];
  currentUserId: string;
}

export function UsersTable({ members, currentUserId }: UsersTableProps) {
  if (members.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Nenhum usuário cadastrado além do administrador.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Usuário
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Perfil
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Status
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Desde
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {members.map((member) => (
            <UserRow
              key={member.id}
              member={member}
              isSelf={member.id === currentUserId}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

function UserRow({
  member,
  isSelf,
}: {
  member: TeamMember;
  isSelf: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [showReset, setShowReset] = useState(false);
  const [newPassword, setNewPassword] = useState("");

  function handleRoleChange(role: UserRole) {
    setError(null);
    startTransition(async () => {
      const result = await updateTeamMemberRoleAction(member.id, role);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleToggleActive() {
    setError(null);
    startTransition(async () => {
      const result = await toggleTeamMemberActiveAction(
        member.id,
        !member.is_active
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  function handleResetPassword() {
    setError(null);
    startTransition(async () => {
      const result = await resetTeamMemberPasswordAction(
        member.id,
        newPassword
      );
      if (result.error) {
        setError(result.error);
        return;
      }
      setShowReset(false);
      setNewPassword("");
      alert(result.success ?? "Senha redefinida.");
    });
  }

  return (
    <>
      <tr className="hover:bg-slate-50/80">
        <td className="px-3 py-2">
          <p className="font-medium text-slate-900">
            {member.full_name}
            {isSelf ? (
              <span className="ml-2 text-xs font-normal text-slate-500">
                (você)
              </span>
            ) : null}
          </p>
          <p className="text-xs text-slate-500">{member.email}</p>
          {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
        </td>
        <td className="px-3 py-2">
          <select
            value={member.role}
            disabled={isPending || (isSelf && member.role === "admin")}
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            className="h-8 min-w-[8rem] rounded-lg border border-slate-200 bg-white px-2 text-xs disabled:opacity-50"
          >
            {INVITABLE_ROLES.map((role) => (
              <option key={role} value={role}>
                {USER_ROLE_LABELS[role]}
              </option>
            ))}
          </select>
        </td>
        <td className="px-3 py-2">
          <span
            className={`rounded-full px-2 py-0.5 text-xs font-medium ${
              member.is_active
                ? "bg-emerald-50 text-emerald-700"
                : "bg-slate-100 text-slate-600"
            }`}
          >
            {member.is_active ? "Ativo" : "Inativo"}
          </span>
        </td>
        <td className="px-3 py-2 text-slate-600">
          {formatDate(member.created_at)}
        </td>
        <td className="px-3 py-2">
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending || isSelf}
              onClick={handleToggleActive}
              className="h-8 px-2 text-xs"
            >
              {member.is_active ? "Desativar" : "Reativar"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isPending}
              onClick={() => setShowReset((value) => !value)}
              className="h-8 px-2 text-xs"
            >
              {showReset ? "Cancelar" : "Nova senha"}
            </Button>
          </div>
        </td>
      </tr>
      {showReset ? (
        <tr className="bg-slate-50/80">
          <td colSpan={5} className="px-3 py-3">
            <div className="flex flex-wrap items-end gap-2">
              <label className="block min-w-[220px] flex-1 text-sm">
                <span className="mb-1 block text-slate-600">
                  Nova senha para {member.full_name}
                </span>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  minLength={8}
                  placeholder="Mínimo 8 caracteres"
                  className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-brand-500 focus:ring-2"
                />
              </label>
              <Button
                type="button"
                size="sm"
                disabled={isPending || newPassword.length < 8}
                onClick={handleResetPassword}
              >
                Salvar senha
              </Button>
            </div>
          </td>
        </tr>
      ) : null}
    </>
  );
}
