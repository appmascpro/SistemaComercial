import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { RouteStatusSelect } from "@/components/routes/route-status-select";
import { RouteStopStatusButton } from "@/components/routes/route-stop-status-button";
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
          [route.polo, route.city, route.state].filter(Boolean).join(" · ") ||
          "Rota comercial"
        }
        action={<RouteStatusSelect routeId={route.id} currentStatus={route.status} />}
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
            <p className="text-xs text-slate-500">Prioridade</p>
            <p className="text-lg font-semibold capitalize">{route.priority}</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ordem de visitas</CardTitle>
        </CardHeader>
        <CardContent>
          {route.stops.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma parada cadastrada.</p>
          ) : (
            <ol className="space-y-3">
              {route.stops.map((stop) => (
                <li
                  key={stop.id}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-300 p-4"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
                    {stop.stop_order}
                  </span>
                  <div className="min-w-0 flex-1">
                    <Link
                      href={`/clientes/${stop.customer.id}`}
                      className="font-medium text-brand-600 hover:underline"
                    >
                      {stop.customer.company_name}
                    </Link>
                    <p className="text-xs text-slate-500">
                      {[stop.customer.city, stop.customer.state]
                        .filter(Boolean)
                        .join(" / ")}
                      {stop.customer.phone ? ` · ${stop.customer.phone}` : ""}
                    </p>
                    {stop.notes ? (
                      <p className="mt-1 text-xs text-slate-600">{stop.notes}</p>
                    ) : null}
                  </div>
                  <RouteStopStatusButton
                    stopId={stop.id}
                    routeId={route.id}
                    currentStatus={stop.status}
                  />
                </li>
              ))}
            </ol>
          )}

          {route.notes ? (
            <p className="mt-4 rounded-lg bg-slate-50 p-3 text-sm text-slate-600">
              {route.notes}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
