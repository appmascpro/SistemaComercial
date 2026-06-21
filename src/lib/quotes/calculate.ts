export interface LineCalculationInput {
  quantity: number;
  /** Preço unitário final escolhido na cotação */
  unitPrice: number;
  /** Preço de tabela (referência para desconto) */
  listPrice: number;
  minPrice: number | null;
  icmsRate: number;
  ipiRate: number;
}

export interface LineCalculationResult {
  unitPriceAfterDiscount: number;
  discountAmount: number;
  discountPercent: number;
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

  if (!Number.isFinite(input.unitPrice) || input.unitPrice <= 0) {
    throw new Error("Informe um preço unitário válido.");
  }

  const unitPriceAfterDiscount = roundMoney(input.unitPrice);

  if (input.minPrice != null && unitPriceAfterDiscount < input.minPrice) {
    throw new Error(
      `Preço unitário R$ ${unitPriceAfterDiscount.toFixed(2)} abaixo do mínimo R$ ${input.minPrice.toFixed(2)}.`
    );
  }

  const listPrice = roundMoney(input.listPrice);
  const discountPerUnit = roundMoney(Math.max(0, listPrice - unitPriceAfterDiscount));
  const discountAmount = roundMoney(discountPerUnit * quantity);
  const discountPercent =
    listPrice > 0 ? roundMoney((discountPerUnit / listPrice) * 100) : 0;

  const lineSubtotal = roundMoney(unitPriceAfterDiscount * quantity);
  const ipiAmount = roundMoney(lineSubtotal * (input.ipiRate / 100));
  const icmsBase = lineSubtotal + ipiAmount;
  const icmsAmount = roundMoney(icmsBase * (input.icmsRate / 100));
  const lineTotal = roundMoney(lineSubtotal + ipiAmount + icmsAmount);

  return {
    unitPriceAfterDiscount,
    discountAmount,
    discountPercent,
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
