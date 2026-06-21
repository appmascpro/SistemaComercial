import { roundMoney } from "@/lib/quotes/calculate";

/** ICMS fixo para cotações comerciais Tavares */
export const QUOTE_ICMS_RATE = 18;

export function calculateBrlFromUsd(priceUsd: number, ptax: number): number {
  return Math.round(priceUsd * ptax * 100) / 100;
}

export interface QuoteGrossPrices {
  pricing_currency: "USD" | "BRL";
  ipi_rate: number;
  icms_rate: number;
  net_usd: number | null;
  net_brl: number | null;
  gross_usd: number | null;
  gross_brl: number;
  gross_min_usd: number | null;
  gross_max_usd: number | null;
  gross_min_brl: number;
  gross_max_brl: number;
}

export function grossFromNet(
  netUnitPrice: number,
  ipiRate = 0,
  icmsRate = QUOTE_ICMS_RATE
): number {
  if (netUnitPrice <= 0) return 0;
  const withIpi = netUnitPrice * (1 + ipiRate / 100);
  return roundMoney(withIpi * (1 + icmsRate / 100));
}

export function resolveQuoteGrossPrices(input: {
  price_usd: number | null;
  price_brl: number | null;
  min_price: number | null;
  max_price: number | null;
  ipi_rate: number;
  ptax_rate: number;
}): QuoteGrossPrices {
  const ipiRate = input.ipi_rate;
  const isUsd = input.price_usd != null;

  const netUsd = isUsd ? Number(input.price_usd) : null;
  const netBrl =
    input.price_brl != null
      ? Number(input.price_brl)
      : netUsd != null
        ? calculateBrlFromUsd(netUsd, input.ptax_rate)
        : null;

  if (netBrl == null) {
    throw new Error("Preço do produto não encontrado.");
  }

  const netMinRaw =
    input.min_price != null
      ? Number(input.min_price)
      : isUsd
        ? netUsd
        : netBrl;
  const netMaxRaw =
    input.max_price != null
      ? Number(input.max_price)
      : isUsd
        ? netUsd
        : netBrl;

  const netMinBrl =
    isUsd && netMinRaw != null
      ? calculateBrlFromUsd(netMinRaw, input.ptax_rate)
      : (netMinRaw ?? netBrl);
  const netMaxBrl =
    isUsd && netMaxRaw != null
      ? calculateBrlFromUsd(netMaxRaw, input.ptax_rate)
      : (netMaxRaw ?? netBrl);

  const grossBrl = grossFromNet(netBrl, ipiRate);
  const grossMinBrl = grossFromNet(netMinBrl, ipiRate);
  const grossMaxBrl = grossFromNet(netMaxBrl, ipiRate);

  const grossUsd =
    netUsd != null ? grossFromNet(netUsd, ipiRate) : null;
  const grossMinUsd =
    netUsd != null && netMinRaw != null
      ? grossFromNet(netMinRaw, ipiRate)
      : null;
  const grossMaxUsd =
    netUsd != null && netMaxRaw != null
      ? grossFromNet(netMaxRaw, ipiRate)
      : null;

  return {
    pricing_currency: isUsd ? "USD" : "BRL",
    ipi_rate: ipiRate,
    icms_rate: QUOTE_ICMS_RATE,
    net_usd: netUsd,
    net_brl: roundMoney(netBrl),
    gross_usd: grossUsd,
    gross_brl: grossBrl,
    gross_min_usd: grossMinUsd,
    gross_max_usd: grossMaxUsd,
    gross_min_brl: grossMinBrl,
    gross_max_brl: grossMaxBrl,
  };
}

export function brlFromUsdGross(usdGross: number, ptaxRate: number): number {
  return roundMoney(calculateBrlFromUsd(usdGross, ptaxRate));
}

export function usdFromBrlGross(brlGross: number, ptaxRate: number): number {
  if (ptaxRate <= 0) return 0;
  return roundMoney(brlGross / ptaxRate);
}

export function lineTotalUsd(
  unitUsdGross: number,
  quantity: number
): number {
  return roundMoney(unitUsdGross * quantity);
}
