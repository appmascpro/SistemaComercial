"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { OrderFollowupsPanel } from "@/components/followups/order-followups-panel";
import { VisitForm } from "@/components/visits/visit-form";
import { VisitsReport } from "@/components/visits/visits-report";
import type {
  FollowupDayGroup,
  FollowupReportPeriod,
  FollowupReportSummary,
} from "@/types/followup";
import type {
  VisitReportDayGroup,
  VisitReportPeriod,
  VisitReportSummary,
} from "@/types/visit";

type VisitsTab = "relatorio" | "followups" | "cadastrar";

const TABS: { value: VisitsTab; label: string }[] = [
  { value: "relatorio", label: "Relatório" },
  { value: "followups", label: "Follow-ups pedidos" },
  { value: "cadastrar", label: "Cadastrar visita" },
];

function tabHref(tab: VisitsTab, visitPeriod: VisitReportPeriod, followupPeriod: FollowupReportPeriod) {
  if (tab === "cadastrar") return "/visitas?aba=cadastrar";
  if (tab === "followups") return `/visitas?aba=followups&periodo=${followupPeriod}`;
  return `/visitas?aba=relatorio&periodo=${visitPeriod}`;
}

export function VisitsPageClient({
  tab,
  period,
  followupPeriod,
  summary,
  groups,
  followupSummary,
  followupGroups,
}: {
  tab: VisitsTab;
  period: VisitReportPeriod;
  followupPeriod: FollowupReportPeriod;
  summary: VisitReportSummary;
  groups: VisitReportDayGroup[];
  followupSummary: FollowupReportSummary;
  followupGroups: FollowupDayGroup[];
}) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-300 bg-slate-50 p-1">
        {TABS.map((item) => (
          <Link
            key={item.value}
            href={tabHref(item.value, period, followupPeriod)}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
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
      ) : tab === "followups" ? (
        <OrderFollowupsPanel
          period={followupPeriod}
          summary={followupSummary}
          groups={followupGroups}
        />
      ) : (
        <VisitsReport period={period} summary={summary} groups={groups} />
      )}
    </div>
  );
}
