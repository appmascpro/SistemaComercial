"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowLeft, Bell, Search } from "lucide-react";
import { UserMenu } from "@/components/auth/user-menu";
import { MobileAppMenu } from "@/components/layout/mobile-app-menu";
import { Button } from "@/components/ui/button";
import { getPageTitle, isDashboardPath } from "@/config/navigation";
import type { UserProfile } from "@/types/auth";

interface HeaderProps {
  user: Pick<UserProfile, "full_name" | "email" | "role">;
}

export function Header({ user }: HeaderProps) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const showBack = !isDashboardPath(pathname);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-slate-200 bg-white/90 px-3 backdrop-blur-md sm:h-16 sm:gap-4 sm:px-6 lg:bg-white/80">
      <div className="flex min-w-0 flex-1 items-center gap-2">
        {showBack && (
          <Link
            href="/"
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-slate-600 transition-colors hover:bg-slate-100 hover:text-slate-900"
            aria-label="Voltar ao dashboard"
            title="Voltar"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
        )}

        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold text-slate-900 sm:text-lg">
            {title}
          </h1>
          <p className="hidden text-xs text-slate-500 sm:block">
            Bem-vindo, {user.full_name.split(" ")[0]}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar clientes, produtos..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <Button
          variant="ghost"
          size="sm"
          className="relative hidden h-9 w-9 p-0 sm:inline-flex"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
        </Button>

        <MobileAppMenu user={user} />

        <div className="hidden lg:block">
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
