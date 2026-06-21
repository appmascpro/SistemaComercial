import "server-only";

import { calculateBrlFromUsd, getActivePtaxRate } from "@/lib/pricing/ptax";
import { tavaresCompanyData } from "@/lib/company/tavares-company";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import { calculateQuoteLine, sumQuoteTotals } from "@/lib/quotes/calculate";
import { resolveIcmsRegion } from "@/lib/quotes/icms-region";
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
  ptaxRate: number
): { unitPrice: number; minPrice: number | null; maxPrice: number | null } {
  const active = prices.filter((p) => p.status === "ativo");
  const match =
    (packageId
      ? active.find((p) => p.package_id === packageId)
      : active.find((p) => !p.package_id)) ?? active[0];

  if (!match) {
    throw new Error("Produto sem preço ativo.");
  }

  const unitPrice =
    match.price_brl ??
    (match.price_usd != null
      ? calculateBrlFromUsd(Number(match.price_usd), ptaxRate)
      : null);

  if (unitPrice == null) {
    throw new Error("Não foi possível calcular o preço do produto.");
  }

  return {
    unitPrice,
    minPrice: match.min_price != null ? Number(match.min_price) : null,
    maxPrice: match.max_price != null ? Number(match.max_price) : null,
  };
}

function resolveTaxRates(
  rules: TaxRuleRow[],
  customerState: string | null
): { icmsRate: number; ipiRate: number } {
  const region = resolveIcmsRegion(customerState);
  const icmsRule = rules.find((r) => r.region === region);
  const ipiRule = rules.find((r) => r.region === "ipi");

  return {
    icmsRate: Number(icmsRule?.icms_rate ?? 0),
    ipiRate: Number(ipiRule?.ipi_rate ?? 0),
  };
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

    const { unitPrice, minPrice, maxPrice } = resolveUnitPrice(
      prices,
      packageId,
      ptax.rate
    );
    const { icmsRate, ipiRate } = resolveTaxRates(rules, customer.state);

    const calculated = calculateQuoteLine({
      quantity: item.quantity,
      unitPrice,
      minPrice,
      maxPrice,
      discountPercent: item.discount_percent,
      icmsRate,
      ipiRate,
    });

    resolvedItems.push({
      product_id: product.id,
      package_id: packageId,
      product_code: product.internal_code,
      product_name: product.commercial_name,
      package_name: packageName,
      quantity: item.quantity,
      unit_price: calculated.unitPriceAfterDiscount,
      min_price: minPrice,
      max_price: maxPrice,
      discount_percent: item.discount_percent,
      discount_amount: calculated.discountAmount,
      icms_rate: icmsRate,
      icms_amount: calculated.icmsAmount,
      ipi_rate: ipiRate,
      ipi_amount: calculated.ipiAmount,
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
