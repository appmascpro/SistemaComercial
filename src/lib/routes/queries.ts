import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { RouteDetail, RouteListItem } from "@/types/route";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

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
      priority,
      status,
      planned_date,
      created_at,
      route_stops ( id )
    `
    )
    .order("planned_date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => ({
    id: row.id,
    name: row.name,
    polo: row.polo,
    city: row.city,
    state: row.state,
    priority: row.priority,
    status: row.status,
    planned_date: row.planned_date,
    stops_count: ((row.route_stops ?? []) as Array<{ id: string }>).length,
    created_at: row.created_at,
  }));
}

export async function getRouteById(id: string): Promise<RouteDetail | null> {
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
      priority,
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
        notes,
        customers (
          id,
          company_name,
          city,
          state,
          phone
        )
      )
    `
    )
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const stops = ((data.route_stops ?? []) as Array<Record<string, unknown>>)
    .sort((a, b) => Number(a.stop_order) - Number(b.stop_order))
    .map((stop) => {
      const customer = unwrapRelation(
        stop.customers as
          | {
              id: string;
              company_name: string;
              city: string | null;
              state: string | null;
              phone: string | null;
            }
          | Array<{
              id: string;
              company_name: string;
              city: string | null;
              state: string | null;
              phone: string | null;
            }>
      );

      return {
        id: String(stop.id),
        stop_order: Number(stop.stop_order),
        priority: String(stop.priority),
        status: String(stop.status),
        planned_at: stop.planned_at ? String(stop.planned_at) : null,
        completed_at: stop.completed_at ? String(stop.completed_at) : null,
        notes: stop.notes ? String(stop.notes) : null,
        customer: {
          id: customer?.id ?? "",
          company_name: customer?.company_name ?? "—",
          city: customer?.city ?? null,
          state: customer?.state ?? null,
          phone: customer?.phone ?? null,
        },
      };
    });

  return {
    id: data.id,
    name: data.name,
    polo: data.polo,
    city: data.city,
    state: data.state,
    priority: data.priority,
    status: data.status,
    planned_date: data.planned_date,
    started_at: data.started_at,
    finished_at: data.finished_at,
    notes: data.notes,
    created_at: data.created_at,
    stops,
  };
}
