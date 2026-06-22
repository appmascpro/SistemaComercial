import "server-only";

import { estimateMarginPercent } from "@/lib/commissions/calculate";
import {
  buildServiceCityRegionMap,
  resolveCustomerRegion,
} from "@/lib/intelligence/regions";
import {
  calculateCustomerScore,
  scoreGrade,
} from "@/lib/intelligence/score";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { LeadStatus } from "@/types/customer";
import type {
  CustomerScoreItem,
  IntelligencePageData,
  IntelligencePanorama,
  IntelligencePeriod,
  IntelligenceTab,
  MarginReportRow,
  MarginReportSummary,
  ProductRankingItem,
  RegionHistoryItem,
  RepurchaseSuggestion,
  RouteConversionItem,
  StalledAlert,
} from "@/types/intelligence";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function daysBetween(from: string, to = new Date()): number {
  const start = new Date(from).getTime();
  const end = to.getTime();
  return Math.floor((end - start) / (1000 * 60 * 60 * 24));
}

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

export function periodStartIso(period: IntelligencePeriod): string {
  const date = new Date();
  const days =
    period === "30d"
      ? 30
      : period === "90d"
        ? 90
        : period === "180d"
          ? 180
          : 365;
  date.setDate(date.getDate() - days);
  date.setHours(0, 0, 0, 0);
  return date.toISOString();
}

async function getServiceCityMap() {
  const { supabase } = await createTenantClient();
  const { data } = await supabase
    .from("service_cities")
    .select("city, region")
    .eq("status", "ativo");
  return buildServiceCityRegionMap(data ?? []);
}

export async function getCustomerScores(): Promise<CustomerScoreItem[]> {
  const { supabase } = await createTenantClient();
  const today = todayDateOnly();
  const thirtyDaysAgo = periodStartIso("30d");

  const [customersRes, ordersRes, quotesRes, visitsRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, company_name, city, state, lead_status, last_visit_at, next_visit_at")
      .eq("status", "ativo")
      .order("company_name")
      .limit(500),
    supabase
      .from("orders")
      .select("customer_id, status, invoiced_at, ordered_at, created_at")
      .in("status", ["faturado", "confirmado", "parcial"]),
    supabase
      .from("quotes")
      .select("customer_id, status")
      .in("status", ["aberta", "enviada"]),
    supabase
      .from("visits")
      .select("customer_id, visited_at")
      .gte("visited_at", thirtyDaysAgo),
  ]);

  if (customersRes.error) throw new Error(customersRes.error.message);

  const ordersByCustomer = new Map<
    string,
    { faturado: number; lastAt: string | null }
  >();
  for (const row of ordersRes.data ?? []) {
    const current = ordersByCustomer.get(row.customer_id) ?? {
      faturado: 0,
      lastAt: null,
    };
    if (row.status === "faturado") current.faturado += 1;
    const orderDate =
      row.invoiced_at ?? row.ordered_at ?? row.created_at ?? null;
    if (
      orderDate &&
      (!current.lastAt || new Date(orderDate) > new Date(current.lastAt))
    ) {
      current.lastAt = orderDate;
    }
    ordersByCustomer.set(row.customer_id, current);
  }

  const openQuotesByCustomer = new Map<string, number>();
  for (const row of quotesRes.data ?? []) {
    openQuotesByCustomer.set(
      row.customer_id,
      (openQuotesByCustomer.get(row.customer_id) ?? 0) + 1
    );
  }

  const visits30dByCustomer = new Map<string, number>();
  for (const row of visitsRes.data ?? []) {
    visits30dByCustomer.set(
      row.customer_id,
      (visits30dByCustomer.get(row.customer_id) ?? 0) + 1
    );
  }

  const scores: CustomerScoreItem[] = (customersRes.data ?? []).map(
    (customer) => {
      const orders = ordersByCustomer.get(customer.id);
      const daysSinceLastOrder = orders?.lastAt
        ? daysBetween(orders.lastAt)
        : null;
      const daysSinceLastVisit = customer.last_visit_at
        ? daysBetween(customer.last_visit_at)
        : null;
      const nextVisitOverdue = Boolean(
        customer.next_visit_at && customer.next_visit_at < today
      );

      const score = calculateCustomerScore({
        lead_status: customer.lead_status as LeadStatus | null,
        orders_faturado_count: orders?.faturado ?? 0,
        days_since_last_order: daysSinceLastOrder,
        open_quotes_count: openQuotesByCustomer.get(customer.id) ?? 0,
        visits_last_30d: visits30dByCustomer.get(customer.id) ?? 0,
        days_since_last_visit: daysSinceLastVisit,
        next_visit_overdue: nextVisitOverdue,
      });

      return {
        customer_id: customer.id,
        company_name: customer.company_name,
        city: customer.city,
        state: customer.state,
        lead_status: customer.lead_status as LeadStatus | null,
        score,
        grade: scoreGrade(score),
        orders_count: orders?.faturado ?? 0,
        last_order_at: orders?.lastAt ?? null,
        last_visit_at: customer.last_visit_at,
        open_quotes: openQuotesByCustomer.get(customer.id) ?? 0,
      };
    }
  );

  return scores.sort((a, b) => b.score - a.score);
}

