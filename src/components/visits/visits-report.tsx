"use client";

import Link from "next/link";
import { MessageCircle, UserRound } from "lucide-react";
import { formatDate } from "@/lib/utils";
import type {
  VisitReportDayGroup,
  VisitReportPeriod,
  VisitReportSummary,
} from "@/types/visit";

const PERIOD_OPTIONS: { value: VisitReportPeriod; label: string }[] = [
  { value: "hoje", label: "Hoje" },
  { value: "7d", label: "Últimos 7 dias" },
  { value: "15d", label: "Últimos 15 dias" },
  { value: "mes", label: "Este mês" },
];

function ContactTypeBadge({ type }: { type: "presencial" | "whatsapp" }) {
  if (type === "whatsapp") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-xs font-medium text-emerald-700">
        <MessageCircle className="h-3 w-3" />
        WhatsApp
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
      <UserRound className="h-3 w-3" />
      Presencial
    </span>
  );
}

function SummaryCards({ summary }: { summary: VisitReportSummary }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-lg border border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Total
        </p>
        <p className="mt-1 text-2xl font-bold text-slate-900">{summary.total}</p>
      </div>
      <div className="rounded-lg border border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          Presencial
        </p>
        <p className="mt-1 text-2xl font-bold text-blue-700">
          {summary.presencial}
        </p>
      </div>
      <div className="rounded-lg border border-slate-300 bg-white p-4">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
          WhatsApp
        </p>
        <p className="mt-1 text-2xl font-bold text-emerald-700">
          {summary.whatsapp}
        </p>
      </div>
    </div>
  );
}

function DayGroup({ group }: { group: VisitReportDayGroup }) {
  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      <div className="border-b border-slate-300 bg-slate-50 px-4 py-2">
        <p className="text-sm font-semibold text-slate-800">
          {formatDate(group.date + "T12:00:00")}
        </p>
        <p className="text-xs text-slate-500">
          {group.visits.length}{" "}
          {group.visits.length === 1 ? "contato" : "contatos"}
        </p>
      </div>
      <ul className="divide-y divide-slate-300">
        {group.visits.map((visit) => (
          <li key={visit.id} className="px-4 py-3">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <Link
                    href={`/clientes/${visit.customer.id}`}
                    className="text-sm font-medium text-slate-900 hover:text-brand-600"
                  >
                    {visit.customer.company_name}
                  </Link>
                  <ContactTypeBadge type={visit.contact_type} />
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Com {visit.contact_person_name ?? "—"}
                  {visit.contact_person_phone
                    ? ` · ${visit.contact_person_phone}`
                    : ""}
                </p>
                {visit.conversation_summary ? (
                  <p className="mt-2 text-sm text-slate-600">
                    {visit.conversation_summary}
                  </p>
                ) : null}
              </div>
              <div className="text-right text-xs text-slate-500">
                {visit.seller?.full_name ? (
                  <p>{visit.seller.full_name}</p>
                ) : null}
                {visit.next_action_date ? (
                  <p className="mt-1 text-brand-700">
                    Próximo: {formatDate(visit.next_action_date + "T12:00:00")}
                  </p>
                ) : null}
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function VisitsReport({
  period,
  summary,
  groups,
}: {
  period: VisitReportPeriod;
  summary: VisitReportSummary;
  groups: VisitReportDayGroup[];
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        {PERIOD_OPTIONS.map((option) => (
          <Link
            key={option.value}
            href={`/visitas?aba=relatorio&periodo=${option.value}`}
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

      <SummaryCards summary={summary} />

      {groups.length === 0 ? (
        <div className="rounded-lg border border-dashed border-slate-300 py-12 text-center">
          <p className="text-sm text-slate-500">
            Nenhuma visita registrada neste período.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map((group) => (
            <DayGroup key={group.date} group={group} />
          ))}
        </div>
      )}
    </div>
  );
}
