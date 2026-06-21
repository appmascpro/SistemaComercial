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

/** Altura fixa da área de conteúdo — mantém as duas caixas alinhadas na base. */
const PANEL_BODY_CLASS =
  "h-[280px] overflow-hidden rounded-lg border border-slate-200";

function DashboardPanelEmpty({ message }: { message: string }) {
  return (
    <div className="flex h-full items-center justify-center border-dashed bg-slate-50">
      <p className="px-4 text-center text-sm text-slate-400">{message}</p>
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
    <ul className={`${PANEL_BODY_CLASS} divide-y divide-slate-100 overflow-y-auto`}>
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
    <ul className={`${PANEL_BODY_CLASS} divide-y divide-slate-100 overflow-y-auto`}>
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
