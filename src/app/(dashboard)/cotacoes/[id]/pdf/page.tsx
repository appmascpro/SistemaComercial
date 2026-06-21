import { notFound } from "next/navigation";
import { QuotePdfViewer } from "@/components/quotes/quote-pdf-viewer";
import { getOrderByQuoteId } from "@/lib/orders/queries";
import { getQuoteById } from "@/lib/quotes/queries";

export const dynamic = "force-dynamic";

export default async function CotacaoPdfPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [quote, linkedOrder] = await Promise.all([
    getQuoteById(id),
    getOrderByQuoteId(id),
  ]);

  if (!quote) notFound();

  return (
    <QuotePdfViewer
      quoteId={quote.id}
      quoteNumber={quote.quote_number}
      backHref={`/cotacoes/${quote.id}`}
      orderHref={linkedOrder ? `/pedidos/${linkedOrder.id}` : null}
      orderNumber={linkedOrder?.order_number ?? null}
    />
  );
}
