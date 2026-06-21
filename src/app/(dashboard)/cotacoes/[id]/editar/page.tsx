import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { QuoteForm } from "@/components/quotes/quote-form";
import { canEditQuote } from "@/lib/edit/status";
import { getOrderByQuoteId } from "@/lib/orders/queries";
import { getProductsByIds, getQuoteById } from "@/lib/quotes/queries";

export const dynamic = "force-dynamic";

export default async function EditarCotacaoPage({
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

  if (!canEditQuote(quote, linkedOrder)) {
    redirect(`/cotacoes/${id}`);
  }

  const products = await getProductsByIds(
    quote.items.map((item) => item.product_id)
  );

  return (
    <div>
      <PageHeader
        title={`Editar ${quote.quote_number}`}
        description="Altere itens, cliente ou condições enquanto a cotação estiver aberta."
        action={
          <Link
            href={`/cotacoes/${quote.id}`}
            className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </Link>
        }
      />
      <QuoteForm quote={quote} initialProducts={products} />
    </div>
  );
}
