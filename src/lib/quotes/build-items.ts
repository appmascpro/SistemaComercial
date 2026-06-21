import "server-only";

import { calculateQuoteLine, roundMoney, sumQuoteTotals } from "@/lib/quotes/calculate";
import { getActivePtaxRate } from "@/lib/pricing/ptax";
import { tavaresCompanyData } from "@/lib/company/tavares-company";
import {
  QUOTE_ICMS_RATE,
  resolveQuoteGrossPrices,
  usdFromBrlGross,
} from "@/lib/quotes/quote-pricing-core";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type {
  QuoteFormInput,
  QuoteMetadata,
  ResolvedQuoteItem,
} from "@/types/quote";

interface TaxRuleRow {
  region: string | null;
  icms_rate: number;
  ipi_rate: number;
}

interface ProductPriceRow {
  price_usd: number | null;
  price_brl: number | null;
  min_price: number | null;
  max_price: number | null;
  package_id: string | null;
  status: string;
}

function parseMetadata(raw: string | null): QuoteMetadata {
  if (raw) {
    try {
      const parsed = JSON.parse(raw) as Partial<QuoteMetadata>;
      if (parsed.ptax != null) {
        return {
          ptax: Number(parsed.ptax),
          freight: parsed.freight ?? tavaresCompanyData.quotationDefaults.default_freight,
          payment_terms:
            parsed.payment_terms ??
            tavaresCompanyData.quotationDefaults.default_payment_terms,
        };
      }
    } catch {
      /* fallback abaixo */
    }
  }

  return {
    ptax: tavaresCompanyData.quotationDefaults.ptax,
    freight: tavaresCompanyData.quotationDefaults.default_freight,
    payment_terms: tavaresCompanyData.quotationDefaults.default_payment_terms,
  };
}

function resolveUnitPrice(
  prices: ProductPriceRow[],
  packageId: string | null,
  ipiRate: number,
  ptaxRate: number
): ReturnType<typeof resolveQuoteGrossPrices> {
  const active = prices.filter((p) => p.status === "ativo");
  const match =
    (packageId
      ? active.find((p) => p.package_id === packageId)
      : active.find((p) => !p.package_id)) ?? active[0];

  if (!match) {
    throw new Error("Produto sem preço ativo.");
  }

  return resolveQuoteGrossPrices({
    price_usd: match.price_usd != null ? Number(match.price_usd) : null,
    price_brl: match.price_brl != null ? Number(match.price_brl) : null,
    min_price: match.min_price != null ? Number(match.min_price) : null,
    max_price: match.max_price != null ? Number(match.max_price) : null,
    ipi_rate: ipiRate,
    ptax_rate: ptaxRate,
  });
}

function resolveIpiRate(rules: TaxRuleRow[]): number {
  const ipiRule = rules.find((r) => r.region === "ipi");
  return Number(ipiRule?.ipi_rate ?? 0);
}

export async function buildQuoteItems(
  input: QuoteFormInput
): Promise<{
  items: ResolvedQuoteItem[];
  totals: ReturnType<typeof sumQuoteTotals>;
  metadata: QuoteMetadata;
  customerState: string | null;
}> {
  if (!input.items.length) {
    throw new Error("Adicione ao menos um item à cotação.");
  }

  const { supabase } = await createTenantClient();
  const ptax = await getActivePtaxRate();

  const { data: customer, error: customerError } = await supabase
    .from("customers")
    .select("id, state")
    .eq("id", input.customer_id)
    .maybeSingle();

  if (customerError || !customer) {
    throw new Error("Cliente não encontrado.");
  }

  const productIds = [...new Set(input.items.map((item) => item.product_id))];

  const { data: products, error: productsError } = await supabase
    .from("products")
    .select(
      `
      id,
      internal_code,
      commercial_name,
      product_prices (
        price_usd,
        price_brl,
        min_price,
        max_price,
        package_id,
        status
      ),
      product_packages (
        id,
        name,
        status
      ),
      tax_rules (
        region,
        icms_rate,
        ipi_rate,
        status
      )
    `
    )
    .in("id", productIds);

  if (productsError || !products?.length) {
    throw new Error("Produtos não encontrados.");
  }

  const productMap = new Map(products.map((p) => [p.id, p]));
  const resolvedItems: ResolvedQuoteItem[] = [];
  const lineTotals: ReturnType<typeof calculateQuoteLine>[] = [];

  for (const [index, item] of input.items.entries()) {
    const product = productMap.get(item.product_id);
    if (!product) {
      throw new Error("Produto inválido na cotação.");
    }

    const prices = (product.product_prices ?? []) as ProductPriceRow[];
    const rules = ((product.tax_rules ?? []) as TaxRuleRow[]).filter(
      (r) => (r as { status?: string }).status !== "inativo"
    );
    const packages = (product.product_packages ?? []) as Array<{
      id: string;
      name: string;
      status: string;
    }>;

    const packageId = item.package_id ?? null;
    const packageName =
      packages.find((p) => p.id === packageId)?.name ??
      packages.find((p) => p.status === "ativo")?.name ??
      null;

    const ipiRate = resolveIpiRate(rules);
    const gross = resolveUnitPrice(prices, packageId, ipiRate, ptax.rate);

    const chosenUnitPriceBrl = roundMoney(item.unit_price);

    if (chosenUnitPriceBrl < gross.gross_min_brl) {
      throw new Error(
        `Preço de "${product.commercial_name}" abaixo do mínimo com ICMS ${QUOTE_ICMS_RATE}% (R$ ${gross.gross_min_brl.toFixed(2)}/kg).`
      );
    }

    const calculated = calculateQuoteLine({
      quantity: item.quantity,
      unitPrice: chosenUnitPriceBrl,
      listPrice: gross.gross_max_brl,
      minPrice: gross.gross_min_brl,
      icmsRate: 0,
      ipiRate: 0,
    });

    const unitPriceUsd =
      gross.pricing_currency === "USD"
        ? usdFromBrlGross(calculated.unitPriceAfterDiscount, ptax.rate)
        : null;

    resolvedItems.push({
      product_id: product.id,
      package_id: packageId,
      product_code: product.internal_code,
      product_name: product.commercial_name,
      package_name: packageName,
      quantity: item.quantity,
      unit_price: calculated.unitPriceAfterDiscount,
      unit_price_usd: unitPriceUsd,
      pricing_currency: gross.pricing_currency,
      min_price: gross.gross_min_brl,
      max_price: gross.gross_max_brl,
      min_price_usd: gross.gross_min_usd,
      max_price_usd: gross.gross_max_usd,
      discount_percent: calculated.discountPercent,
      discount_amount: calculated.discountAmount,
      icms_rate: QUOTE_ICMS_RATE,
      icms_amount: 0,
      ipi_rate: ipiRate,
      ipi_amount: 0,
      line_subtotal: calculated.lineSubtotal,
      line_total: calculated.lineTotal,
      sort_order: index,
    });

    lineTotals.push(calculated);
  }

  const metadata: QuoteMetadata = {
    ptax: ptax.rate,
    freight: tavaresCompanyData.quotationDefaults.default_freight,
    payment_terms: tavaresCompanyData.quotationDefaults.default_payment_terms,
  };

  return {
    items: resolvedItems,
    totals: sumQuoteTotals(lineTotals),
    metadata,
    customerState: customer.state,
  };
}

export { parseMetadata };