export async function getRepurchaseSuggestions(): Promise<
  RepurchaseSuggestion[]
> {
  const { supabase } = await createTenantClient();

  const [ordersRes, itemsRes, customersRes] = await Promise.all([
    supabase
      .from("orders")
      .select("id, customer_id, invoiced_at, ordered_at, created_at")
      .eq("status", "faturado")
      .order("invoiced_at", { ascending: false }),
    supabase
      .from("order_items")
      .select(
        `
        order_id,
        quantity,
        products ( commercial_name )
      `
      ),
    supabase
      .from("customers")
      .select("id, company_name, city")
      .eq("status", "ativo"),
  ]);

  if (ordersRes.error) throw new Error(ordersRes.error.message);

  const customerMap = new Map(
    (customersRes.data ?? []).map((c) => [c.id, c])
  );

  const orderDatesByCustomer = new Map<string, string[]>();
  const orderIdToCustomer = new Map<string, string>();

  for (const order of ordersRes.data ?? []) {
    orderIdToCustomer.set(order.id, order.customer_id);
    const date =
      order.invoiced_at ?? order.ordered_at ?? order.created_at ?? null;
    if (!date) continue;
    const list = orderDatesByCustomer.get(order.customer_id) ?? [];
    list.push(date);
    orderDatesByCustomer.set(order.customer_id, list);
  }

  const productsByCustomer = new Map<string, Map<string, number>>();
  for (const row of itemsRes.data ?? []) {
    const customerId = orderIdToCustomer.get(row.order_id);
    if (!customerId) continue;
    const product = unwrapRelation(
      row.products as
        | { commercial_name: string }
        | { commercial_name: string }[]
        | null
    );
    if (!product) continue;
    const bucket =
      productsByCustomer.get(customerId) ?? new Map<string, number>();
    bucket.set(
      product.commercial_name,
      (bucket.get(product.commercial_name) ?? 0) + Number(row.quantity)
    );
    productsByCustomer.set(customerId, bucket);
  }

  const suggestions: RepurchaseSuggestion[] = [];

  for (const [customerId, dates] of orderDatesByCustomer) {
    const sorted = [...dates].sort(
      (a, b) => new Date(b).getTime() - new Date(a).getTime()
    );
    const lastOrderAt = sorted[0];
    const daysSince = daysBetween(lastOrderAt);

    let avgReorderDays: number | null = null;
    if (sorted.length >= 2) {
      const intervals: number[] = [];
      for (let i = 0; i < sorted.length - 1; i += 1) {
        intervals.push(
          daysBetween(sorted[i + 1], new Date(sorted[i]))
        );
      }
      avgReorderDays = Math.round(
        intervals.reduce((sum, value) => sum + value, 0) / intervals.length
      );
    }

    const threshold = avgReorderDays
      ? Math.max(60, Math.round(avgReorderDays * 1.2))
      : 90;

    if (daysSince < threshold) continue;

    const customer = customerMap.get(customerId);
    if (!customer) continue;

    const productRank = [...(productsByCustomer.get(customerId)?.entries() ?? [])]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([name]) => name);

    suggestions.push({
      customer_id: customerId,
      company_name: customer.company_name,
      city: customer.city,
      last_order_at: lastOrderAt,
      days_since_last_order: daysSince,
      avg_reorder_days: avgReorderDays,
      suggested_products: productRank,
      urgency: daysSince >= threshold * 1.5 ? "alta" : "media",
    });
  }

  return suggestions.sort(
    (a, b) => b.days_since_last_order - a.days_since_last_order
  );
}

