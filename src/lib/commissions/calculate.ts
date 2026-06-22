/**
 * Margem estimada a partir do pedido (sem custo real no cadastro).
 * Desconto alto reduz a margem presumida.
 */
export function estimateMarginPercent(input: {
  subtotal: number;
  discountTotal: number;
}): number {
  if (input.subtotal <= 0) return 20;

  const discountRatio = Math.min(1, input.discountTotal / input.subtotal);
  const adjusted = 25 - discountRatio * 15;
  return Math.round(Math.max(10, Math.min(40, adjusted)) * 10) / 10;
}

/** Tabela comercial legada: 2% / 3% / 5% conforme margem (quando não há taxa por categoria). */
export function commissionRateForMargin(marginPercent: number): number {
  if (marginPercent < 15) return 2;
  if (marginPercent < 25) return 3;
  return 5;
}

export interface OrderItemCommissionInput {
  line_total: number;
  category: string | null;
  product_commission_rate: number | null;
}

export function resolveItemCommissionRate(input: {
  item: OrderItemCommissionInput;
  categoryRates: Map<string, number>;
  defaultRate: number | null;
  fallbackRate: number;
}): number {
  if (
    input.item.product_commission_rate != null &&
    input.item.product_commission_rate > 0
  ) {
    return input.item.product_commission_rate;
  }

  const category = input.item.category?.trim();
  if (category) {
    const fromCategory = input.categoryRates.get(category.toLowerCase());
    if (fromCategory != null && fromCategory > 0) return fromCategory;
  }

  if (input.defaultRate != null && input.defaultRate > 0) {
    return input.defaultRate;
  }

  return input.fallbackRate;
}

export function calculateOrderCommissionFromItems(input: {
  items: OrderItemCommissionInput[];
  categoryRates: Map<string, number>;
  defaultRate: number | null;
  fallbackRate: number;
  ratio?: number;
}): { amount: number; effectiveRate: number; baseTotal: number } {
  const ratio = input.ratio ?? 1;
  let commissionTotal = 0;
  let baseTotal = 0;

  for (const item of input.items) {
    const lineTotal = Number(item.line_total);
    if (lineTotal <= 0) continue;

    baseTotal += lineTotal;
    const rate = resolveItemCommissionRate({
      item,
      categoryRates: input.categoryRates,
      defaultRate: input.defaultRate,
      fallbackRate: input.fallbackRate,
    });
    commissionTotal += lineTotal * (rate / 100);
  }

  commissionTotal = Math.round(commissionTotal * ratio * 100) / 100;
  const effectiveRate =
    baseTotal > 0
      ? Math.round(((commissionTotal / ratio / baseTotal) * 100) * 100) / 100
      : input.fallbackRate;

  return { amount: commissionTotal, effectiveRate, baseTotal };
}

export function calculateCommissionAmount(
  orderTotal: number,
  ratePercent: number,
  ratio = 1
): number {
  if (orderTotal <= 0 || ratePercent <= 0 || ratio <= 0) return 0;
  const amount = orderTotal * (ratePercent / 100) * ratio;
  return Math.round(amount * 100) / 100;
}
