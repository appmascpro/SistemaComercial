import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { OrderListItem } from "@/types/order";

const statusStyles: Record<string, string> = {
  criado: "bg-blue-50 text-blue-700",
  confirmado: "bg-amber-50 text-amber-700",
  faturado: "bg-emerald-50 text-emerald-700",
  cancelado: "bg-red-50 text-red-700",
};

export function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  if (orders.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Nenhum pedido registrado. Converta uma{" "}
        <Link href="/cotacoes" className="text-brand-600 hover:underline">
          cotação aprovada
        </Link>{" "}
        em pedido.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Pedido</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Cliente</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Cotação</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Data</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Total</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {orders.map((order) => (
            <tr key={order.id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2 font-mono text-xs text-slate-700">
                {order.order_number}
              </td>
              <td className="px-3 py-2">
                <p className="font-medium text-slate-900">
                  {order.customer.company_name}
                </p>
                <p className="text-xs text-slate-500">
                  {[order.customer.city, order.customer.state]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </td>
              <td className="px-3 py-2 text-slate-600">
                {order.quote_number ?? "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {formatDate(order.ordered_at ?? order.created_at)}
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {formatCurrency(order.total, "BRL")}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    statusStyles[order.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {order.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/pedidos/${order.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
