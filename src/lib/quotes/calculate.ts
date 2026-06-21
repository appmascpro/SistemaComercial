export interface LineCalculationInput {
  quantity: number;
  unitPrice: number;
  minPrice: number | null;
  maxPrice: number | null;
  discountPercent: number;
  icmsRate: number;
  ipiRate: number;
}

export interface LineCalculationResult {
  unitPriceAfterDiscount: number;
  discountAmount: number;
  lineSubtotal: number;
  ipiAmount: number;
  icmsAmount: number;
  lineTotal: number;
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateQuoteLine(
  input: LineCalculationInput
): LineCalculationResult {
  const quantity = input.quantity;
  if (!Number.isFinite(quantity) || quantity <= 0) {
    throw new Error("Quantidade inválida.");
  }

  const discountPercent = Math.max(0, input.discountPercent);
  const discountAmount = roundMoney(input.unitPrice * (discountPercent / 100));
  const unitPriceAfterDiscount = roundMoney(input.unitPrice - discountAmount);

  if (input.minPrice != null && unitPriceAfterDiscount < input.minPrice) {
    throw new Error(
      `Preço unitário R$ ${unitPriceAfterDiscount.toFixed(2)} abaixo do mínimo R$ ${input.minPrice.toFixed(2)}.`
    );
  }

  if (input.maxPrice != null && unitPriceAfterDiscount > input.maxPrice) {
    throw new Error(
      `Preço unitário R$ ${unitPriceAfterDiscount.toFixed(2)} acima do máximo R$ ${input.maxPrice.toFixed(2)}.`
    );
  }

  const lineSubtotal = roundMoney(unitPriceAfterDiscount * quantity);
  const ipiAmount = roundMoney(lineSubtotal * (input.ipiRate / 100));
  const icmsBase = lineSubtotal + ipiAmount;
  const icmsAmount = roundMoney(icmsBase * (input.icmsRate / 100));
  const lineTotal = roundMoney(lineSubtotal + ipiAmount + icmsAmount);

  return {
    unitPriceAfterDiscount,
    discountAmount: roundMoney(discountAmount * quantity),
    lineSubtotal,
    ipiAmount,
    icmsAmount,
    lineTotal,
  };
}

export function sumQuoteTotals(items: LineCalculationResult[]) {
  const subtotal = roundMoney(items.reduce((sum, item) => sum + item.lineSubtotal, 0));
  const discountTotal = roundMoney(
    items.reduce((sum, item) => sum + item.discountAmount, 0)
  );
  const icmsTotal = roundMoney(items.reduce((sum, item) => sum + item.icmsAmount, 0));
  const ipiTotal = roundMoney(items.reduce((sum, item) => sum + item.ipiAmount, 0));
  const taxTotal = roundMoney(icmsTotal + ipiTotal);
  const total = roundMoney(subtotal + taxTotal);

  return { subtotal, discountTotal, icmsTotal, ipiTotal, taxTotal, total };
}
