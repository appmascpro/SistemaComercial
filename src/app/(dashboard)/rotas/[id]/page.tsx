import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RouteExecutionView } from "@/components/routes/route-execution-view";
import { RouteStatusSelect } from "@/components/routes/route-status-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRouteById } from "@/lib/routes/queries";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function RotaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const route = await getRouteById(id);

  if (!route) notFound();

  const visited = route.stops.filter((s) => s.status === "visitado").length;

  return (
    <div>
      <PageHeader
        title={route.name}
        description={
          [
            route.polo,
            route.city,
            route.state,
            route.week_number ? `Semana ${route.week_number}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || "Rota comercial"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href="/rotas/hoje"
              className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Rota de hoje
            </Link>
            <RouteStatusSelect routeId={route.id} currentStatus={route.status} />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Data planejada</p>
            <p className="text-lg font-semibold">
              {route.planned_date ? formatDate(route.planned_date) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Paradas</p>
            <p className="text-lg font-semibold">{route.stops.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Visitadas</p>
            <p className="text-lg font-semibold text-emerald-700">
              {visited}/{route.stops.length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Semana</p>
            <p className="text-lg font-semibold">
              {route.week_number ? `Semana ${route.week_number}` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Executar rota</CardTitle>
        </CardHeader>
        <CardContent>
          <RouteExecutionView route={route} />
        </CardContent>
      </Card>

      {route.notes ? (
        <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{route.notes}</p>
      ) : null}
    </div>
  );
}
