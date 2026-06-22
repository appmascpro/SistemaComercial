import type { SupabaseClient } from "@supabase/supabase-js";
import type { CommissionStatus } from "@/types/commission";
import type { OrderStatus } from "@/types/order";
import {
  calculateCommissionAmount,
  commissionRateForMargin,
  estimateMarginPercent,
} from "@/lib/commissions/calculate";

interface OrderCommissionInput {
  id: string;
  quote_id: string | null;
  seller_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  total: number;
  invoiced_amount: number | null;
}

function commissionStatusForOrder(
  orderStatus: OrderStatus
): CommissionStatus {
  switch (orderStatus) {
    case "criado":
      return "prevista";
    case "confirmado":
      return "pendente";
    case "parcial":
      return "proporcional";
    case "faturado":
      return "liberada";
    case "cancelado":
      return "cancelada";
    default:
      return "prevista";
  }
}

export async function syncCommissionForOrder(
  supabase: SupabaseClient,
  tenantId: string,
  order: OrderCommissionInput
): Promise<void> {
  if (!order.seller_id) return;

  const marginPercent = estimateMarginPercent({
    subtotal: order.subtotal,
    discountTotal: order.discount_total,
  });
  const rate = commissionRateForMargin(marginPercent);
  const commissionStatus = commissionStatusForOrder(order.status);

  let ratio = 1;
  if (order.status === "parcial") {
    const invoiced = order.invoiced_amount ?? 0;
    ratio = order.total > 0 ? Math.min(1, invoiced / order.total) : 0;
  }

  const fullAmount = calculateCommissionAmount(order.total, rate, ratio);
  const now = new Date().toISOString();

  const { data: existing } = await supabase
    .from("commissions")
    .select("id, status, paid_at")
    .eq("order_id", order.id)
    .maybeSingle();

  if (existing?.status === "paga") {
    return;
  }

  const patch: Record<string, unknown> = {
    tenant_id: tenantId,
    seller_id: order.seller_id,
    order_id: order.id,
    quote_id: order.quote_id,
    status: commissionStatus,
    order_total: order.total,
    margin_percent: marginPercent,
    commission_rate: rate,
    commission_base: order.total,
    commission_amount:
      commissionStatus === "cancelada" ? 0 : fullAmount,
  };

  if (commissionStatus === "liberada" || commissionStatus === "proporcional") {
    patch.released_at = now;
    patch.cancelled_at = null;
  }

  if (commissionStatus === "cancelada") {
    patch.cancelled_at = now;
    patch.released_at = null;
  }

  if (commissionStatus === "prevista" || commissionStatus === "pendente") {
    patch.released_at = null;
    patch.cancelled_at = null;
  }

  if (existing) {
    await supabase.from("commissions").update(patch).eq("id", existing.id);
  } else {
    await supabase.from("commissions").insert(patch);
  }
}
