"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { VisitForm } from "@/components/visits/visit-form";
import { VisitsReport } from "@/components/visits/visits-report";
import type {
  VisitReportDayGroup,
  VisitReportPeriod,
  VisitReportSummary,
} from "@/types/visit";

type VisitsTab = "relatorio" | "cadastrar";

const TABS: { value: VisitsTab; label: string }[] = [
  { value: "relatorio", label: "Relatório" },
  { value: "cadastrar", label: "Cadastrar visita" },
];

export function VisitsPageClient({
  tab,
  period,
  summary,
  groups,
}: {
  tab: VisitsTab;
  period: VisitReportPeriod;
  summary: VisitReportSummary;
  groups: VisitReportDayGroup[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {TABS.map((item) => (
          <Link
            key={item.value}
            href={
              item.value === "cadastrar"
                ? "/visitas?aba=cadastrar"
                : `/visitas?aba=relatorio&periodo=${period}`
            }
            className={cn(
              "flex-1 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
              tab === item.value
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {tab === "cadastrar" ? (
        <VisitForm
          onSuccess={() => {
            router.push("/visitas?aba=relatorio&periodo=hoje");
          }}
        />
      ) : (
        <VisitsReport period={period} summary={summary} groups={groups} />
      )}
    </div>
  );
}
