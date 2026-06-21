"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  mainNavigation,
  settingsNavigation,
  type NavItem,
} from "@/config/navigation";
import { ChevronLeft, ChevronRight, Hexagon } from "lucide-react";
import { useState } from "react";

function NavLink({
  item,
  collapsed,
}: {
  item: NavItem;
  collapsed: boolean;
}) {
  const pathname = usePathname();
  const isActive =
    item.href === "/"
      ? pathname === "/"
      : pathname.startsWith(item.href);
  const Icon = item.icon;

  return (
    <Link
      href={item.href}
      title={collapsed ? item.title : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
        isActive
          ? "bg-brand-600 text-white shadow-sm"
          : "text-sidebar-muted hover:bg-sidebar-accent hover:text-sidebar-foreground"
      )}
    >
      <Icon
        className={cn(
          "h-5 w-5 shrink-0",
          isActive ? "text-white" : "text-sidebar-muted group-hover:text-sidebar-foreground"
        )}
      />
      {!collapsed && <span className="truncate">{item.title}</span>}
    </Link>
  );
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside
      className={cn(
        "flex h-full flex-col border-r border-sidebar-border bg-sidebar transition-all duration-300",
        collapsed ? "w-[72px]" : "w-64"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b border-sidebar-border px-4">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-brand-600">
          <Hexagon className="h-5 w-5 text-white" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-sidebar-foreground">
              ConectaInsumos
            </p>
            <p className="truncate text-xs text-sidebar-muted">
              Plataforma Comercial
            </p>
          </div>
        )}
      </div>

      <nav className="scrollbar-thin flex-1 space-y-1 overflow-y-auto p-3">
        <div className="space-y-1">
          {!collapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              Menu
            </p>
          )}
          {mainNavigation.map((item) => (
            <NavLink key={item.href} item={item} collapsed={collapsed} />
          ))}
        </div>

        <div className="pt-4">
          {!collapsed && (
            <p className="mb-2 px-3 text-[11px] font-semibold uppercase tracking-wider text-sidebar-muted">
              Sistema
            </p>
          )}
          <NavLink item={settingsNavigation} collapsed={collapsed} />
        </div>
      </nav>

      <div className="border-t border-sidebar-border p-3">
        <button
          type="button"
          onClick={() => setCollapsed(!collapsed)}
          className="flex w-full items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm text-sidebar-muted transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
          aria-label={collapsed ? "Expandir menu" : "Recolher menu"}
        >
          {collapsed ? (
            <ChevronRight className="h-4 w-4" />
          ) : (
            <>
              <ChevronLeft className="h-4 w-4" />
              <span>Recolher</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
}
