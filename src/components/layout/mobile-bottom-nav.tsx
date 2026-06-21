"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { mobileBottomNavigation } from "@/config/navigation";

function isActive(href: string, pathname: string): boolean {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200/80 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-lg lg:hidden"
      aria-label="Navegação principal"
    >
      <div className="mx-auto grid h-[4.25rem] max-w-lg grid-cols-5 items-end px-1">
        {mobileBottomNavigation.map((item) => {
          const active = isActive(item.href, pathname);
          const Icon = item.icon;

          if (item.featured) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="group relative flex flex-col items-center justify-end pb-2"
              >
                <div
                  className={cn(
                    "absolute -top-5 flex h-14 w-14 items-center justify-center rounded-2xl shadow-lg shadow-brand-600/30 transition-transform active:scale-95",
                    active
                      ? "bg-brand-700 ring-4 ring-brand-100"
                      : "bg-brand-600 group-hover:bg-brand-700"
                  )}
                >
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <span
                  className={cn(
                    "mt-6 text-[10px] font-semibold",
                    active ? "text-brand-700" : "text-slate-600"
                  )}
                >
                  {item.title}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex flex-col items-center gap-1 pb-2.5 pt-2 transition-colors",
                active ? "text-brand-700" : "text-slate-500 hover:text-slate-800"
              )}
            >
              <Icon className={cn("h-5 w-5", active && "stroke-[2.5px]")} />
              <span className="text-[10px] font-medium">{item.title}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
