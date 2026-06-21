import { normalizeHeader } from "@/lib/products/import/normalize";

/** Detecta moeda mesmo com encoding quebrado (ex.: D�LAR no CSV mal decodificado). */
export function isDollarCurrency(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  if (!raw) return false;

  const n = normalizeHeader(raw).replace(/\uFFFD/g, "");
  if (n.includes("dolar") || n.includes("usd") || n.includes("us$")) return true;
  if (/^d\s*o?\s*l\s*a\s*r$/i.test(n.replace(/\s/g, ""))) return true;
  if (/^d\s*l\s*a\s*r$/i.test(n.replace(/\s/g, ""))) return true;

  return /^d.{0,2}lar$/i.test(n.replace(/\s/g, ""));
}

export function isRealCurrency(value: unknown): boolean {
  const raw = String(value ?? "").trim();
  if (!raw) return false;

  const n = normalizeHeader(raw);
  return n.includes("real") || n.includes("brl") || n === "r$";
}

export function inferCurrencyFromCells(
  moedaCell: unknown,
  netPriceCell: unknown
): "DÓLAR" | "REAL" {
  if (isDollarCurrency(moedaCell)) return "DÓLAR";
  if (isRealCurrency(moedaCell)) return "REAL";

  const raw = String(netPriceCell ?? "");
  if (raw.includes("$") && !raw.toLowerCase().includes("r$")) return "DÓLAR";
  if (raw.toLowerCase().includes("r$")) return "REAL";

  return "REAL";
}

export function resolvePricesFromCurrency(
  currency: unknown,
  netPrice: number | null
): { price_usd: number | null; price_brl: number | null } {
  if (netPrice === null) return { price_usd: null, price_brl: null };

  if (isDollarCurrency(currency)) {
    return { price_usd: netPrice, price_brl: null };
  }

  return { price_usd: null, price_brl: netPrice };
}
