import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type {
  FollowupDayGroup,
  FollowupReportPeriod,
  FollowupReportSummary,
  OrderFollowupItem,
} from "@/types/followup";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateDaysAgo(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString().slice(0, 10);
}

function endOfCurrentMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
}

function startOfCurrentMonth(): string {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

const FOLLOWUP_BASE_SELECT = `
  id,
  title,
  notes,
  status,
  due_at,
  completed_at,
  created_at,
  related_id,
  customers (
    id,
    company_name,
    city,
    state,
    phone
  )
`;

async function enrichFollowups(
  supabase: Awaited<ReturnType<typeof createTenantClient>>["supabase"],
  rows: Array<Record<string, unknown>>
): Promise<OrderFollowupItem[]> {
  if (!rows.length) return [];

  const orderIds = [...new Set(rows.map((r) => String(r.related_id)))];

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id, order_number, status")
    .in("id", orderIds);

  if (ordersError) throw new Error(ordersError.message);

  const orderMap = new Map((orders ?? []).map((o) => [o.id, o]));

  return rows
    .map((row) => {
      const customer = unwrapRelation(
        row.customers as
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
      const order = orderMap.get(String(row.related_id));

      if (!customer || !order) return null;

      return {
        id: String(row.id),
        title: row.title ? String(row.title) : null,
        notes: row.notes ? String(row.notes) : null,
        status: String(row.status) as OrderFollowupItem["status"],
        due_at: String(row.due_at),
        completed_at: row.completed_at ? String(row.completed_at) : null,
        created_at: String(row.created_at),
        order: {
          id: order.id,
          order_number: order.order_number,
          status: order.status,
        },
        customer: {
          id: customer.id,
          company_name: customer.company_name,
          city: customer.city,
          state: customer.state,
          phone: customer.phone,
        },
      };
    })
    .filter((item): item is OrderFollowupItem => item != null);
}

export async function getOrderFollowupsByOrderId(
  orderId: string
): Promise<OrderFollowupItem[]> {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("followups")
    .select(FOLLOWUP_BASE_SELECT)
    .eq("related_type", "order")
    .eq("related_id", orderId)
    .order("due_at", { ascending: true });

  if (error) throw new Error(error.message);

  return enrichFollowups(supabase, (data ?? []) as Array<Record<string, unknown>>);
}

export async function getOrderFollowupsForPeriod(
  period: FollowupReportPeriod
): Promise<OrderFollowupItem[]> {
  const { supabase } = await createTenantClient();
  const today = todayDateOnly();

  let query = supabase
    .from("followups")
    .select(FOLLOWUP_BASE_SELECT)
    .eq("related_type", "order");

  if (period === "atrasados") {
    query = query
      .eq("status", "pendente")
      .lt("due_at", `${today}T23:59:59`);
  } else if (period === "hoje") {
    query = query
      .gte("due_at", `${today}T00:00:00`)
      .lte("due_at", `${today}T23:59:59`);
  } else if (period === "7d") {
    query = query
      .gte("due_at", `${dateDaysAgo(7)}T00:00:00`)
      .lte("due_at", `${today}T23:59:59`);
  } else if (period === "15d") {
    const future = new Date();
    future.setDate(future.getDate() + 15);
    query = query
      .gte("due_at", `${today}T00:00:00`)
      .lte("due_at", `${future.toISOString().slice(0, 10)}T23:59:59`);
  } else {
    query = query
      .gte("due_at", `${startOfCurrentMonth()}T00:00:00`)
      .lte("due_at", `${endOfCurrentMonth()}T23:59:59`);
  }

  const { data, error } = await query.order("due_at", { ascending: true });

  if (error) throw new Error(error.message);

  return enrichFollowups(supabase, (data ?? []) as Array<Record<string, unknown>>);
}

export function buildFollowupReport(items: OrderFollowupItem[]): {
  summary: FollowupReportSummary;
  groups: FollowupDayGroup[];
} {
  const today = todayDateOnly();

  const summary: FollowupReportSummary = {
    total: items.length,
    pendentes: items.filter((i) => i.status === "pendente").length,
    concluidos: items.filter((i) => i.status === "concluido").length,
    atrasados: items.filter(
      (i) => i.status === "pendente" && i.due_at.slice(0, 10) < today
    ).length,
  };

  const byDate = new Map<string, OrderFollowupItem[]>();

  for (const item of items) {
    const date = item.due_at.slice(0, 10);
    const list = byDate.get(date) ?? [];
    list.push(item);
    byDate.set(date, list);
  }

  const groups = Array.from(byDate.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, dayItems]) => ({ date, items: dayItems }));

  return { summary, groups };
}

export async function getOrderFollowupReport(period: FollowupReportPeriod) {
  const items = await getOrderFollowupsForPeriod(period);
  return buildFollowupReport(items);
}
