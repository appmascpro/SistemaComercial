import { roundMoney } from "@/lib/quotes/calculate";

export interface MarkupResult {
  /** % sobre a faixa min→max (0% no mín, 100% no máx, >100% acima do máx) */
  markupPercent: number;
  /** Markup unitário em R$ (preço − mínimo) */
  markupBrlPerUnit: number;
  /** Markup da linha (markup unitário × quantidade) */
  markupBrlLine: number;
  minPrice: number;
  maxPrice: number;
}

export function resolvePriceBounds(
  listPrice: number,
  minPrice: number | null | undefined,
  maxPrice: number | null | undefined
): { min: number; max: number; list: number } {
  const list = roundMoney(listPrice);
  const min = roundMoney(minPrice ?? list);
  const max = roundMoney(maxPrice ?? list);
  return {
    min: Math.min(min, max),
    max: Math.max(min, max),
    list,
  };
}

/**
 * Markup linear entre mínimo (0%) e máximo (100%).
 * Acima do máximo continua subindo: 101%, 102%…
 */
export function calculateMarkup(
  unitPrice: number,
  minPrice: number,
  maxPrice: number,
  quantity = 1
): MarkupResult {
  const price = roundMoney(unitPrice);
  const min = roundMoney(minPrice);
  const max = roundMoney(maxPrice);
  const markupBrlPerUnit = roundMoney(price - min);
  const markupBrlLine = roundMoney(markupBrlPerUnit * quantity);

  let markupPercent = 0;

  if (price <= min) {
    markupPercent = 0;
  } else if (max <= min) {
    markupPercent = roundMoney(100 + (markupBrlPerUnit / min) * 100);
  } else {
    markupPercent = roundMoney(((price - min) / (max - min)) * 100);
  }

  return {
    markupPercent,
    markupBrlPerUnit,
    markupBrlLine,
    minPrice: min,
    maxPrice: max,
  };
}

export function formatMarkupPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}
