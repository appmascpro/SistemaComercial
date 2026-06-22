import "server-only";

import { createTenantClient } from "@/lib/supabase/tenant-db";
import type {
  CommissionListItem,
  CommissionStatus,
  CommissionSummary,
} from "@/types/commission";

function unwrapRelation<T>(value: T | T[] | null | undefined): T | null {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

export async function getCommissionsForTenant(
  statusFilter?: CommissionStatus | "all"
): Promise<{ commissions: CommissionListItem[]; summary: CommissionSummary }> {
  const { supabase } = await createTenantClient();

  let query = supabase
    .from("commissions")
    .select(
      `
      id,
      status,
      order_id,
      seller_id,
      order_total,
      margin_percent,
      commission_rate,
      commission_amount,
      released_at,
      paid_at,
      cancelled_at,
      created_at,
      profiles ( full_name ),
      orders (
        order_number,
        status,
        customers ( company_name )
      )
    `
    )
    .order("created_at", { ascending: false })
    .limit(200);

  if (statusFilter && statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const [{ data, error }, { data: allRows, error: summaryError }] =
    await Promise.all([
      query,
      supabase.from("commissions").select("status, commission_amount"),
    ]);

  if (error) throw new Error(error.message);
  if (summaryError) throw new Error(summaryError.message);

  const commissions: CommissionListItem[] = (data ?? []).map((row) => {
    const seller = unwrapRelation(
      row.profiles as { full_name: string } | { full_name: string }[] | null
    );
    const order = unwrapRelation(
      row.orders as
        | {
            order_number: string;
            status: string;
            customers: { company_name: string } | { company_name: string }[];
          }
        | Array<{
            order_number: string;
            status: string;
            customers: { company_name: string } | { company_name: string }[];
          }>
        | null
    );
    const customer = order
      ? unwrapRelation(order.customers)
      : null;

    return {
      id: row.id,
      status: row.status as CommissionStatus,
      order_id: row.order_id,
      order_number: order?.order_number ?? "—",
      order_status: order?.status ?? "—",
      seller_id: row.seller_id,
      seller_name: seller?.full_name ?? "—",
      order_total: Number(row.order_total ?? 0),
      margin_percent: Number(row.margin_percent ?? 0),
      commission_rate: Number(row.commission_rate ?? 0),
      commission_amount: Number(row.commission_amount ?? 0),
      released_at: row.released_at,
      paid_at: row.paid_at,
      cancelled_at: row.cancelled_at,
      created_at: row.created_at,
      customer_name: customer?.company_name ?? "—",
    };
  });

  const summary: CommissionSummary = {
    prevista: 0,
    pendente: 0,
    proporcional: 0,
    liberada: 0,
    paga: 0,
    cancelada: 0,
    total_open: 0,
  };

  for (const row of allRows ?? []) {
    const status = row.status as CommissionStatus;
    if (status in summary) {
      summary[status] += Number(row.commission_amount ?? 0);
    }
  }

  summary.total_open =
    summary.prevista + summary.pendente + summary.proporcional + summary.liberada;

  return { commissions, summary };
}

export async function getCommissionByOrderId(orderId: string) {
  const { supabase } = await createTenantClient();

  const { data, error } = await supabase
    .from("commissions")
    .select(
      `
      id,
      status,
      order_total,
      margin_percent,
      commission_rate,
      commission_amount,
      released_at,
      paid_at,
      cancelled_at,
      profiles ( full_name )
    `
    )
    .eq("order_id", orderId)
    .maybeSingle();

  if (error) throw new Error(error.message);
  if (!data) return null;

  const seller = unwrapRelation(
    data.profiles as { full_name: string } | { full_name: string }[] | null
  );

  return {
    id: data.id,
    status: data.status as CommissionStatus,
    seller_name: seller?.full_name ?? "—",
    order_total: Number(data.order_total ?? 0),
    margin_percent: Number(data.margin_percent ?? 0),
    commission_rate: Number(data.commission_rate ?? 0),
    commission_amount: Number(data.commission_amount ?? 0),
    released_at: data.released_at,
    paid_at: data.paid_at,
    cancelled_at: data.cancelled_at,
  };
}
