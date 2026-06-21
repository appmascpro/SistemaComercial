"use client";

import { LogOut, User } from "lucide-react";
import { logoutAction } from "@/app/actions/auth";
import { Button } from "@/components/ui/button";
import { USER_ROLE_LABELS, type UserProfile } from "@/types/auth";

interface UserMenuProps {
  user: Pick<UserProfile, "full_name" | "email" | "role">;
}

export function UserMenu({ user }: UserMenuProps) {
  return (
    <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
      <div className="hidden text-right sm:block">
        <p className="text-sm font-medium text-slate-900">{user.full_name}</p>
        <p className="text-xs text-slate-500">
          {USER_ROLE_LABELS[user.role]}
        </p>
      </div>
      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
        <User className="h-4 w-4" />
      </div>
      <form action={logoutAction}>
        <Button
          type="submit"
          variant="ghost"
          size="sm"
          className="h-9 w-9 p-0"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
