"use client";

import { usePathname } from "next/navigation";
import { Bell, Search, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mainNavigation, settingsNavigation } from "@/config/navigation";

function getPageTitle(pathname: string): string {
  const allNav = [...mainNavigation, settingsNavigation];
  const match = allNav.find((item) =>
    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
  );
  return match?.title ?? "ConectaInsumos";
}

export function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white/80 px-6 backdrop-blur-md">
      <div className="min-w-0">
        <h1 className="truncate text-lg font-semibold text-slate-900">
          {title}
        </h1>
        <p className="hidden text-xs text-slate-500 sm:block">
          Bem-vindo ao ConectaInsumos
        </p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            placeholder="Buscar clientes, produtos..."
            className="h-9 w-64 rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 text-sm text-slate-700 placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-500/20"
          />
        </div>

        <Button variant="ghost" size="sm" className="relative h-9 w-9 p-0">
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-brand-500" />
        </Button>

        <div className="flex items-center gap-3 border-l border-slate-200 pl-3">
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-slate-900">Usuário Demo</p>
            <p className="text-xs text-slate-500">Administrador</p>
          </div>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-100 text-brand-700">
            <User className="h-4 w-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
