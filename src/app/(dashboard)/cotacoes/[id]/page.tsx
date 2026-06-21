import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { ConvertQuoteButton } from "@/components/orders/convert-quote-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canEditQuote } from "@/lib/edit/status";
import { getOrderByQuoteId } from "@/lib/orders/queries";
import { getQuoteById } from "@/lib/quotes/queries";
import { calculateMarkup, formatMarkupPercent } from "@/lib/quotes/markup";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatQuantity,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function CotacaoDetailPage({
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

  const editable = canEditQuote(quote, linkedOrder);

  const totalMarkupBrl = quote.items.reduce((sum, item) => {
    if (item.min_price == null || item.max_price == null) return sum;
    return (
      sum +
      calculateMarkup(
        item.unit_price,
        item.min_price,
        item.max_price,
        item.quantity
      ).markupBrlLine
    );
  }, 0);

  return (
    <div>
      <PageHeader
        title={quote.quote_number}
        description={`Proposta para ${quote.customer.company_name} · ${formatDate(quote.created_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {editable ? (
              <Link
                href={`/cotacoes/${quote.id}/editar`}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            ) : null}
            <ConvertQuoteButton
              quoteId={quote.id}
              existingOrderId={linkedOrder?.id}
              existingOrderNumber={linkedOrder?.order_number}
            />
            <Link
              href={`/cotacoes/${quote.id}/pdf`}
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
            >
              <FileDown className="h-4 w-4" />
              Ver PDF
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-900">
              {formatCurrency(quote.total, "BRL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Validade</p>
            <p className="text-xl font-semibold text-slate-900">
              {quote.valid_until ? formatDate(quote.valid_until) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">PTAX ref.</p>
            <p className="text-xl font-semibold text-slate-900">
              {formatCurrency(quote.metadata.ptax, "BRL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Markup total</p>
            <p className="text-xl font-semibold text-emerald-700">
              {formatCurrency(totalMarkupBrl, "BRL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-xl font-semibold capitalize text-slate-900">
              {quote.status}
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Itens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-300">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Produto</th>
                    <th className="px-3 py-2">Emb.</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2 text-right">Preço/kg</th>
                    <th className="px-3 py-2 text-right">Markup %</th>
                    <th className="px-3 py-2 text-right">Markup R$</th>
                    <th className="px-3 py-2 text-right">ICMS</th>
                    <th className="px-3 py-2 text-right">IPI</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {quote.items.map((item) => {
                    const markup =
                      item.min_price != null && item.max_price != null
                        ? calculateMarkup(
                            item.unit_price,
                            item.min_price,
                            item.max_price,
                            item.quantity
                          )
                        : null;

                    return (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.product_code}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {item.package_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.unit_price, "BRL")}
                      </td>
                      <td className="px-3 py-2 text-right font-medium text-brand-700">
                        {markup ? formatMarkupPercent(markup.markupPercent) : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {markup
                          ? formatCurrency(markup.markupBrlLine, "BRL")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatPercent(item.icms_rate)}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatPercent(item.ipi_rate)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.line_total, "BRL")}
                      </td>
                    </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <dl className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd>{formatCurrency(quote.subtotal, "BRL")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">IPI</dt>
                  <dd>{formatCurrency(quote.ipi_total, "BRL")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">ICMS</dt>
                  <dd>{formatCurrency(quote.icms_total, "BRL")}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-300 pt-2 font-semibold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(quote.total, "BRL")}</dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliente</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <Link
                href={`/clientes/${quote.customer.id}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {quote.customer.company_name}
              </Link>
              <p className="text-slate-600">
                {[quote.customer.city, quote.customer.state]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </p>
              {quote.customer.document ? (
                <p className="text-slate-600">Doc: {quote.customer.document}</p>
              ) : null}
              {quote.customer.email ? (
                <p className="text-slate-600">{quote.customer.email}</p>
              ) : null}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Condições</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="text-slate-500">Frete:</span>{" "}
                {quote.metadata.freight}
              </p>
              <p>
                <span className="text-slate-500">Pagamento:</span>{" "}
                {quote.metadata.payment_terms}
              </p>
              {quote.notes ? (
                <p className="rounded-lg bg-amber-50 p-3 text-amber-900">
                  {quote.notes}
                </p>
              ) : null}
            </CardContent>
          </Card>

          <Link
            href="/cotacoes/nova"
            className="inline-flex text-sm font-medium text-brand-600 hover:underline"
          >
            + Nova cotação
          </Link>
        </div>
      </div>
    </div>
  );
}
