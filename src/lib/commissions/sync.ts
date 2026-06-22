import type { SupabaseClient } from "@supabase/supabase-js";
import {
  calculateCommissionAmount,
  calculateOrderCommissionFromItems,
  commissionRateForMargin,
  estimateMarginPercent,
} from "@/lib/commissions/calculate";
import {
  getDefaultCommissionRate,
} from "@/lib/commissions/category-rates";
import type { CommissionStatus } from "@/types/commission";
import type { OrderStatus } from "@/types/order";

interface OrderCommissionInput {
  id: string;
  quote_id: string | null;
  seller_id: string | null;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  total: number;
  invoiced_amount: number | null;
  invoiced_at?: string | null;
  cancelled_at?: string | null;
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

function unwrapProduct(
  value:
    | { category: string | null; commission_rate: number | null }
    | { category: string | null; commission_rate: number | null }[]
    | null
) {
  if (value == null) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
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
  const marginFallbackRate = commissionRateForMargin(marginPercent);
  const commissionStatus = commissionStatusForOrder(order.status);

  let ratio = 1;
  if (order.status === "parcial") {
    const invoiced = order.invoiced_amount ?? 0;
    ratio = order.total > 0 ? Math.min(1, invoiced / order.total) : 0;
  }

  const [{ data: items }, { data: rateRows }] = await Promise.all([
    supabase
      .from("order_items")
      .select(
        `
        line_total,
        products ( category, commission_rate )
      `
      )
      .eq("order_id", order.id),
    supabase
      .from("commission_category_rates")
      .select("category, commission_rate")
      .eq("status", "ativo"),
  ]);

  const categoryRates = new Map<string, number>();
  for (const row of rateRows ?? []) {
    categoryRates.set(row.category.toLowerCase(), Number(row.commission_rate));
  }

  const hasCustomRules = (rateRows ?? []).length > 0;
  const defaultRate = getDefaultCommissionRate(categoryRates);

  let rate = marginFallbackRate;
  let fullAmount: number;

  if (hasCustomRules && (items ?? []).length > 0) {
    const calculated = calculateOrderCommissionFromItems({
      items: (items ?? []).map((row) => {
        const product = unwrapProduct(
          row.products as
            | { category: string | null; commission_rate: number | null }
            | { category: string | null; commission_rate: number | null }[]
            | null
        );
        return {
          line_total: Number(row.line_total),
          category: product?.category ?? null,
          product_commission_rate:
            product?.commission_rate != null
              ? Number(product.commission_rate)
              : null,
        };
      }),
      categoryRates,
      defaultRate,
      fallbackRate: marginFallbackRate,
      ratio,
    });
    rate = calculated.effectiveRate;
    fullAmount = calculated.amount;
  } else {
    fullAmount = calculateCommissionAmount(order.total, rate, ratio);
  }

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
    patch.released_at = order.invoiced_at ?? now;
    patch.cancelled_at = null;
  }

  if (commissionStatus === "cancelada") {
    patch.cancelled_at = order.cancelled_at ?? now;
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
