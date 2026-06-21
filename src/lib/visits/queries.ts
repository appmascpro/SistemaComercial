import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type {
  VisitListItem,
  VisitReportDayGroup,
  VisitReportPeriod,
  VisitReportSummary,
} from "@/types/visit";

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

function startOfCurrentMonth(): string {
  const date = new Date();
  date.setDate(1);
  return date.toISOString().slice(0, 10);
}

function endOfCurrentMonth(): string {
  const date = new Date();
  date.setMonth(date.getMonth() + 1, 0);
  return date.toISOString().slice(0, 10);
}

function periodRange(period: VisitReportPeriod): { from: string; to: string } {
  const today = todayDateOnly();

  switch (period) {
    case "hoje":
      return { from: today, to: today };
    case "7d":
      return { from: dateDaysAgo(6), to: today };
    case "15d":
      return { from: dateDaysAgo(14), to: today };
    case "mes":
      return { from: startOfCurrentMonth(), to: endOfCurrentMonth() };
  }
}

function mapVisitRow(row: Record<string, unknown>): VisitListItem {
  const customer = unwrapRelation(
    row.customers as
      | {
          id: string;
          company_name: string;
          city: string | null;
          state: string | null;
        }
      | Array<{
          id: string;
          company_name: string;
          city: string | null;
          state: string | null;
        }>
  );

  const seller = unwrapRelation(
    row.profiles as
      | { id: string; full_name: string | null }
      | Array<{ id: string; full_name: string | null }>
  );

  return {
    id: String(row.id),
    visited_at: String(row.visited_at),
    contact_type: String(row.contact_type) as VisitListItem["contact_type"],
    conversation_summary: row.conversation_summary
      ? String(row.conversation_summary)
      : null,
    contact_person_name: row.contact_person_name
      ? String(row.contact_person_name)
      : null,
    contact_person_phone: row.contact_person_phone
      ? String(row.contact_person_phone)
      : null,
    next_action_date: row.next_action_date
      ? String(row.next_action_date)
      : null,
    city: row.city ? String(row.city) : null,
    state: row.state ? String(row.state) : null,
    customer: {
      id: customer?.id ?? "",
      company_name: customer?.company_name ?? "—",
      city: customer?.city ?? null,
      state: customer?.state ?? null,
    },
    seller: seller
      ? { id: seller.id, full_name: seller.full_name }
      : null,
  };
}

const VISIT_SELECT = `
  id,
  visited_at,
  contact_type,
  conversation_summary,
  contact_person_name,
  contact_person_phone,
  next_action_date,
  city,
  state,
  customers (
    id,
    company_name,
    city,
    state
  ),
  profiles (
    id,
    full_name
  )
`;

export async function getVisitsForPeriod(
  period: VisitReportPeriod
): Promise<VisitListItem[]> {
  const { supabase } = await createTenantClient();
  const { from, to } = periodRange(period);

  const { data, error } = await supabase
    .from("visits")
    .select(VISIT_SELECT)
    .gte("visited_at", `${from}T00:00:00`)
    .lte("visited_at", `${to}T23:59:59`)
    .order("visited_at", { ascending: false });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row) => mapVisitRow(row as Record<string, unknown>));
}

export function buildVisitReport(
  visits: VisitListItem[]
): { summary: VisitReportSummary; groups: VisitReportDayGroup[] } {
  const summary: VisitReportSummary = {
    total: visits.length,
    presencial: visits.filter((v) => v.contact_type === "presencial").length,
    whatsapp: visits.filter((v) => v.contact_type === "whatsapp").length,
  };

  const byDate = new Map<string, VisitListItem[]>();

  for (const visit of visits) {
    const date = visit.visited_at.slice(0, 10);
    const list = byDate.get(date) ?? [];
    list.push(visit);
    byDate.set(date, list);
  }

  const groups = Array.from(byDate.entries())
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, dayVisits]) => ({
      date,
      visits: dayVisits.sort(
        (a, b) =>
          new Date(b.visited_at).getTime() - new Date(a.visited_at).getTime()
      ),
    }));

  return { summary, groups };
}

export async function getVisitReport(period: VisitReportPeriod) {
  const visits = await getVisitsForPeriod(period);
  return buildVisitReport(visits);
}
