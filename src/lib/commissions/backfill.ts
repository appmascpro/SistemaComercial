import "server-only";

import { syncCommissionForOrder } from "@/lib/commissions/sync";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { OrderStatus } from "@/types/order";

export interface CommissionBackfillResult {
  ordersProcessed: number;
  commissionsCreated: number;
  commissionsUpdated: number;
  skippedPaid: number;
  skippedNoSeller: number;
}

export async function backfillCommissionsForTenant(): Promise<CommissionBackfillResult> {
  const { supabase, tenantId } = await createTenantClient();

  const { data: orders, error: ordersError } = await supabase
    .from("orders")
    .select(
      "id, quote_id, seller_id, status, subtotal, discount_total, total, invoiced_amount, invoiced_at, cancelled_at"
    )
    .order("created_at", { ascending: true });

  if (ordersError) throw new Error(ordersError.message);

  const { data: existingCommissions, error: commissionsError } = await supabase
    .from("commissions")
    .select("order_id, status");

  if (commissionsError) throw new Error(commissionsError.message);

  const commissionByOrder = new Map(
    (existingCommissions ?? []).map((row) => [row.order_id, row.status])
  );

  let commissionsCreated = 0;
  let commissionsUpdated = 0;
  let skippedPaid = 0;
  let skippedNoSeller = 0;

  for (const order of orders ?? []) {
    if (!order.seller_id) {
      skippedNoSeller += 1;
      continue;
    }

    const existingStatus = commissionByOrder.get(order.id);
    if (existingStatus === "paga") {
      skippedPaid += 1;
      continue;
    }

    const hadCommission = Boolean(existingStatus);

    await syncCommissionForOrder(supabase, tenantId, {
      id: order.id,
      quote_id: order.quote_id,
      seller_id: order.seller_id,
      status: order.status as OrderStatus,
      subtotal: Number(order.subtotal),
      discount_total: Number(order.discount_total),
      total: Number(order.total),
      invoiced_amount: order.invoiced_amount
        ? Number(order.invoiced_amount)
        : null,
      invoiced_at: order.invoiced_at,
      cancelled_at: order.cancelled_at,
    });

    if (hadCommission) {
      commissionsUpdated += 1;
    } else {
      commissionsCreated += 1;
    }
  }

  return {
    ordersProcessed: orders?.length ?? 0,
    commissionsCreated,
    commissionsUpdated,
    skippedPaid,
    skippedNoSeller,
  };
}
