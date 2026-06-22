import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import {
  ROUTE_STOP_PRIORITY_ORDER,
  type RouteDetail,
  type RouteListItem,
  type RouteStopDetail,
  type TodayRouteCityGroup,
  type TodayRoutesExecution,
} from "@/types/route";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function mapStopRow(
  stop: Record<string, unknown>,
  extra?: Partial<RouteStopDetail>
): RouteStopDetail {
  const customer = unwrapRelation(
    stop.customers as
      | Record<string, unknown>
      | Array<Record<string, unknown>>
      | null
  );

  return {
    id: String(stop.id),
    stop_order: Number(stop.stop_order),
    priority: String(stop.priority ?? "B"),
    status: String(stop.status ?? "planejado"),
    planned_at: stop.planned_at ? String(stop.planned_at) : null,
    completed_at: stop.completed_at ? String(stop.completed_at) : null,
    visit_id: stop.visit_id ? String(stop.visit_id) : null,
    notes: stop.notes ? String(stop.notes) : null,
    city: stop.city ? String(stop.city) : null,
    state: stop.state ? String(stop.state) : null,
    customer: {
      id: String(customer?.id ?? ""),
      company_name: String(customer?.company_name ?? "—"),
      city: customer?.city ? String(customer.city) : null,
      state: customer?.state ? String(customer.state) : null,
      phone: customer?.phone ? String(customer.phone) : null,
      buyer_name: customer?.buyer_name ? String(customer.buyer_name) : null,
      buyer_phone: customer?.buyer_phone ? String(customer.buyer_phone) : null,
      lead_status: customer?.lead_status ? String(customer.lead_status) : null,
      products_of_interest: customer?.products_of_interest
        ? String(customer.products_of_interest)
        : null,
      pain_point: customer?.pain_point ? String(customer.pain_point) : null,
      current_supplier: customer?.current_supplier
        ? String(customer.current_supplier)
        : null,
      potential_volume: customer?.potential_volume
        ? String(customer.potential_volume)
        : null,
      next_visit_at: customer?.next_visit_at
        ? String(customer.next_visit_at)
        : null,
    },
    ...extra,
  };
}

function sortStops(stops: RouteStopDetail[]): RouteStopDetail[] {
  return [...stops].sort((a, b) => {
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
  });
}

function mapRouteRow(data: Record<string, unknown>): RouteDetail {
  const stops = sortStops(
    ((data.route_stops ?? []) as Array<Record<string, unknown>>).map((stop) =>
      mapStopRow(stop)
    )
  );

  return {
    id: String(data.id),
    name: String(data.name),
    polo: data.polo ? String(data.polo) : null,
    city: data.city ? String(data.city) : null,
    state: data.state ? String(data.state) : null,
    week_number:
      data.week_number != null ? Number(data.week_number) : null,
    status: String(data.status),
    planned_date: data.planned_date ? String(data.planned_date) : null,
    started_at: data.started_at ? String(data.started_at) : null,
    finished_at: data.finished_at ? String(data.finished_at) : null,
    notes: data.notes ? String(data.notes) : null,
    created_at: String(data.created_at),
    stops,
  };
}

const ROUTE_SELECT = `
  id,
  name,
  polo,
  city,
  state,
  week_number,
  status,
  planned_date,
  started_at,
  finished_at,
  notes,
  created_at,
  route_stops (
    id,
    stop_order,
    priority,
    status,
    planned_at,
    completed_at,
    visit_id,
    notes,
    city,
    state,
    customers (
      id,
      company_name,
      city,
      state,
      phone,
      buyer_name,
      buyer_phone,
      lead_status,
      products_of_interest,
      pain_point,
      current_supplier,
      potential_volume,
      next_visit_at
    )
  )
`;

export async function getRoutesForTenant(limit = 50): Promise<RouteListItem[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("routes")
    .select(
      `
      id,
      name,
      polo,
      city,
      state,
      week_number,
      status,
      planned_date,
      created_at,
      route_stops ( id, status )
    `
    )
    .order("planned_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => {
    const stops = (row.route_stops ?? []) as Array<{ id: string; status: string }>;
    return {
      id: row.id,
      name: row.name,
      polo: row.polo,
      city: row.city,
      state: row.state,
      week_number: row.week_number,
      status: row.status,
      planned_date: row.planned_date,
      stops_count: stops.length,
      visited_count: stops.filter((s) => s.status === "visitado").length,
      created_at: row.created_at,
    };
  });
}

export async function getRouteById(id: string): Promise<RouteDetail | null> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("routes")
    .select(ROUTE_SELECT)
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  return mapRouteRow(data as Record<string, unknown>);
}

export async function getRoutesForDate(date: string): Promise<RouteDetail[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("routes")
    .select(ROUTE_SELECT)
    .eq("planned_date", date)
    .in("status", ["planejada", "em_andamento", "concluida"])
    .order("week_number", { ascending: true, nullsFirst: false })
    .order("name", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapRouteRow(row as Record<string, unknown>));
}

export async function getTodayRoutesExecution(
  date = todayDateOnly()
): Promise<TodayRoutesExecution> {
  const routes = await getRoutesForDate(date);

  const cityMap = new Map<string, TodayRouteCityGroup>();

  for (const route of routes) {
    for (const stop of route.stops) {
      const city = stop.city ?? stop.customer.city ?? "Sem cidade";
      const state = stop.state ?? stop.customer.state;
      const cityKey = `${city}|${state ?? ""}`;

      if (!cityMap.has(cityKey)) {
        cityMap.set(cityKey, {
          cityKey,
          city,
          state,
          stops: [],
        });
      }

      cityMap.get(cityKey)!.stops.push({
        ...stop,
        route_id: route.id,
        route_name: route.name,
        route_polo: route.polo,
        week_number: route.week_number,
      });
    }
  }

  const cityGroups: TodayRouteCityGroup[] = [...cityMap.values()]
    .map((group) => ({
      ...group,
      stops: [...group.stops].sort((a, b) => {
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
    }))
    .sort((a, b) => a.city.localeCompare(b.city, "pt-BR"));

  const allStops = routes.flatMap((r) => r.stops);

  return {
    date,
    routes,
    cityGroups,
    summary: {
      total_stops: allStops.length,
      visited: allStops.filter((s) => s.status === "visitado").length,
      planned: allStops.filter((s) => s.status === "planejado").length,
      reschedule: allStops.filter((s) => s.status === "reagendar").length,
    },
  };
}

export { unwrapRelation };
