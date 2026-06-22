import Link from "next/link";
import {
  COMMISSION_STATUS_LABELS,
  type CommissionStatus,
} from "@/types/commission";
import { MarkCommissionPaidButton } from "@/components/commissions/mark-commission-paid-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatDate, formatPercent } from "@/lib/utils";

export function OrderCommissionPanel({
  commission,
}: {
  commission: {
    id: string;
    status: CommissionStatus;
    seller_name: string;
    order_total: number;
    margin_percent: number;
    commission_rate: number;
    commission_amount: number;
    released_at: string | null;
    paid_at: string | null;
    cancelled_at: string | null;
  } | null;
}) {
  if (!commission) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Comissão do vendedor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Nenhuma comissão vinculada. Verifique se o pedido tem vendedor
            responsável.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Comissão do vendedor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <dl className="space-y-2">
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Vendedor</dt>
            <dd className="font-medium text-slate-900">
              {commission.seller_name}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Total do pedido</dt>
            <dd>{formatCurrency(commission.order_total, "BRL")}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Margem estimada</dt>
            <dd>{formatPercent(commission.margin_percent)}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Percentual</dt>
            <dd>{formatPercent(commission.commission_rate)}</dd>
          </div>
          <div className="flex justify-between gap-4 border-t border-slate-200 pt-2">
            <dt className="font-medium text-slate-700">Valor comissão</dt>
            <dd className="text-base font-semibold text-slate-900">
              {formatCurrency(commission.commission_amount, "BRL")}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-slate-500">Status</dt>
            <dd className="font-medium capitalize">
              {COMMISSION_STATUS_LABELS[commission.status]}
            </dd>
          </div>
          {commission.released_at ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Data de liberação</dt>
              <dd>{formatDate(commission.released_at)}</dd>
            </div>
          ) : null}
          {commission.paid_at ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Paga em</dt>
              <dd>{formatDate(commission.paid_at)}</dd>
            </div>
          ) : null}
          {commission.cancelled_at ? (
            <div className="flex justify-between gap-4">
              <dt className="text-slate-500">Cancelada em</dt>
              <dd>{formatDate(commission.cancelled_at)}</dd>
            </div>
          ) : null}
        </dl>

        <div className="flex flex-wrap gap-2 pt-1">
          {commission.status === "liberada" ||
          commission.status === "proporcional" ? (
            <MarkCommissionPaidButton commissionId={commission.id} />
          ) : null}
          <Link
            href="/comissoes"
            className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver todas
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}
