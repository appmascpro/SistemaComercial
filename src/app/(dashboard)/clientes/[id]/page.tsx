import Link from "next/link";
import { notFound } from "next/navigation";
import { FileText, Plus, ShoppingCart } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getCustomerById,
  getCustomerOrders,
  getCustomerQuotes,
} from "@/lib/customers/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function ClienteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [customer, quotes, orders] = await Promise.all([
    getCustomerById(id),
    getCustomerQuotes(id),
    getCustomerOrders(id),
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
          <Link
            href={`/cotacoes/nova?cliente=${customer.id}`}
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nova cotação
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
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
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-xl font-semibold capitalize">{customer.status}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <CustomerForm customer={customer} />
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                Cotações recentes
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
                        className="block rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
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
                Pedidos recentes
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
                        className="block rounded-lg border border-slate-100 p-2 hover:bg-slate-50"
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
        </div>
      </div>
    </div>
  );
}
