import Link from "next/link";
import type { TodayRoutesExecution } from "@/types/route";
import { RouteStopVisitPanel } from "@/components/routes/route-stop-visit-panel";
import { formatDate } from "@/lib/utils";

export function RouteTodayView({ data }: { data: TodayRoutesExecution }) {
  if (data.routes.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-sm text-slate-600">Nenhuma rota planejada para hoje.</p>
        <Link
          href="/rotas/nova"
          className="mt-3 inline-block text-sm font-medium text-brand-600 hover:underline"
        >
          Criar rota para hoje
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-4">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <p className="text-xs text-slate-500">Paradas hoje</p>
          <p className="text-2xl font-semibold">{data.summary.total_stops}</p>
        </div>
        <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
          <p className="text-xs text-emerald-700">Visitadas</p>
          <p className="text-2xl font-semibold text-emerald-800">
            {data.summary.visited}
          </p>
        </div>
        <div className="rounded-lg border border-brand-200 bg-brand-50 p-4">
          <p className="text-xs text-brand-700">Planejadas</p>
          <p className="text-2xl font-semibold text-brand-800">
            {data.summary.planned}
          </p>
        </div>
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
          <p className="text-xs text-amber-700">Reagendar</p>
          <p className="text-2xl font-semibold text-amber-800">
            {data.summary.reschedule}
          </p>
        </div>
      </div>

      {data.routes.map((route) => (
        <div
          key={route.id}
          className="rounded-lg border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-600"
        >
          <Link href={`/rotas/${route.id}`} className="font-medium text-brand-600 hover:underline">
            {route.name}
          </Link>
          {" · "}
          {[route.polo, route.city].filter(Boolean).join(" / ")}
          {route.week_number ? ` · Semana ${route.week_number}` : ""}
          {route.planned_date ? ` · ${formatDate(route.planned_date + "T12:00:00")}` : ""}
        </div>
      ))}

      {data.cityGroups.map((group) => (
        <section key={group.cityKey}>
          <h2 className="mb-3 text-base font-semibold text-slate-900">
            {group.city}
            {group.state ? ` / ${group.state}` : ""}
            <span className="ml-2 text-sm font-normal text-slate-500">
              {group.stops.length} cliente{group.stops.length > 1 ? "s" : ""}
            </span>
          </h2>
          <div className="space-y-3">
            {group.stops.map((stop) => (
              <RouteStopVisitPanel
                key={stop.id}
                stop={stop}
                routeId={stop.route_id}
                routeName={stop.route_name}
                weekNumber={stop.week_number}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
