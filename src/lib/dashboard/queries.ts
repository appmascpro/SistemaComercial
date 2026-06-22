import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";

export interface DashboardStats {
  activeCustomers: number;
  openQuotes: number;
  finalizedOrdersMonth: number;
  pendingSamples: number;
  expectedCommissions: number;
  upcomingVisits: number;
  invoicedAmountMonth: number;
  openQuotesAmount: number;
}

export interface DashboardActivityItem {
  id: string;
  type: "quote" | "order" | "sample" | "customer";
  title: string;
  subtitle: string;
  href: string;
  created_at: string;
}

export interface DashboardAgendaItem {
  id: string;
  kind: "route" | "sample" | "visit" | "order_followup";
  title: string;
  subtitle: string;
  date: string;
  href: string;
}

function startOfCurrentMonthIso(): string {
  const date = new Date();
  date.setDate(1);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateInDays(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

function unwrapCustomerName(
  value: { company_name: string } | { company_name: string }[] | null | undefined
): string {
  if (!value) return "—";
  const row = Array.isArray(value) ? value[0] : value;
  return row?.company_name ?? "—";
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const { supabase } = await createTenantClient();
  const monthStart = startOfCurrentMonthIso();
  const today = todayDateOnly();
  const weekEnd = dateInDays(7);

  const [
    customersRes,
    quotesCountRes,
    quotesAmountRes,
    ordersCountRes,
    ordersAmountRes,
    samplesRes,
    commissionsRes,
    routesRes,
    visitFollowUpsRes,
  ] = await Promise.all([
    supabase
      .from("customers")
      .select("*", { count: "exact", head: true })
      .eq("status", "ativo"),
    supabase
      .from("quotes")
      .select("*", { count: "exact", head: true })
      .in("status", ["aberta", "enviada"]),
    supabase
      .from("quotes")
      .select("total")
      .in("status", ["aberta", "enviada"]),
    supabase
      .from("orders")
      .select("*", { count: "exact", head: true })
      .eq("status", "faturado")
      .gte("invoiced_at", monthStart),
    supabase
      .from("orders")
      .select("total")
      .eq("status", "faturado")
      .gte("invoiced_at", monthStart),
    supabase
      .from("samples")
      .select("*", { count: "exact", head: true })
      .eq("status", "pendente"),
    supabase
      .from("commissions")
      .select("commission_amount")
      .in("status", ["prevista", "pendente", "proporcional"]),
    supabase
      .from("routes")
      .select("*", { count: "exact", head: true })
      .in("status", ["planejada", "em_andamento"])
      .gte("planned_date", today)
      .lte("planned_date", weekEnd),
    supabase
      .from("visits")
      .select("*", { count: "exact", head: true })
      .gte("next_action_date", today)
      .lte("next_action_date", weekEnd),
  ]);

  if (customersRes.error) throw new Error(customersRes.error.message);
  if (quotesCountRes.error) throw new Error(quotesCountRes.error.message);
  if (quotesAmountRes.error) throw new Error(quotesAmountRes.error.message);
  if (ordersCountRes.error) throw new Error(ordersCountRes.error.message);
  if (ordersAmountRes.error) throw new Error(ordersAmountRes.error.message);
  if (samplesRes.error) throw new Error(samplesRes.error.message);
  if (routesRes.error) throw new Error(routesRes.error.message);

  let expectedCommissions = 0;
  if (!commissionsRes.error && commissionsRes.data) {
    expectedCommissions = commissionsRes.data.reduce(
      (sum, row) => sum + Number(row.commission_amount),
      0
    );
  }

  const invoicedAmountMonth = (ordersAmountRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.total),
    0
  );

  const openQuotesAmount = (quotesAmountRes.data ?? []).reduce(
    (sum, row) => sum + Number(row.total),
    0
  );

  return {
    activeCustomers: customersRes.count ?? 0,
    openQuotes: quotesCountRes.count ?? 0,
    finalizedOrdersMonth: ordersCountRes.count ?? 0,
    pendingSamples: samplesRes.count ?? 0,
    expectedCommissions: Math.round(expectedCommissions * 100) / 100,
    upcomingVisits:
      (routesRes.count ?? 0) + (visitFollowUpsRes.error ? 0 : visitFollowUpsRes.count ?? 0),
    invoicedAmountMonth: Math.round(invoicedAmountMonth * 100) / 100,
    openQuotesAmount: Math.round(openQuotesAmount * 100) / 100,
  };
}

export async function getDashboardRecentActivity(
  limit = 8
): Promise<DashboardActivityItem[]> {
  const { supabase } = await createTenantClient();

  const [quotes, orders, samples, customers] = await Promise.all([
    supabase
      .from("quotes")
      .select(
        `
        id,
        quote_number,
        status,
        created_at,
        customers ( company_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("orders")
      .select(
        `
        id,
        order_number,
        status,
        created_at,
        customers ( company_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("samples")
      .select(
        `
        id,
        sample_number,
        status,
        created_at,
        customers ( company_name )
      `
      )
      .order("created_at", { ascending: false })
      .limit(5),
    supabase
      .from("customers")
      .select("id, company_name, created_at")
      .order("created_at", { ascending: false })
      .limit(3),
  ]);

  const items: DashboardActivityItem[] = [];

  for (const row of quotes.data ?? []) {
    items.push({
      id: row.id,
      type: "quote",
      title: `Cotação ${row.quote_number}`,
      subtitle: `${unwrapCustomerName(row.customers)} · ${row.status}`,
      href: `/cotacoes/${row.id}`,
      created_at: row.created_at,
    });
  }

  for (const row of orders.data ?? []) {
    items.push({
      id: row.id,
      type: "order",
      title: `Pedido ${row.order_number}`,
      subtitle: `${unwrapCustomerName(row.customers)} · ${row.status}`,
      href: `/pedidos/${row.id}`,
      created_at: row.created_at,
    });
  }

  for (const row of samples.data ?? []) {
    items.push({
      id: row.id,
      type: "sample",
      title: row.sample_number
        ? `Amostra ${row.sample_number}`
        : "Amostra",
      subtitle: `${unwrapCustomerName(row.customers)} · ${row.status}`,
      href: `/amostras/${row.id}`,
      created_at: row.created_at,
    });
  }

  for (const row of customers.data ?? []) {
    items.push({
      id: row.id,
      type: "customer",
      title: row.company_name,
      subtitle: "Cliente cadastrado",
      href: `/clientes/${row.id}`,
      created_at: row.created_at,
    });
  }

  return items
    .sort(
      (a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    .slice(0, limit);
}

export async function getDashboardAgenda(
  limit = 6
): Promise<DashboardAgendaItem[]> {
  const { supabase } = await createTenantClient();
  const today = todayDateOnly();
  const weekEnd = dateInDays(7);

  const [routes, samples, visits, orderFollowups] = await Promise.all([
    supabase
      .from("routes")
      .select("id, name, city, state, planned_date, status")
      .in("status", ["planejada", "em_andamento"])
      .gte("planned_date", today)
      .lte("planned_date", weekEnd)
      .order("planned_date", { ascending: true })
      .limit(limit),
    supabase
      .from("samples")
      .select(
        `
        id,
        sample_number,
        follow_up_date,
        status,
        customers ( company_name )
      `
      )
      .in("status", ["enviado", "recebido", "testando"])
      .gte("follow_up_date", today)
      .lte("follow_up_date", weekEnd)
      .order("follow_up_date", { ascending: true })
      .limit(limit),
    supabase
      .from("visits")
      .select(
        `
        id,
        next_action_date,
        contact_type,
        contact_person_name,
        customers ( company_name )
      `
      )
      .gte("next_action_date", today)
      .lte("next_action_date", weekEnd)
      .order("next_action_date", { ascending: true })
      .limit(limit),
    supabase
      .from("followups")
      .select("id, title, due_at, status, related_id, related_type")
      .in("related_type", ["order", "sample"])
      .eq("status", "pendente")
      .gte("due_at", `${today}T00:00:00`)
      .lte("due_at", `${weekEnd}T23:59:59`)
      .order("due_at", { ascending: true })
      .limit(limit),
  ]);

  const items: DashboardAgendaItem[] = [];

  for (const row of routes.data ?? []) {
    if (!row.planned_date) continue;
    items.push({
      id: row.id,
      kind: "route",
      title: row.name,
      subtitle: [row.city, row.state].filter(Boolean).join(" / ") || row.status,
      date: row.planned_date,
      href: `/rotas/${row.id}`,
    });
  }

  for (const row of samples.data ?? []) {
    if (!row.follow_up_date) continue;
    items.push({
      id: row.id,
      kind: "sample",
      title: row.sample_number
        ? `Follow-up ${row.sample_number}`
        : "Follow-up amostra",
      subtitle: unwrapCustomerName(row.customers),
      date: row.follow_up_date,
      href: `/amostras/${row.id}`,
    });
  }

  for (const row of visits.data ?? []) {
    if (!row.next_action_date) continue;
    const contactLabel =
      row.contact_type === "whatsapp" ? "WhatsApp" : "Presencial";
    items.push({
      id: row.id,
      kind: "visit",
      title: `Retorno · ${unwrapCustomerName(row.customers)}`,
      subtitle: [
        contactLabel,
        row.contact_person_name ? `com ${row.contact_person_name}` : null,
      ]
        .filter(Boolean)
        .join(" · "),
      date: row.next_action_date,
      href: "/visitas?aba=relatorio&periodo=7d",
    });
  }

  for (const row of orderFollowups.data ?? []) {
    if (!row.due_at) continue;
    const isSample = row.related_type === "sample";
    items.push({
      id: row.id,
      kind: isSample ? "sample" : "order_followup",
      title: row.title ?? (isSample ? "Follow-up amostra" : "Follow-up pedido"),
      subtitle: isSample ? "Acompanhamento de amostra" : "Acompanhamento de pedido",
      date: String(row.due_at).slice(0, 10),
      href: isSample
        ? `/amostras/${row.related_id}`
        : "/visitas?aba=followups&periodo=15d",
    });
  }

  return items
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, limit);
}

export async function getDashboardData() {
  const [stats, activity, agenda] = await Promise.all([
    getDashboardStats(),
    getDashboardRecentActivity(),
    getDashboardAgenda(),
  ]);

  return { stats, activity, agenda };
}
