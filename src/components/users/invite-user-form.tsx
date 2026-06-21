"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { inviteUserAction } from "@/app/actions/users";
import { Button } from "@/components/ui/button";
import { USER_ROLE_LABELS, type UserRole } from "@/types/auth";
import { INVITABLE_ROLES } from "@/types/team";

const inputClass =
  "h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-brand-500 focus:ring-2";

export function InviteUserForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<UserRole>("vendedor");

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await inviteUserAction({
        full_name: fullName,
        email,
        password,
        role,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Usuário cadastrado.");
      setFullName("");
      setEmail("");
      setPassword("");
      setRole("vendedor");
      router.refresh();
    });
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {success}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm sm:col-span-2">
          <span className="mb-1 block text-slate-600">Nome completo *</span>
          <input
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className={inputClass}
            placeholder="João Silva"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">E-mail *</span>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className={inputClass}
            placeholder="vendedor@empresa.com.br"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Senha inicial *</span>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className={inputClass}
            placeholder="Mínimo 8 caracteres"
            minLength={8}
          />
        </label>

        <label className="block text-sm">
          <span className="mb-1 block text-slate-600">Perfil de acesso</span>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as UserRole)}
            className={inputClass}
          >
            {INVITABLE_ROLES.map((item) => (
              <option key={item} value={item}>
                {USER_ROLE_LABELS[item]}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="text-xs text-slate-500">
        O usuário recebe acesso imediato com o e-mail e senha informados. Peça
        para alterar a senha no primeiro login.
      </p>

      <Button type="button" disabled={isPending} onClick={handleSubmit}>
        {isPending ? "Cadastrando..." : "Cadastrar usuário"}
      </Button>
    </div>
  );
}
