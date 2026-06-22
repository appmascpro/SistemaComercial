import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RouteTodayView } from "@/components/routes/route-today-view";
import { getTodayRoutesExecution } from "@/lib/routes/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RotaHojePage() {
  const data = await getTodayRoutesExecution();

  return (
    <div>
      <PageHeader
        title="Rota de hoje"
        description={`${formatDate(data.date + "T12:00:00")} — cidades do dia, clientes por prioridade A/B/C`}
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/rotas"
              className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Todas as rotas
            </Link>
            <Link
              href="/rotas/nova"
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Nova rota
            </Link>
          </div>
        }
      />

      <RouteTodayView data={data} />
    </div>
  );
}
