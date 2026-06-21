"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { buildQuoteItems } from "@/lib/quotes/build-items";
import { generateQuoteNumber } from "@/lib/quotes/numbering";
import { getProductQuotePricing } from "@/lib/quotes/product-pricing";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { QuoteFormInput } from "@/types/quote";

export interface QuoteActionState {
  error?: string;
  success?: string;
  quoteId?: string;
}

function defaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

export async function createQuoteAction(
  input: QuoteFormInput
): Promise<QuoteActionState> {
  try {
    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();
    const { items, totals, metadata, customerState } =
      await buildQuoteItems(input);

    const quoteNumber = await generateQuoteNumber();

    const { data: quote, error: quoteError } = await supabase
      .from("quotes")
      .insert({
        tenant_id: tenantId,
        customer_id: input.customer_id,
        seller_id: profile.id,
        quote_number: quoteNumber,
        status: "aberta",
        valid_until: input.valid_until || defaultValidUntil(),
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        icms_total: totals.icmsTotal,
        ipi_total: totals.ipiTotal,
        tax_total: totals.taxTotal,
        total: totals.total,
        customer_state: customerState,
        notes: input.notes?.trim() || null,
        internal_notes: JSON.stringify(metadata),
      })
      .select("id")
      .single();

    if (quoteError || !quote) {
      throw new Error(quoteError?.message ?? "Erro ao criar cotação.");
    }

    const quoteItems = items.map((item) => ({
      tenant_id: tenantId,
      quote_id: quote.id,
      product_id: item.product_id,
      package_id: item.package_id,
      quantity: item.quantity,
      unit_price: item.unit_price,
      min_price: item.min_price,
      max_price: item.max_price,
      discount_percent: item.discount_percent,
      discount_amount: item.discount_amount,
      icms_rate: item.icms_rate,
      icms_amount: item.icms_amount,
      ipi_rate: item.ipi_rate,
      ipi_amount: item.ipi_amount,
      line_subtotal: item.line_subtotal,
      line_total: item.line_total,
      sort_order: item.sort_order,
    }));

    const { error: itemsError } = await supabase
      .from("quote_items")
      .insert(quoteItems);

    if (itemsError) {
      await supabase.from("quotes").delete().eq("id", quote.id);
      throw new Error(itemsError.message);
    }

    revalidatePath("/cotacoes");
    return {
      success: `Cotação ${quoteNumber} criada com sucesso.`,
      quoteId: quote.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível salvar a cotação.",
    };
  }
}

export async function getProductQuotePricingAction(
  productId: string,
  packageId: string | null
) {
  return getProductQuotePricing(productId, packageId);
}

export async function deleteQuoteAction(id: string): Promise<QuoteActionState> {
  try {
    const { supabase } = await createTenantClient();
    const { error } = await supabase.from("quotes").delete().eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/cotacoes");
    return { success: "Cotação excluída." };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível excluir a cotação.",
    };
  }
}
