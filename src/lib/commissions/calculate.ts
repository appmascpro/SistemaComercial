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

/** Tabela comercial: 2% / 3% / 5% conforme margem. */
export function commissionRateForMargin(marginPercent: number): number {
  if (marginPercent < 15) return 2;
  if (marginPercent < 25) return 3;
  return 5;
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
