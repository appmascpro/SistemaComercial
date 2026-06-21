import { notFound } from "next/navigation";
import { QuotePdfViewer } from "@/components/quotes/quote-pdf-viewer";
import { getOrderByQuoteId } from "@/lib/orders/queries";
import { getQuoteById } from "@/lib/quotes/queries";

export const dynamic = "force-dynamic";

export default async function CotacaoPdfPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tipo?: string }>;
}) {
  const { id } = await params;
  const { tipo } = await searchParams;
  const isOrder = tipo === "pedido";
  const [quote, linkedOrder] = await Promise.all([
    getQuoteById(id),
    getOrderByQuoteId(id),
  ]);

  if (!quote) notFound();

  return (
    <QuotePdfViewer
      quoteId={quote.id}
      quoteNumber={quote.quote_number}
      backHref={isOrder && linkedOrder ? `/pedidos/${linkedOrder.id}` : `/cotacoes/${quote.id}`}
      backLabel={isOrder ? "Voltar para pedido" : "Voltar para cotação"}
      documentType={isOrder ? "pedido" : "cotacao"}
      orderHref={linkedOrder ? `/pedidos/${linkedOrder.id}` : null}
      orderNumber={linkedOrder?.order_number ?? null}
    />
  );
}
