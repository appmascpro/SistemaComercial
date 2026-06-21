import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, FileText, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { OrderStatusSelect } from "@/components/orders/order-status-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { OrderFollowupsPanel } from "@/components/followups/order-followups-panel";
import { canEditOrder } from "@/lib/edit/status";
import { getOrderFollowupsByOrderId } from "@/lib/followups/queries";
import { getOrderById } from "@/lib/orders/queries";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatQuantity,
} from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PedidoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  const followups = await getOrderFollowupsByOrderId(id);

  const editable = canEditOrder(order);

  return (
    <div>
      <PageHeader
        title={order.order_number}
        description={`Pedido de ${order.customer.company_name} · ${formatDate(order.ordered_at ?? order.created_at)}`}
        action={
          <div className="flex flex-wrap gap-2">
            {editable ? (
              <Link
                href={`/pedidos/${order.id}/editar`}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            ) : null}
            {order.quote_id ? (
              <Link
                href={`/cotacoes/${order.quote_id}/pdf`}
                className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
              >
                <FileDown className="h-4 w-4" />
                Ver PDF
              </Link>
            ) : null}
            <OrderStatusSelect orderId={order.id} currentStatus={order.status} />
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Total</p>
            <p className="text-xl font-semibold text-slate-900">
              {formatCurrency(order.total, "BRL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Status</p>
            <p className="text-xl font-semibold capitalize text-slate-900">
              {order.status}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Pagamento</p>
            <p className="text-sm font-semibold text-slate-900">
              {order.payment_terms ?? "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Cotação origem</p>
            {order.quote_id ? (
              <Link
                href={`/cotacoes/${order.quote_id}`}
                className="text-sm font-semibold text-brand-600 hover:underline"
              >
                {order.quote_number}
              </Link>
            ) : (
              <p className="text-sm font-semibold text-slate-900">—</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Itens do pedido</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-left text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2">Produto</th>
                    <th className="px-3 py-2">Emb.</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2 text-right">Unit.</th>
                    <th className="px-3 py-2 text-right">Desc.</th>
                    <th className="px-3 py-2 text-right">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {order.items.map((item) => (
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
                      <td className="px-3 py-2 text-right">
                        {formatCurrency(item.unit_price, "BRL")}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatPercent(item.discount_percent)}
                      </td>
                      <td className="px-3 py-2 text-right font-medium">
                        {formatCurrency(item.line_total, "BRL")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="mt-4 flex justify-end">
              <dl className="w-full max-w-xs space-y-1 text-sm">
                <div className="flex justify-between">
                  <dt className="text-slate-500">Subtotal</dt>
                  <dd>{formatCurrency(order.subtotal, "BRL")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">IPI</dt>
                  <dd>{formatCurrency(order.ipi_total, "BRL")}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">ICMS</dt>
                  <dd>{formatCurrency(order.icms_total, "BRL")}</dd>
                </div>
                <div className="flex justify-between border-t border-slate-200 pt-2 font-semibold">
                  <dt>Total</dt>
                  <dd>{formatCurrency(order.total, "BRL")}</dd>
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
                href={`/clientes/${order.customer.id}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {order.customer.company_name}
              </Link>
              <p className="text-slate-600">
                {[order.customer.city, order.customer.state]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </p>
              {order.customer.document ? (
                <p className="text-slate-600">Doc: {order.customer.document}</p>
              ) : null}
            </CardContent>
          </Card>

          {order.notes ? (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <FileText className="h-4 w-4" />
                  Observações
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{order.notes}</p>
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Follow-ups do pedido</CardTitle>
            </CardHeader>
            <CardContent>
              <OrderFollowupsPanel
                compact
                groups={[
                  {
                    date: new Date().toISOString().slice(0, 10),
                    items: followups,
                  },
                ]}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
