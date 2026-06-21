"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { buildQuoteItems } from "@/lib/quotes/build-items";
import { generateOrderNumber } from "@/lib/orders/numbering";
import {
  getOrderByQuoteId,
  getQuoteForConversion,
} from "@/lib/orders/queries";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { OrderStatus, OrderFormInput } from "@/types/order";

export interface OrderActionState {
  error?: string;
  success?: string;
  orderId?: string;
}

export async function createOrderFromQuoteAction(
  quoteId: string
): Promise<OrderActionState> {
  try {
    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();

    const existing = await getOrderByQuoteId(quoteId);
    if (existing) {
      return {
        error: `Esta cotação já foi convertida no pedido ${existing.order_number}.`,
        orderId: existing.id,
      };
    }

    const conversion = await getQuoteForConversion(quoteId);
    if (!conversion) {
      return { error: "Cotação não encontrada." };
    }

    const { quote, metadata } = conversion;
    const items = quote.quote_items ?? [];

    if (items.length === 0) {
      return { error: "A cotação não possui itens." };
    }

    const orderNumber = await generateOrderNumber();
    const now = new Date().toISOString();

    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        tenant_id: tenantId,
        quote_id: quote.id,
        customer_id: quote.customer_id,
        seller_id: quote.seller_id ?? profile.id,
        order_number: orderNumber,
        status: "criado",
        payment_terms: metadata.payment_terms,
        subtotal: quote.subtotal,
        discount_total: quote.discount_total,
        icms_total: quote.icms_total,
        ipi_total: quote.ipi_total,
        tax_total: quote.tax_total,
        total: quote.total,
        ordered_at: now,
        notes: quote.notes,
        internal_notes: quote.internal_notes,
      })
      .select("id")
      .single();

    if (orderError || !order) {
      throw new Error(orderError?.message ?? "Erro ao criar pedido.");
    }

    const orderItems = items.map(
      (item: {
        id: string;
        product_id: string;
        package_id: string | null;
        quantity: number;
        unit_price: number;
        discount_percent: number;
        discount_amount: number;
        icms_rate: number;
        icms_amount: number;
        ipi_rate: number;
        ipi_amount: number;
        line_subtotal: number;
        line_total: number;
        sort_order: number;
      }) => ({
        tenant_id: tenantId,
        order_id: order.id,
        product_id: item.product_id,
        package_id: item.package_id,
        quote_item_id: item.id,
        quantity: item.quantity,
        unit_price: item.unit_price,
        discount_percent: item.discount_percent,
        discount_amount: item.discount_amount,
        icms_rate: item.icms_rate,
        icms_amount: item.icms_amount,
        ipi_rate: item.ipi_rate,
        ipi_amount: item.ipi_amount,
        line_subtotal: item.line_subtotal,
        line_total: item.line_total,
        sort_order: item.sort_order,
      })
    );

    const { error: itemsError } = await supabase
      .from("order_items")
      .insert(orderItems);

    if (itemsError) {
      await supabase.from("orders").delete().eq("id", order.id);
      throw new Error(itemsError.message);
    }

    await supabase
      .from("quotes")
      .update({ status: "aprovada" })
      .eq("id", quoteId);

    revalidatePath("/");
    revalidatePath("/pedidos");
    revalidatePath("/cotacoes");
    revalidatePath(`/cotacoes/${quoteId}`);

    return {
      success: `Pedido ${orderNumber} criado a partir da cotação ${quote.quote_number}.`,
      orderId: order.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível criar o pedido.",
    };
  }
}

export async function updateOrderStatusAction(
  orderId: string,
  status: OrderStatus
): Promise<OrderActionState> {
  try {
    const { supabase } = await createTenantClient();
    const patch: Record<string, unknown> = { status };

    if (status === "faturado") {
      patch.invoiced_at = new Date().toISOString();
    }
    if (status === "cancelado") {
      patch.cancelled_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("orders")
      .update(patch)
      .eq("id", orderId);

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/pedidos");
    revalidatePath(`/pedidos/${orderId}`);

    return { success: "Status do pedido atualizado." };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o pedido.",
    };
  }
}

export async function updateOrderAction(
  orderId: string,
  input: OrderFormInput
): Promise<OrderActionState> {
  try {
    const { supabase, tenantId } = await createTenantClient();

    const { data: existing, error: fetchError } = await supabase
      .from("orders")
      .select("id, status, customer_id, internal_notes")
      .eq("id", orderId)
      .maybeSingle();

    if (fetchError || !existing) {
      return { error: "Pedido não encontrado." };
    }

    if (existing.status !== "criado" && existing.status !== "confirmado") {
      return { error: "Este pedido não pode mais ser editado." };
    }

    if (!input.items.length) {
      return { error: "Adicione ao menos um item ao pedido." };
    }

    const quoteInput = {
      customer_id: existing.customer_id,
      items: input.items,
    };

    const { items, totals } = await buildQuoteItems(quoteInput);

    const { error: updateError } = await supabase
      .from("orders")
      .update({
        subtotal: totals.subtotal,
        discount_total: totals.discountTotal,
        icms_total: totals.icmsTotal,
        ipi_total: totals.ipiTotal,
        tax_total: totals.taxTotal,
        total: totals.total,
        payment_terms: input.payment_terms?.trim() || null,
        notes: input.notes?.trim() || null,
      })
      .eq("id", orderId);

    if (updateError) throw new Error(updateError.message);

    const { error: deleteItemsError } = await supabase
      .from("order_items")
      .delete()
      .eq("order_id", orderId);

    if (deleteItemsError) throw new Error(deleteItemsError.message);

    const orderItems = items.map((item) => ({
      tenant_id: tenantId,
      order_id: orderId,
      product_id: item.product_id,
      package_id: item.package_id,
      quote_item_id: null,
      quantity: item.quantity,
      unit_price: item.unit_price,
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
      .from("order_items")
      .insert(orderItems);

    if (itemsError) throw new Error(itemsError.message);

    revalidatePath("/");
    revalidatePath("/pedidos");
    revalidatePath(`/pedidos/${orderId}`);

    return {
      success: "Pedido atualizado com sucesso.",
      orderId,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "Não foi possível atualizar o pedido.",
    };
  }
}
