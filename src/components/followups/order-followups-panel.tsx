"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { CheckCircle2, Clock, Package } from "lucide-react";
import { completeOrderFollowupAction } from "@/app/actions/followups";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import type {
  FollowupDayGroup,
  FollowupReportPeriod,
  FollowupReportSummary,
  OrderFollowupItem,
} from "@/types/followup";
import type { VisitContactType } from "@/types/visit";

const PERIOD_OPTIONS: { value: FollowupReportPeriod; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "15d", label: "Próximos 15 dias" },
  { value: "mes", label: "Este mês" },
  { value: "atrasados", label: "Atrasados" },
];

function SummaryCards({ summary }: { summary: FollowupReportSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <div className="rounded-lg border border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Total</p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
      </div>
      <div className="rounded-lg border border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Pendentes</p>
        <p className="mt-1 text-2xl font-bold text-amber-700">{summary.pendentes}</p>
      </div>
      <div className="rounded-lg border border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Concluídos</p>
        <p className="mt-1 text-2xl font-bold text-emerald-700">{summary.concluidos}</p>
      </div>
      <div className="rounded-lg border border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase text-slate-500">Atrasados</p>
        <p className="mt-1 text-2xl font-bold text-red-700">{summary.atrasados}</p>
      </div>
    </div>
  );
}

function FollowupCompleteForm({
  item,
  onDone,
}: {
  item: OrderFollowupItem;
  onDone: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [contactType, setContactType] = useState<VisitContactType>("whatsapp");
  const [summary, setSummary] = useState("");
  const [contactName, setContactName] = useState("");
  const [contactPhone, setContactPhone] = useState(item.customer.phone ?? "");

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = await completeOrderFollowupAction({
        followupId: item.id,
        contact_type: contactType,
        conversation_summary: summary || item.notes || item.title || undefined,
        contact_person_name: contactName,
        contact_person_phone: contactPhone,
      });
      if (result.error) {
        setError(result.error);
        return;
      }
      setOpen(false);
      onDone();
    });
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        disabled={item.status !== "pendente"}
        className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        <CheckCircle2 className="h-3.5 w-3.5" />
        Registrar contato
      </button>
    );
  }

  return (
    <div className="mt-3 space-y-3 rounded-lg border border-slate-300 bg-slate-50 p-3">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { value: "whatsapp", label: "WhatsApp" },
            { value: "presencial", label: "Presencial" },
          ] as const
        ).map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setContactType(opt.value)}
            className={`rounded-lg border px-3 py-1 text-xs font-medium ${
              contactType === opt.value
                ? "border-brand-600 bg-brand-50 text-brand-700"
                : "border-slate-300 text-slate-600"
            }`}
          >
            {opt.label}
          </button>
        ))}
      </div>
      <input
        type="text"
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="Com quem falou"
        className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />
      <input
        type="text"
        value={contactPhone}
        onChange={(e) => setContactPhone(e.target.value)}
        placeholder="WhatsApp / telefone"
        className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
      />
      <textarea
        value={summary}
        onChange={(e) => setSummary(e.target.value)}
        rows={2}
        placeholder="Como foi o contato..."
        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
      />
      {error ? <p className="text-xs text-red-600">{error}</p> : null}
      <div className="flex gap-2">
        <Button type="button" size="sm" onClick={handleSubmit} disabled={isPending}>
          {isPending ? "Salvando..." : "Concluir follow-up"}
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => setOpen(false)}
        >
          Cancelar
        </Button>
      </div>
    </div>
  );
}

function FollowupRow({
  item,
  onComplete,
}: {
  item: OrderFollowupItem;
  onComplete: () => void;
}) {
  const today = new Date().toISOString().slice(0, 10);
  const isLate =
    item.status === "pendente" && item.due_at.slice(0, 10) < today;
  const isDone = item.status === "concluido";

  return (
    <li className="px-4 py-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Package className="h-4 w-4 shrink-0 text-brand-600" />
            <Link
              href={`/pedidos/${item.order.id}`}
              className="text-sm font-medium text-slate-900 hover:text-brand-600"
            >
              {item.order.order_number}
            </Link>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium uppercase ${
                isDone
                  ? "bg-emerald-50 text-emerald-700"
                  : isLate
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
              }`}
            >
              {isDone ? "Concluído" : isLate ? "Atrasado" : "Pendente"}
            </span>
          </div>
          <p className="mt-1 text-sm text-slate-700">{item.title}</p>
          <Link
            href={`/clientes/${item.customer.id}`}
            className="text-xs text-slate-500 hover:text-brand-600"
          >
            {item.customer.company_name}
            {[item.customer.city, item.customer.state]
              .filter(Boolean)
              .join(" / ")}
          </Link>
          {item.notes ? (
            <p className="mt-1 text-xs text-slate-500">{item.notes}</p>
          ) : null}
        </div>
        <div className="text-right text-xs text-slate-500">
          <div className="flex items-center justify-end gap-1">
            <Clock className="h-3.5 w-3.5" />
            {formatDate(item.due_at)}
          </div>
          {item.completed_at ? (
            <p className="mt-1 text-emerald-700">
              Feito em {formatDate(item.completed_at)}
            </p>
          ) : null}
        </div>
      </div>
      {!isDone ? <FollowupCompleteForm item={item} onDone={onComplete} /> : null}
    </li>
  );
}

export function OrderFollowupsPanel({
  period,
  summary,
  groups,
  compact = false,
}: {
  period?: FollowupReportPeriod;
  summary?: FollowupReportSummary;
  groups?: FollowupDayGroup[];
  compact?: boolean;
}) {
  const router = useRouter();

  if (compact) {
    const items = groups?.flatMap((g) => g.items) ?? [];
    if (items.length === 0) {
      return (
        <p className="text-sm text-slate-500">Nenhum follow-up de pedido.</p>
      );
    }
    return (
      <ul className="divide-y divide-slate-300">
        {items.map((item) => (
          <FollowupRow
            key={item.id}
            item={item}
            onComplete={() => router.refresh()}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className="space-y-4">
      {period ? (
        <div className="flex flex-wrap gap-2">
          {PERIOD_OPTIONS.map((option) => (
            <Link
              key={option.value}
              href={`/visitas?aba=followups&periodo=${option.value}`}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition-colors ${
                period === option.value
                  ? "border-brand-600 bg-brand-50 text-brand-700"
                  : "border-slate-300 text-slate-600 hover:bg-slate-50"
              }`}
            >
              {option.label}
            </Link>
          ))}
        </div>
      ) : null}

      {summary ? <SummaryCards summary={summary} /> : null}

      {!groups?.length ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">
            Nenhum follow-up de pedido neste período.
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Follow-ups são criados automaticamente ao converter cotação em pedido.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <div
              key={group.date}
              className="overflow-hidden rounded-lg border border-slate-300"
            >
              <div className="border-b border-slate-300 bg-slate-50 px-4 py-2">
                <p className="text-sm font-semibold text-slate-800">
                  {formatDate(group.date + "T12:00:00")}
                </p>
              </div>
              <ul className="divide-y divide-slate-300 bg-white">
                {group.items.map((item) => (
                  <FollowupRow
                    key={item.id}
                    item={item}
                    onComplete={() => router.refresh()}
                  />
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
