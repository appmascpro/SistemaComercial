import Link from "next/link";
import {
  COMMISSION_STATUS_LABELS,
  type CommissionListItem,
} from "@/types/commission";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";
import { MarkCommissionPaidButton } from "@/components/commissions/mark-commission-paid-button";

const statusStyles: Record<string, string> = {
  prevista: "bg-blue-50 text-blue-700",
  pendente: "bg-amber-50 text-amber-700",
  proporcional: "bg-purple-50 text-purple-700",
  liberada: "bg-emerald-50 text-emerald-700",
  paga: "bg-slate-100 text-slate-700",
  cancelada: "bg-red-50 text-red-700",
};

export function CommissionsTable({
  commissions,
}: {
  commissions: CommissionListItem[];
}) {
  if (commissions.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Nenhuma comissão encontrada para este filtro. Comissões são geradas ao
        converter cotações em{" "}
        <Link href="/pedidos" className="text-brand-600 hover:underline">
          pedidos
        </Link>
        .
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Pedido
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Vendedor
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Cliente
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Total
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Margem
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              %
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Comissão
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Status
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Liberação
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Ações
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {commissions.map((row) => (
            <tr key={row.id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2">
                <Link
                  href={`/pedidos/${row.order_id}`}
                  className="font-mono text-xs font-medium text-brand-600 hover:underline"
                >
                  {row.order_number}
                </Link>
                <p className="text-xs capitalize text-slate-500">
                  {row.order_status}
                </p>
              </td>
              <td className="px-3 py-2 font-medium text-slate-900">
                {row.seller_name}
              </td>
              <td className="px-3 py-2 text-slate-600">{row.customer_name}</td>
              <td className="px-3 py-2 text-right">
                {formatCurrency(row.order_total, "BRL")}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPercent(row.margin_percent)}
              </td>
              <td className="px-3 py-2 text-right">
                {formatPercent(row.commission_rate)}
              </td>
              <td className="px-3 py-2 text-right font-semibold text-slate-900">
                {formatCurrency(row.commission_amount, "BRL")}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusStyles[row.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {COMMISSION_STATUS_LABELS[row.status]}
                </span>
              </td>
              <td className="px-3 py-2 text-slate-600">
                {row.paid_at
                  ? `Paga ${formatDate(row.paid_at)}`
                  : row.released_at
                    ? formatDate(row.released_at)
                    : "—"}
              </td>
              <td className="px-3 py-2 text-right">
                {row.status === "liberada" || row.status === "proporcional" ? (
                  <MarkCommissionPaidButton commissionId={row.id} />
                ) : (
                  <Link
                    href={`/pedidos/${row.order_id}`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Ver pedido
                  </Link>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
