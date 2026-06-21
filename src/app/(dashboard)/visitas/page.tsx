import { PageHeader } from "@/components/layout/page-header";
import { VisitsPageClient } from "@/components/visits/visits-page-client";
import { getVisitReport } from "@/lib/visits/queries";
import type { VisitReportPeriod } from "@/types/visit";

export const dynamic = "force-dynamic";

function parseTab(value: string | undefined): "relatorio" | "cadastrar" {
  return value === "cadastrar" ? "cadastrar" : "relatorio";
}

function parsePeriod(value: string | undefined): VisitReportPeriod {
  if (value === "hoje" || value === "7d" || value === "15d" || value === "mes") {
    return value;
  }
  return "7d";
}

export default async function VisitasPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; periodo?: string }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.aba);
  const period = parsePeriod(params.periodo);
  const report = tab === "relatorio" ? await getVisitReport(period) : null;

  return (
    <div>
      <PageHeader
        title="Visitas"
        description="Registre contatos com clientes e acompanhe o relatório diário da equipe."
      />

      <VisitsPageClient
        tab={tab}
        period={period}
        summary={report?.summary ?? { total: 0, presencial: 0, whatsapp: 0 }}
        groups={report?.groups ?? []}
      />
    </div>
  );
}