export async function getStalledAlerts(): Promise<StalledAlert[]> {
  const { supabase } = await createTenantClient();
  const today = todayDateOnly();
  const fortyFiveDaysAgo = new Date();
  fortyFiveDaysAgo.setDate(fortyFiveDaysAgo.getDate() - 45);

  const [customersRes, ordersRes, quotesRes, followupsRes] = await Promise.all([
    supabase
      .from("customers")
      .select(
        "id, company_name, city, lead_status, last_visit_at, next_visit_at"
      )
      .eq("status", "ativo"),
    supabase
      .from("orders")
      .select("customer_id")
      .in("status", ["faturado", "confirmado", "parcial", "criado"]),
    supabase
      .from("quotes")
      .select("id, customer_id, quote_number, status, valid_until, created_at")
      .in("status", ["aberta", "enviada"]),
    supabase
      .from("followups")
      .select(
        "id, customer_id, title, due_at, status, customers ( company_name, city )"
      )
      .eq("status", "pendente")
      .lt("due_at", `${today}T23:59:59`),
  ]);

  const customersWithOrders = new Set(
    (ordersRes.data ?? []).map((row) => row.customer_id)
  );

  const customerMap = new Map(
    (customersRes.data ?? []).map((c) => [c.id, c])
  );

  const alerts: StalledAlert[] = [];

  for (const customer of customersRes.data ?? []) {
    const lastVisit = customer.last_visit_at
      ? new Date(customer.last_visit_at)
      : null;
    const isStaleVisit =
      !lastVisit || lastVisit < fortyFiveDaysAgo;

    if (
      (customer.lead_status === "quente" || customer.lead_status === "morno") &&
      !customersWithOrders.has(customer.id) &&
      isStaleVisit
    ) {
      alerts.push({
        id: `lead-${customer.id}`,
        kind: "lead_esfriando",
        customer_id: customer.id,
        company_name: customer.company_name,
        city: customer.city,
        message: `Lead ${customer.lead_status} sem pedido e sem contato há ${lastVisit ? daysBetween(customer.last_visit_at!) : "muito"} dias`,
        severity: customer.lead_status === "quente" ? "alta" : "media",
        reference_date: customer.last_visit_at,
      });
    }

    if (
      customer.next_visit_at &&
      customer.next_visit_at < today &&
      isStaleVisit
    ) {
      alerts.push({
        id: `visit-${customer.id}`,
        kind: "visita_atrasada",
        customer_id: customer.id,
        company_name: customer.company_name,
        city: customer.city,
        message: `Retorno agendado para ${customer.next_visit_at} não realizado`,
        severity: "alta",
        reference_date: customer.next_visit_at,
      });
    }

    if (
      customer.lead_status === "cliente" &&
      isStaleVisit &&
      customersWithOrders.has(customer.id)
    ) {
      alerts.push({
        id: `contact-${customer.id}`,
        kind: "sem_contato",
        customer_id: customer.id,
        company_name: customer.company_name,
        city: customer.city,
        message: `Cliente ativo sem visita há ${lastVisit ? daysBetween(customer.last_visit_at!) : "muito"} dias`,
        severity: "media",
        reference_date: customer.last_visit_at,
      });
    }
  }

  for (const quote of quotesRes.data ?? []) {
    const customer = customerMap.get(quote.customer_id);
    if (!customer) continue;

    const expired =
      quote.valid_until && quote.valid_until < today;
    const oldQuote =
      daysBetween(quote.created_at) > 30;

    if (expired || oldQuote) {
      alerts.push({
        id: `quote-${quote.id}`,
        kind: "cotacao_parada",
        customer_id: quote.customer_id,
        company_name: customer.company_name,
        city: customer.city,
        message: expired
          ? `Cotação ${quote.quote_number} expirada (${quote.valid_until})`
          : `Cotação ${quote.quote_number} aberta há ${daysBetween(quote.created_at)} dias`,
        severity: expired ? "alta" : "media",
        reference_date: quote.valid_until ?? quote.created_at,
      });
    }
  }

  for (const followup of followupsRes.data ?? []) {
    const embedded = unwrapRelation(
      followup.customers as
        | { company_name: string; city: string | null }
        | { company_name: string; city: string | null }[]
        | null
    );
    const customer = embedded ?? customerMap.get(followup.customer_id ?? "");
    if (!customer || !followup.customer_id) continue;

    alerts.push({
      id: `followup-${followup.id}`,
      kind: "followup_atrasado",
      customer_id: followup.customer_id,
      company_name: embedded?.company_name ?? customer.company_name,
      city: embedded?.city ?? customer.city,
      message: followup.title ?? "Follow-up de pedido atrasado",
      severity: "alta",
      reference_date: followup.due_at,
    });
  }

  const severityOrder = { alta: 0, media: 1 };
  return alerts.sort(
    (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
  );
}

export async function getMarginReport(period: IntelligencePeriod): Promise<{
  summary: MarginReportSummary;
  rows: MarginReportRow[];
}> {
  const { supabase } = await createTenantClient();
  const start = periodStartIso(period);

  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      order_number,
      subtotal,
      discount_total,
      total,
      invoiced_at,
      customers ( company_name ),
      profiles ( full_name ),
      commissions ( margin_percent, commission_rate )
    `
    )
    .in("status", ["faturado", "parcial"])
    .gte("invoiced_at", start)
    .order("invoiced_at", { ascending: false })
    .limit(200);

  if (error) throw new Error(error.message);

  const rows: MarginReportRow[] = (data ?? []).map((row) => {
    const customer = unwrapRelation(
      row.customers as
        | { company_name: string }
        | { company_name: string }[]
        | null
    );
    const seller = unwrapRelation(
      row.profiles as
        | { full_name: string }
        | { full_name: string }[]
        | null
    );
    const commission = unwrapRelation(
      row.commissions as
        | { margin_percent: number; commission_rate: number }
        | { margin_percent: number; commission_rate: number }[]
        | null
    );

    const marginPercent =
      commission?.margin_percent != null
        ? Number(commission.margin_percent)
        : estimateMarginPercent({
            subtotal: Number(row.subtotal),
            discountTotal: Number(row.discount_total),
          });

    return {
      order_id: row.id,
      order_number: row.order_number,
      customer_name: customer?.company_name ?? "—",
      seller_name: seller?.full_name ?? "—",
      order_total: Number(row.total),
      margin_percent: marginPercent,
      commission_rate: Number(commission?.commission_rate ?? 0),
      invoiced_at: row.invoiced_at,
    };
  });

  const totalRevenue = rows.reduce((sum, row) => sum + row.order_total, 0);
  const avgMargin =
    rows.length > 0
      ? rows.reduce((sum, row) => sum + row.margin_percent, 0) / rows.length
      : 0;
  const lowMarginCount = rows.filter((row) => row.margin_percent < 15).length;

  return {
    summary: {
      order_count: rows.length,
      total_revenue: Math.round(totalRevenue * 100) / 100,
      avg_margin_percent: Math.round(avgMargin * 10) / 10,
      low_margin_count: lowMarginCount,
    },
    rows,
  };
}

async function aggregateProductRanking(
  items: {
    product_id: string;
    quantity: number;
    line_total: number;
    products:
      | { commercial_name: string; internal_code: string }
      | { commercial_name: string; internal_code: string }[]
      | null;
  }[]
): Promise<ProductRankingItem[]> {
  const map = new Map<
    string,
    ProductRankingItem & { occurrences: number }
  >();

  for (const row of items) {
    const product = unwrapRelation(row.products);
    if (!product) continue;

    const current = map.get(row.product_id) ?? {
      product_id: row.product_id,
      product_name: product.commercial_name,
      product_code: product.internal_code,
      quote_count: 0,
      quantity: 0,
      total_value: 0,
      occurrences: 0,
    };

    current.quantity += Number(row.quantity);
    current.total_value += Number(row.line_total);
    current.occurrences += 1;
    map.set(row.product_id, current);
  }

  return [...map.values()]
    .map((row) => ({
      product_id: row.product_id,
      product_name: row.product_name,
      product_code: row.product_code,
      quote_count: row.occurrences,
      quantity: row.quantity,
      total_value: Math.round(row.total_value * 100) / 100,
    }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 25);
}

export async function getTopQuotedProducts(
  period: IntelligencePeriod
): Promise<ProductRankingItem[]> {
  const { supabase } = await createTenantClient();
  const start = periodStartIso(period);

  const { data: quotes, error: quotesError } = await supabase
    .from("quotes")
    .select("id")
    .gte("created_at", start);

  if (quotesError) throw new Error(quotesError.message);

  const quoteIds = (quotes ?? []).map((q) => q.id);
  if (quoteIds.length === 0) return [];

  const { data, error } = await supabase
    .from("quote_items")
    .select(
      `
      product_id,
      quantity,
      line_total,
      products ( commercial_name, internal_code )
    `
    )
    .in("quote_id", quoteIds.slice(0, 500));

  if (error) throw new Error(error.message);

  return aggregateProductRanking(data ?? []);
}

export async function getTopSoldProducts(
  period: IntelligencePeriod
): Promise<ProductRankingItem[]> {
  const { supabase } = await createTenantClient();
  const start = periodStartIso(period);

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select("id")
    .eq("status", "faturado")
    .gte("invoiced_at", start);

  if (ordersError) throw new Error(ordersError.message);

  const orderIds = (orders ?? []).map((o) => o.id);
  if (orderIds.length === 0) return [];

  const { data, error } = await supabase
    .from("order_items")
    .select(
      `
      product_id,
      quantity,
      line_total,
      products ( commercial_name, internal_code )
    `
    )
    .in("order_id", orderIds.slice(0, 500));

  if (error) throw new Error(error.message);

  return aggregateProductRanking(data ?? []);
}

export async function getRouteConversion(
  period: IntelligencePeriod
): Promise<RouteConversionItem[]> {
  const { supabase } = await createTenantClient();
  const start = periodStartIso(period);
  const startDate = start.slice(0, 10);

  const { data: routes, error } = await supabase
    .from("routes")
    .select(
      `
      id,
      name,
      polo,
      planned_date,
      route_stops (
        id,
        status,
        customer_id,
        visit_id,
        visits ( visit_result, visited_at )
      )
    `
    )
    .gte("planned_date", startDate)
    .neq("status", "cancelada")
    .order("planned_date", { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);

  const { data: orders } = await supabase
    .from("orders")
    .select("customer_id, created_at, ordered_at")
    .in("status", ["faturado", "confirmado", "criado"])
    .gte("created_at", start);

  const ordersByCustomer = new Map<string, string[]>();
  for (const order of orders ?? []) {
    const date = order.ordered_at ?? order.created_at;
    const list = ordersByCustomer.get(order.customer_id) ?? [];
    list.push(date);
    ordersByCustomer.set(order.customer_id, list);
  }

  const items: RouteConversionItem[] = [];

  for (const route of routes ?? []) {
    const stops = (route.route_stops ?? []) as Array<{
      id: string;
      status: string;
      customer_id: string;
      visit_id: string | null;
      visits:
        | { visit_result: string; visited_at: string }
        | { visit_result: string; visited_at: string }[]
        | null;
    }>;

    let stopsVisited = 0;
    let positiveVisits = 0;
    let ordersGenerated = 0;

    for (const stop of stops) {
      if (stop.status === "visitado") stopsVisited += 1;

      const visit = unwrapRelation(stop.visits);
      if (
        visit &&
        ["cotou", "pediu", "pediu_amostra"].includes(visit.visit_result)
      ) {
        positiveVisits += 1;
      }

      if (visit?.visited_at) {
        const customerOrders = ordersByCustomer.get(stop.customer_id) ?? [];
        const visitTime = new Date(visit.visited_at).getTime();
        const hasOrder = customerOrders.some((orderDate) => {
          const diff = Math.abs(
            new Date(orderDate).getTime() - visitTime
          );
          return diff <= 30 * 24 * 60 * 60 * 1000;
        });
        if (hasOrder) ordersGenerated += 1;
      }
    }

    const total = stops.length;
    items.push({
      route_id: route.id,
      route_name: route.name,
      polo: route.polo,
      planned_date: route.planned_date,
      stops_total: total,
      stops_visited: stopsVisited,
      positive_visits: positiveVisits,
      orders_generated: ordersGenerated,
      visit_rate_percent:
        total > 0 ? Math.round((stopsVisited / total) * 100) : 0,
      conversion_rate_percent:
        stopsVisited > 0
          ? Math.round((ordersGenerated / stopsVisited) * 100)
          : 0,
    });
  }

  return items.sort(
    (a, b) => b.conversion_rate_percent - a.conversion_rate_percent
  );
}

export async function getRegionHistory(
  period: IntelligencePeriod
): Promise<RegionHistoryItem[]> {
  const { supabase } = await createTenantClient();
  const start = periodStartIso(period);
  const serviceCityMap = await getServiceCityMap();

  const [customersRes, visitsRes, quotesRes, ordersRes] = await Promise.all([
    supabase
      .from("customers")
      .select("id, city")
      .eq("status", "ativo"),
    supabase.from("visits").select("id, city").gte("visited_at", start),
    supabase
      .from("quotes")
      .select("id, total, customer_id, customers ( city )")
      .gte("created_at", start),
    supabase
      .from("orders")
      .select("id, total, customer_id, customers ( city )")
      .in("status", ["faturado", "confirmado", "parcial"])
      .gte("created_at", start),
  ]);

  const customerCityMap = new Map(
    (customersRes.data ?? []).map((c) => [c.id, c.city])
  );

  type RegionBucket = RegionHistoryItem & {
    quoteIds: Set<string>;
    orderIds: Set<string>;
  };

  const buckets = new Map<string, RegionBucket>();

  function getBucket(city: string | null): RegionBucket {
    const region = resolveCustomerRegion(city, serviceCityMap);
    const existing = buckets.get(region.slug);
    if (existing) return existing;

    const bucket: RegionBucket = {
      region_slug: region.slug,
      region_name: region.name,
      expansion_priority: region.expansionPriority,
      customers_count: 0,
      visits_count: 0,
      quotes_count: 0,
      quotes_value: 0,
      orders_count: 0,
      orders_value: 0,
      conversion_rate_percent: 0,
      quoteIds: new Set(),
      orderIds: new Set(),
    };
    buckets.set(region.slug, bucket);
    return bucket;
  }

  for (const customer of customersRes.data ?? []) {
    const bucket = getBucket(customer.city);
    bucket.customers_count += 1;
  }

  for (const visit of visitsRes.data ?? []) {
    const bucket = getBucket(visit.city);
    bucket.visits_count += 1;
  }

  for (const quote of quotesRes.data ?? []) {
    const customer = unwrapRelation(
      quote.customers as
        | { city: string | null }
        | { city: string | null }[]
        | null
    );
    const city = customer?.city ?? customerCityMap.get(quote.customer_id) ?? null;
    const bucket = getBucket(city);
    if (!bucket.quoteIds.has(quote.id)) {
      bucket.quoteIds.add(quote.id);
      bucket.quotes_count += 1;
      bucket.quotes_value += Number(quote.total);
    }
  }

  for (const order of ordersRes.data ?? []) {
    const customer = unwrapRelation(
      order.customers as
        | { city: string | null }
        | { city: string | null }[]
        | null
    );
    const city = customer?.city ?? customerCityMap.get(order.customer_id) ?? null;
    const bucket = getBucket(city);
    if (!bucket.orderIds.has(order.id)) {
      bucket.orderIds.add(order.id);
      bucket.orders_count += 1;
      bucket.orders_value += Number(order.total);
    }
  }

  return [...buckets.values()]
    .map(({ quoteIds, orderIds, ...item }) => ({
      ...item,
      quotes_value: Math.round(item.quotes_value * 100) / 100,
      orders_value: Math.round(item.orders_value * 100) / 100,
      conversion_rate_percent:
        item.quotes_count > 0
          ? Math.round((item.orders_count / item.quotes_count) * 100)
          : 0,
    }))
    .sort((a, b) => {
      const priorityA = a.expansion_priority ?? 99;
      const priorityB = b.expansion_priority ?? 99;
      if (priorityA !== priorityB) return priorityA - priorityB;
      return b.orders_value - a.orders_value;
    });
}

export async function getIntelligencePanorama(
  period: IntelligencePeriod
): Promise<IntelligencePanorama> {
  const [
    scores,
    repurchase,
    alerts,
    margin,
    quoted,
    sold,
    routes,
    regions,
  ] = await Promise.all([
    getCustomerScores(),
    getRepurchaseSuggestions(),
    getStalledAlerts(),
    getMarginReport(period),
    getTopQuotedProducts(period),
    getTopSoldProducts(period),
    getRouteConversion(period),
    getRegionHistory(period),
  ]);

  const avgScore =
    scores.length > 0
      ? Math.round(
          scores.reduce((sum, row) => sum + row.score, 0) / scores.length
        )
      : 0;

  const bestRoute = routes[0] ?? null;
  const topRegion = regions.find((r) => r.orders_value > 0) ?? regions[0] ?? null;

  return {
    avg_customer_score: avgScore,
    customers_grade_a: scores.filter((row) => row.grade === "A").length,
    repurchase_pending: repurchase.length,
    stalled_alerts_count: alerts.length,
    avg_margin_percent: margin.summary.avg_margin_percent,
    top_quoted_product: quoted[0]?.product_name ?? null,
    top_sold_product: sold[0]?.product_name ?? null,
    best_route_name: bestRoute?.route_name ?? null,
    top_region_name: topRegion?.region_name ?? null,
  };
}

export async function getIntelligencePageData(
  tab: IntelligenceTab,
  period: IntelligencePeriod
): Promise<IntelligencePageData> {
  const base: IntelligencePageData = { tab, period };

  switch (tab) {
    case "panorama":
      return { ...base, panorama: await getIntelligencePanorama(period) };
    case "score":
      return { ...base, customerScores: await getCustomerScores() };
    case "recompra":
      return { ...base, repurchase: await getRepurchaseSuggestions() };
    case "alertas":
      return { ...base, alerts: await getStalledAlerts() };
    case "margem":
      return { ...base, margin: await getMarginReport(period) };
    case "produtos": {
      const [quotedProducts, soldProducts] = await Promise.all([
        getTopQuotedProducts(period),
        getTopSoldProducts(period),
      ]);
      return { ...base, quotedProducts, soldProducts };
    }
    case "rotas":
      return { ...base, routeConversion: await getRouteConversion(period) };
    case "regiao":
      return { ...base, regionHistory: await getRegionHistory(period) };
    default:
      return { ...base, panorama: await getIntelligencePanorama(period) };
  }
}
