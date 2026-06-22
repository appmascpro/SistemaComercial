import {
  ROUTE_STOP_PRIORITY_ORDER,
  type RouteDetail,
  type RouteStopDetail,
} from "@/types/route";
import { RouteStopVisitPanel } from "@/components/routes/route-stop-visit-panel";

function groupStopsByCity(stops: RouteStopDetail[]) {
  const map = new Map<string, RouteStopDetail[]>();

  for (const stop of stops) {
    const city = stop.city ?? stop.customer.city ?? "Sem cidade";
    const state = stop.state ?? stop.customer.state ?? "";
    const key = `${city}|${state}`;
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(stop);
  }

  return [...map.entries()]
    .map(([key, cityStops]) => {
      const [city, state] = key.split("|");
      return {
        city,
        state: state || null,
        stops: [...cityStops].sort((a, b) => {
          const pa =
            ROUTE_STOP_PRIORITY_ORDER[
              (a.priority as keyof typeof ROUTE_STOP_PRIORITY_ORDER) ?? "B"
            ] ?? 1;
          const pb =
            ROUTE_STOP_PRIORITY_ORDER[
              (b.priority as keyof typeof ROUTE_STOP_PRIORITY_ORDER) ?? "B"
            ] ?? 1;
          if (pa !== pb) return pa - pb;
          return a.stop_order - b.stop_order;
        }),
      };
    })
    .sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));
}

export function RouteExecutionView({ route }: { route: RouteDetail }) {
  const groups = groupStopsByCity(route.stops);
  const pending = route.stops.filter((s) => s.status !== "visitado").length;

  return (
    <div className="space-y-6">
      {pending > 0 ? (
        <p className="rounded-lg border border-brand-200 bg-brand-50 px-4 py-3 text-sm text-brand-800">
          {pending} visita{pending > 1 ? "s" : ""} pendente{pending > 1 ? "s" : ""} —
          prioridade A → B → C dentro de cada cidade.
        </p>
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
          Todas as paradas desta rota foram visitadas.
        </p>
      )}

      {groups.map((group) => (
        <section key={`${group.city}-${group.state}`}>
          <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-900">
            <span className="rounded-md bg-slate-100 px-2 py-1">
              {group.city}
              {group.state ? ` / ${group.state}` : ""}
            </span>
            <span className="font-normal text-slate-500">
              ({group.stops.length} cliente{group.stops.length > 1 ? "s" : ""})
            </span>
          </h3>
          <div className="space-y-3">
            {group.stops.map((stop) => (
              <RouteStopVisitPanel
                key={stop.id}
                stop={stop}
                routeId={route.id}
                routeName={route.name}
                weekNumber={route.week_number}
              />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
