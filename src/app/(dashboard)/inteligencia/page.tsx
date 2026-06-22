import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { IntelligencePageClient } from "@/components/intelligence/intelligence-page-client";
import { getIntelligencePageData } from "@/lib/intelligence/queries";
import type {
  IntelligencePeriod,
  IntelligenceTab,
} from "@/types/intelligence";

export const dynamic = "force-dynamic";

function parseTab(value: string | undefined): IntelligenceTab {
  const allowed: IntelligenceTab[] = [
    "panorama",
    "score",
    "recompra",
    "alertas",
    "margem",
    "produtos",
    "rotas",
    "regiao",
  ];
  if (value && allowed.includes(value as IntelligenceTab)) {
    return value as IntelligenceTab;
  }
  return "panorama";
}

function parsePeriod(value: string | undefined): IntelligencePeriod {
  if (
    value === "30d" ||
    value === "90d" ||
    value === "180d" ||
    value === "365d"
  ) {
    return value;
  }
  return "90d";
}

export default async function InteligenciaPage({
  searchParams,
}: {
  searchParams: Promise<{ aba?: string; periodo?: string }>;
}) {
  const params = await searchParams;
  const tab = parseTab(params.aba);
  const period = parsePeriod(params.periodo);
  const data = await getIntelligencePageData(tab, period);

  return (
    <div>
      <PageHeader
        title="Inteligência Comercial"
        description="Score de clientes, recompra, alertas, margem, produtos, conversão por rota e histórico por região."
      />

      <Suspense fallback={null}>
        <IntelligencePageClient data={data} />
      </Suspense>
    </div>
  );
}
