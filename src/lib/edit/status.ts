import type { OrderDetail } from "@/types/order";
import type { QuoteDetail } from "@/types/quote";
import type { SampleDetail } from "@/types/sample";

export function canEditQuote(
  quote: Pick<QuoteDetail, "status">,
  linkedOrder?: { id: string } | null
): boolean {
  if (linkedOrder) return false;
  return quote.status === "aberta" || quote.status === "enviada";
}

export function canEditOrder(order: Pick<OrderDetail, "status">): boolean {
  return order.status === "criado" || order.status === "confirmado";
}

export function canEditSample(sample: Pick<SampleDetail, "status">): boolean {
  return sample.status === "pendente";
}
