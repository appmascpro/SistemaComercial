import Link from "next/link";
import {
  FileText,
  FlaskConical,
  ShoppingCart,
  Users,
} from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardActivityItem } from "@/lib/dashboard/queries";
import { formatDate } from "@/lib/utils";

const TYPE_META: Record<
  DashboardActivityItem["type"],
  { icon: typeof FileText; label: string }
> = {
  quote: { icon: FileText, label: "Cotação" },
  order: { icon: ShoppingCart, label: "Pedido" },
  sample: { icon: FlaskConical, label: "Amostra" },
  customer: { icon: Users, label: "Cliente" },
};

export function DashboardRecentActivity({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">
          Nenhuma movimentação recente ainda.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;

        return (
          <li key={`${item.type}-${item.id}`}>
            <Link
              href={item.href}
              className="flex items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.title}
                </p>
                <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
              </div>
              <span className="shrink-0 text-xs text-slate-400">
                {formatDate(item.created_at)}
              </span>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

export function DashboardAgenda({
  items,
}: {
  items: import("@/lib/dashboard/queries").DashboardAgendaItem[];
}) {
  if (items.length === 0) {
    return (
      <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
        <p className="text-sm text-slate-400">
          Nenhuma rota ou follow-up nos próximos 7 dias.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-slate-100 rounded-lg border border-slate-200">
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`}>
          <Link
            href={item.href}
            className="flex items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
          >
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-slate-900">
                {item.title}
              </p>
              <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
            </div>
            <span className="shrink-0 text-xs font-medium text-brand-700">
              {formatDate(item.date + "T12:00:00")}
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
