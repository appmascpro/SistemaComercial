import Link from "next/link";
import { Suspense } from "react";
import { PageHeader } from "@/components/layout/page-header";
import { BackfillCommissionsButton } from "@/components/commissions/backfill-commissions-button";
import { CommissionsPageClient } from "@/components/commissions/commissions-page-client";
import { getCurrentProfile } from "@/lib/auth/session";
import { backfillCommissionsForTenant } from "@/lib/commissions/backfill";
import { getCommissionsForTenant } from "@/lib/commissions/queries";
import { createTenantClient } from "@/lib/supabase/tenant-db";
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
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  let { commissions, summary } = await getCommissionsForTenant(status);

  if (commissions.length === 0) {
    const { supabase } = await createTenantClient();
    const { count } = await supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .not("seller_id", "is", null);

    if ((count ?? 0) > 0) {
      await backfillCommissionsForTenant();
      ({ commissions, summary } = await getCommissionsForTenant(status));
    }
  }

  return (
    <div>
      <PageHeader
        title="Comissões"
        description="Comissão prevista ao criar o pedido, pendente ao confirmar, liberada ao faturar e proporcional em atendimento parcial."
        action={
          <Link
            href="/configuracoes#comissoes"
            className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Configurar taxas por produto
          </Link>
        }
      />

      <Suspense fallback={null}>
        <CommissionsPageClient
          status={status}
          summary={summary}
          commissions={commissions}
          isAdmin={Boolean(isAdmin)}
        />
      </Suspense>
    </div>
  );
}
