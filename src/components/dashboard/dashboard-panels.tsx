import Link from "next/link";
import {
  FileText,
  FlaskConical,
  ShoppingCart,
  Users,
} from "lucide-react";
import type {
  DashboardActivityItem,
  DashboardAgendaItem,
} from "@/lib/dashboard/queries";
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

/** Área de conteúdo com altura fixa e rolagem vertical interna. */
const PANEL_BODY_CLASS =
  "scrollbar-thin h-[280px] w-full min-w-0 overflow-x-hidden overflow-y-auto rounded-lg border border-slate-300";

function DashboardPanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full min-w-0 items-center justify-center border-dashed bg-slate-50 px-4">
      <p className="text-center text-sm leading-snug text-balance text-slate-400">
        {message}
      </p>
    </div>
  );
}

export function DashboardRecentActivity({
  items,
}: {
  items: DashboardActivityItem[];
}) {
  if (items.length === 0) {
    return (
      <div className={PANEL_BODY_CLASS}>
        <DashboardPanelEmpty message="Nenhuma movimentação recente ainda." />
      </div>
    );
  }

  return (
    <ul className={`${PANEL_BODY_CLASS} divide-y divide-slate-300`}>
      {items.map((item) => {
        const meta = TYPE_META[item.type];
        const Icon = meta.icon;

        return (
          <li key={`${item.type}-${item.id}`} className="min-w-0">
            <Link
              href={item.href}
              className="flex min-w-0 items-start gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
            >
              <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                <Icon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium text-slate-900">
                  {item.title}
                </p>
                <p className="truncate text-xs text-slate-500">{item.subtitle}</p>
                <span className="mt-1 block text-xs text-slate-400 sm:hidden">
                  {formatDate(item.created_at)}
                </span>
              </div>
              <span className="hidden shrink-0 text-xs text-slate-400 sm:inline">
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
  items: DashboardAgendaItem[];
}) {
  if (items.length === 0) {
    return (
      <div className={PANEL_BODY_CLASS}>
        <DashboardPanelEmpty message="Nenhuma rota, visita ou follow-up nos próximos 7 dias." />
      </div>
    );
  }

  return (
    <ul className={`${PANEL_BODY_CLASS} divide-y divide-slate-300`}>
      {items.map((item) => (
        <li key={`${item.kind}-${item.id}`} className="min-w-0">
          <Link
            href={item.href}
            className="flex min-w-0 items-start justify-between gap-3 px-4 py-3 transition-colors hover:bg-slate-50"
          >
            <div className="min-w-0 flex-1 overflow-hidden">
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
