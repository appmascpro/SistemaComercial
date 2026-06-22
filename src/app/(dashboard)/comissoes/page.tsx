import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { CommissionsPageClient } from "@/components/commissions/commissions-page-client";
import { getCommissionsForTenant } from "@/lib/commissions/queries";
import type { CommissionStatus } from "@/types/commission";

export const dynamic = "force-dynamic";

function parseStatus(
  value: string | undefined
): CommissionStatus | "all" {
  const allowed: (CommissionStatus | "all")[] = [
    "all",
    "prevista",
    "pendente",
    "proporcional",
    "liberada",
    "paga",
    "cancelada",
  ];
  if (value && allowed.includes(value as CommissionStatus | "all")) {
    return value as CommissionStatus | "all";
  }
  return "all";
}

export default async function ComissoesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const params = await searchParams;
  const status = parseStatus(params.status);
  const { commissions, summary } = await getCommissionsForTenant(status);

  return (
    <div>
      <PageHeader
        title="Comissões"
        description="Comissão prevista ao criar o pedido, pendente ao confirmar, liberada ao faturar e proporcional em atendimento parcial."
      />

      <Suspense fallback={null}>
        <CommissionsPageClient
          status={status}
          summary={summary}
          commissions={commissions}
        />
      </Suspense>
    </div>
  );
}
