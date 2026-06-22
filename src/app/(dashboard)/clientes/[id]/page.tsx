import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, FlaskConical, Plus, ShoppingCart } from "lucide-react";
import { CustomerCommercialSummary } from "@/components/customers/customer-commercial-summary";
import { CustomerDetailTabs } from "@/components/customers/customer-detail-tabs";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCustomerById,
  getCustomerOrders,
  getCustomerQuotes,
  getCustomerSamples,
  getCustomerVisitHistory,
} from "@/lib/customers/queries";
import { LEAD_STATUS_LABELS, type LeadStatus } from "@/types/customer";
import { formatCurrency, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  frio: "text-sky-700",
  morno: "text-amber-700",
  quente: "text-orange-700",
  cliente: "text-emerald-700",
};

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, quotes, orders, samples, visits] = await Promise.all([
    getCustomerById(id),
    getCustomerQuotes(id),
    getCustomerOrders(id),
    getCustomerSamples(id),
    getCustomerVisitHistory(id),
  ]);

  if (!customer) notFound();

  return (
    <div>
      <PageHeader
        title={customer.company_name}
        description={
          [customer.city, customer.state].filter(Boolean).join(" / ") ||
          "Cliente cadastrado"
        }
        action={
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/cotacoes/nova?cliente=${customer.id}`}
              className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              Nova cotação
            </Link>
            <Link
              href={`/amostras/nova?cliente=${customer.id}`}
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <FlaskConical className="h-4 w-4" />
              Nova amostra
            </Link>
          </div>
        }
      />

      <div className="mb-6">
        <CustomerCommercialSummary customer={customer} />
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Cotações</p>
            <p className="text-xl font-semibold">{customer.stats.quotes_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Pedidos</p>
            <p className="text-xl font-semibold">{customer.stats.orders_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Amostras</p>
            <p className="text-xl font-semibold">{customer.stats.samples_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Contatos</p>
            <p className="text-xl font-semibold">{customer.stats.visits_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Status comercial</p>
            <p
              className={`text-xl font-semibold capitalize ${
                customer.lead_status
                  ? LEAD_STATUS_STYLES[customer.lead_status]
                  : "text-slate-700"
              }`}
            >
              {customer.lead_status
                ? LEAD_STATUS_LABELS[customer.lead_status]
                : "—"}
            </p>
            {customer.next_visit_at ? (
              <p className="mt-1 text-xs text-slate-500">
                Próxima: {formatDate(customer.next_visit_at + "T12:00:00")}
              </p>
            ) : null}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <CustomerDetailTabs customer={customer} visits={visits} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Cotações vinculadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {quotes.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma cotação ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {quotes.map((quote) => (
                    <li key={quote.id}>
                      <Link
                        href={`/cotacoes/${quote.id}`}
                        className="block rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
                      >
                        <p className="text-sm font-medium">{quote.quote_number}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(Number(quote.total), "BRL")} · {quote.status}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ShoppingCart className="h-4 w-4" />
                Pedidos vinculados
              </CardTitle>
            </CardHeader>
            <CardContent>
              {orders.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhum pedido ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {orders.map((order) => (
                    <li key={order.id}>
                      <Link
                        href={`/pedidos/${order.id}`}
                        className="block rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
                      >
                        <p className="text-sm font-medium">{order.order_number}</p>
                        <p className="text-xs text-slate-500">
                          {formatCurrency(Number(order.total), "BRL")} · {order.status}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FlaskConical className="h-4 w-4" />
                Amostras vinculadas
              </CardTitle>
            </CardHeader>
            <CardContent>
              {samples.length === 0 ? (
                <p className="text-sm text-slate-500">Nenhuma amostra ainda.</p>
              ) : (
                <ul className="space-y-2">
                  {samples.map((sample) => (
                    <li key={sample.id}>
                      <Link
                        href={`/amostras/${sample.id}`}
                        className="block rounded-lg border border-slate-300 p-2 hover:bg-slate-50"
                      >
                        <p className="text-sm font-medium">
                          {sample.sample_number ?? "Amostra"}
                        </p>
                        <p className="text-xs text-slate-500 capitalize">
                          {sample.status}
                          {sample.sent_at
                            ? ` · ${formatDate(sample.sent_at)}`
                            : ""}
                        </p>
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
