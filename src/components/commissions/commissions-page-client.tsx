"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BackfillCommissionsButton } from "@/components/commissions/backfill-commissions-button";
import { CommissionsTable } from "@/components/commissions/commissions-table";
import { Card, CardContent } from "@/components/ui/card";
import type {
  CommissionListItem,
  CommissionStatus,
  CommissionSummary,
} from "@/types/commission";
import { formatCurrency } from "@/lib/utils";

const FILTERS: { value: CommissionStatus | "all"; label: string }[] = [
  { value: "all", label: "Todas" },
  { value: "prevista", label: "Previstas" },
  { value: "pendente", label: "Pendentes" },
  { value: "proporcional", label: "Proporcionais" },
  { value: "liberada", label: "Liberadas" },
  { value: "paga", label: "Pagas" },
  { value: "cancelada", label: "Canceladas" },
];

export function CommissionsPageClient({
  status,
  summary,
  commissions,
  isAdmin,
}: {
  status: CommissionStatus | "all";
  summary: CommissionSummary;
  commissions: CommissionListItem[];
  isAdmin: boolean;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function filterHref(next: CommissionStatus | "all") {
    const params = new URLSearchParams(searchParams.toString());
    if (next === "all") {
      params.delete("status");
    } else {
      params.set("status", next);
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const summaryCards = [
    { label: "Em aberto", value: summary.total_open, tone: "text-rose-700" },
    { label: "Previstas", value: summary.prevista, tone: "text-blue-700" },
    { label: "Pendentes", value: summary.pendente, tone: "text-amber-700" },
    {
      label: "Liberadas",
      value: summary.liberada + summary.proporcional,
      tone: "text-emerald-700",
    },
    { label: "Pagas", value: summary.paga, tone: "text-slate-700" },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
        {summaryCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4">
              <p className="text-xs text-slate-500">{card.label}</p>
              <p className={`text-lg font-semibold ${card.tone}`}>
                {formatCurrency(card.value, "BRL")}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-wrap gap-2">
        {FILTERS.map((filter) => {
          const active = status === filter.value;
          return (
            <Link
              key={filter.value}
              href={filterHref(filter.value)}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                active
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              }`}
            >
              {filter.label}
            </Link>
          );
        })}
      </div>

      {isAdmin ? (
        <Card>
          <CardContent className="pt-4">
            <BackfillCommissionsButton />
          </CardContent>
        </Card>
      ) : null}

      <CommissionsTable commissions={commissions} />
    </div>
  );
}
