import { PageHeader } from "@/components/layout/page-header";
import { VisitsPageClient } from "@/components/visits/visits-page-client";
import { getOrderFollowupReport } from "@/lib/followups/queries";
import { getVisitReport } from "@/lib/visits/queries";
import type { FollowupReportPeriod } from "@/types/followup";
import type { VisitReportPeriod } from "@/types/visit";

export const dynamic = "force-dynamic";

function parseTab(value: string | undefined): "relatorio" | "followups" | "cadastrar" {
  if (value === "cadastrar") return "cadastrar";
  if (value === "followups") return "followups";
  return "relatorio";
}

function parseVisitPeriod(value: string | undefined): VisitReportPeriod {
  if (value === "hoje" || value === "7d" || value === "15d" || value === "mes") {
    return value;
  }
  return "7d";
}

function parseFollowupPeriod(value: string | undefined): FollowupReportPeriod {
  if (
    value === "hoje" ||
    value === "7d" ||
    value === "15d" ||
    value === "mes" ||
    value === "atrasados"
  ) {
    return value;
  }
  return "15d";
}

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; periodo?: string }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.aba);
  const period = parseVisitPeriod(params.periodo);
  const followupPeriod = parseFollowupPeriod(params.periodo);

  const [visitReport, followupReport] = await Promise.all([
    tab === "relatorio" ? getVisitReport(period) : null,
    tab === "followups" ? getOrderFollowupReport(followupPeriod) : null,
  ]);

  return (
    <div>
      <PageHeader
        title="Visitas"
        description="Registre contatos, acompanhe follow-ups de pedidos e veja o relatório da equipe."
      />

      <VisitsPageClient
        tab={tab}
        period={period}
        followupPeriod={followupPeriod}
        summary={visitReport?.summary ?? { total: 0, presencial: 0, whatsapp: 0 }}
        groups={visitReport?.groups ?? []}
        followupSummary={
          followupReport?.summary ?? {
            total: 0,
            pendentes: 0,
            concluidos: 0,
            atrasados: 0,
          }
        }
        followupGroups={followupReport?.groups ?? []}
      />
    </div>
  );
}
