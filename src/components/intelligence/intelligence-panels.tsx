import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LEAD_STATUS_LABELS } from "@/types/customer";
import type {
  CustomerScoreItem,
  IntelligencePanorama,
  MarginReportRow,
  MarginReportSummary,
  ProductRankingItem,
  RegionHistoryItem,
  RepurchaseSuggestion,
  RouteConversionItem,
  StalledAlert,
} from "@/types/intelligence";
import {
  formatCurrency,
  formatDate,
  formatPercent,
  formatQuantity,
} from "@/lib/utils";

const GRADE_STYLES: Record<string, string> = {
  A: "bg-emerald-50 text-emerald-700",
  B: "bg-blue-50 text-blue-700",
  C: "bg-amber-50 text-amber-700",
  D: "bg-red-50 text-red-700",
};

const ALERT_KIND_LABELS: Record<StalledAlert["kind"], string> = {
  sem_contato: "Sem contato",
  visita_atrasada: "Visita atrasada",
  cotacao_parada: "Cotação parada",
  lead_esfriando: "Lead esfriando",
  followup_atrasado: "Follow-up atrasado",
};

export function PanoramaPanel({ data }: { data: IntelligencePanorama }) {
  const cards = [
    {
      label: "Score médio clientes",
      value: String(data.avg_customer_score),
      hint: `${data.customers_grade_a} clientes nota A`,
    },
    {
      label: "Recompras sugeridas",
      value: String(data.repurchase_pending),
      hint: "Clientes fora do ciclo",
    },
    {
      label: "Alertas ativos",
      value: String(data.stalled_alerts_count),
      hint: "Requerem ação",
    },
    {
      label: "Margem média",
      value: formatPercent(data.avg_margin_percent),
      hint: "Pedidos faturados",
    },
    {
      label: "Produto mais cotado",
      value: data.top_quoted_product ?? "—",
      hint: "No período",
    },
    {
      label: "Produto mais vendido",
      value: data.top_sold_product ?? "—",
      hint: "No período",
    },
    {
      label: "Melhor rota",
      value: data.best_route_name ?? "—",
      hint: "Maior conversão",
    },
    {
      label: "Região destaque",
      value: data.top_region_name ?? "—",
      hint: "Maior faturamento",
    },
  ];

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">{card.label}</p>
            <p className="mt-1 line-clamp-2 text-lg font-semibold text-slate-900">
              {card.value}
            </p>
            <p className="mt-1 text-xs text-slate-500">{card.hint}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function CustomerScorePanel({
  scores,
}: {
  scores: CustomerScoreItem[];
}) {
  if (scores.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Nenhum cliente ativo para calcular score.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Cliente
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Cidade
            </th>
            <th className="px-3 py-2 text-center font-medium text-slate-600">
              Score
            </th>
            <th className="px-3 py-2 text-center font-medium text-slate-600">
              Nota
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Lead
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Pedidos
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Último pedido
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Última visita
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {scores.map((row) => (
            <tr key={row.customer_id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2">
                <Link
                  href={`/clientes/${row.customer_id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {row.company_name}
                </Link>
              </td>
              <td className="px-3 py-2 text-slate-600">
                {[row.city, row.state].filter(Boolean).join(" / ") || "—"}
              </td>
              <td className="px-3 py-2 text-center font-semibold">
                {row.score}
              </td>
              <td className="px-3 py-2 text-center">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-bold ${
                    GRADE_STYLES[row.grade]
                  }`}
                >
                  {row.grade}
                </span>
              </td>
              <td className="px-3 py-2 capitalize text-slate-600">
                {row.lead_status
                  ? LEAD_STATUS_LABELS[row.lead_status]
                  : "—"}
              </td>
              <td className="px-3 py-2 text-right">{row.orders_count}</td>
              <td className="px-3 py-2 text-slate-600">
                {row.last_order_at ? formatDate(row.last_order_at) : "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {row.last_visit_at ? formatDate(row.last_visit_at) : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RepurchasePanel({
  suggestions,
}: {
  suggestions: RepurchaseSuggestion[];
}) {
  if (suggestions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Nenhuma sugestão de recompra no momento. Clientes estão dentro do ciclo
        habitual.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      {suggestions.map((row) => (
        <Card key={row.customer_id}>
          <CardContent className="flex flex-wrap items-start justify-between gap-3 pt-4">
            <div>
              <Link
                href={`/clientes/${row.customer_id}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {row.company_name}
              </Link>
              <p className="text-xs text-slate-500">
                {[row.city].filter(Boolean).join(" · ") || "—"}
              </p>
              <p className="mt-2 text-sm text-slate-600">
                Último pedido há{" "}
                <strong>{row.days_since_last_order} dias</strong>
                {row.avg_reorder_days
                  ? ` · ciclo médio ${row.avg_reorder_days} dias`
                  : ""}
              </p>
              {row.suggested_products.length > 0 ? (
                <p className="mt-1 text-sm text-slate-600">
                  Sugestão: {row.suggested_products.join(", ")}
                </p>
              ) : null}
            </div>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                row.urgency === "alta"
                  ? "bg-red-50 text-red-700"
                  : "bg-amber-50 text-amber-700"
              }`}
            >
              Urgência {row.urgency}
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function StalledAlertsPanel({ alerts }: { alerts: StalledAlert[] }) {
  if (alerts.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Nenhum alerta de cliente parado. Carteira em dia.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-slate-300 bg-white px-4 py-3"
        >
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span
                className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  alert.severity === "alta"
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
              >
                {alert.severity === "alta" ? "Alta" : "Média"}
              </span>
              <span className="text-xs text-slate-500">
                {ALERT_KIND_LABELS[alert.kind]}
              </span>
            </div>
            <Link
              href={`/clientes/${alert.customer_id}`}
              className="mt-1 block font-medium text-brand-600 hover:underline"
            >
              {alert.company_name}
            </Link>
            <p className="text-sm text-slate-600">{alert.message}</p>
          </div>
          {alert.reference_date ? (
            <p className="text-xs text-slate-500">
              {formatDate(alert.reference_date)}
            </p>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function MarginReportPanel({
  summary,
  rows,
}: {
  summary: MarginReportSummary;
  rows: MarginReportRow[];
}) {
  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Pedidos faturados</p>
            <p className="text-lg font-semibold">{summary.order_count}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Receita</p>
            <p className="text-lg font-semibold">
              {formatCurrency(summary.total_revenue, "BRL")}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Margem média</p>
            <p className="text-lg font-semibold">
              {formatPercent(summary.avg_margin_percent)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <p className="text-xs text-slate-500">Margem baixa (&lt;15%)</p>
            <p className="text-lg font-semibold text-amber-700">
              {summary.low_margin_count}
            </p>
          </CardContent>
        </Card>
      </div>

      {rows.length === 0 ? (
        <p className="py-6 text-center text-sm text-slate-500">
          Nenhum pedido faturado no período.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="min-w-full divide-y divide-slate-300 text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Pedido
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Cliente
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Vendedor
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">
                  Total
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">
                  Margem
                </th>
                <th className="px-3 py-2 text-right font-medium text-slate-600">
                  Comissão %
                </th>
                <th className="px-3 py-2 text-left font-medium text-slate-600">
                  Faturado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-300 bg-white">
              {rows.map((row) => (
                <tr key={row.order_id} className="hover:bg-slate-50/80">
                  <td className="px-3 py-2">
                    <Link
                      href={`/pedidos/${row.order_id}`}
                      className="font-mono text-xs text-brand-600 hover:underline"
                    >
                      {row.order_number}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{row.customer_name}</td>
                  <td className="px-3 py-2">{row.seller_name}</td>
                  <td className="px-3 py-2 text-right">
                    {formatCurrency(row.order_total, "BRL")}
                  </td>
                  <td
                    className={`px-3 py-2 text-right font-medium ${
                      row.margin_percent < 15
                        ? "text-amber-700"
                        : "text-slate-900"
                    }`}
                  >
                    {formatPercent(row.margin_percent)}
                  </td>
                  <td className="px-3 py-2 text-right">
                    {formatPercent(row.commission_rate)}
                  </td>
                  <td className="px-3 py-2 text-slate-600">
                    {row.invoiced_at ? formatDate(row.invoiced_at) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function ProductRankingTable({
  title,
  items,
}: {
  title: string;
  items: ProductRankingItem[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {items.length === 0 ? (
          <p className="text-sm text-slate-500">Sem dados no período.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-xs text-slate-600">
                  <th className="pb-2 pr-3">Produto</th>
                  <th className="pb-2 pr-3 text-right">Ocorrências</th>
                  <th className="pb-2 pr-3 text-right">Qtd</th>
                  <th className="pb-2 text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {items.map((row, index) => (
                  <tr key={row.product_id}>
                    <td className="py-2 pr-3">
                      <span className="mr-2 text-xs text-slate-400">
                        #{index + 1}
                      </span>
                      <span className="font-medium">{row.product_name}</span>
                      {row.product_code ? (
                        <span className="ml-1 text-xs text-slate-500">
                          ({row.product_code})
                        </span>
                      ) : null}
                    </td>
                    <td className="py-2 pr-3 text-right">{row.quote_count}</td>
                    <td className="py-2 pr-3 text-right">
                      {formatQuantity(row.quantity)}
                    </td>
                    <td className="py-2 text-right">
                      {formatCurrency(row.total_value, "BRL")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function ProductsPanel({
  quoted,
  sold,
}: {
  quoted: ProductRankingItem[];
  sold: ProductRankingItem[];
}) {
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <ProductRankingTable title="Produtos mais cotados" items={quoted} />
      <ProductRankingTable title="Produtos mais vendidos" items={sold} />
    </div>
  );
}

export function RouteConversionPanel({
  routes,
}: {
  routes: RouteConversionItem[];
}) {
  if (routes.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Nenhuma rota no período selecionado.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Rota
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Data
            </th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Polo
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Paradas
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Visitadas
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Positivas
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Pedidos
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Execução
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Conversão
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {routes.map((row) => (
            <tr key={row.route_id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2">
                <Link
                  href={`/rotas/${row.route_id}`}
                  className="font-medium text-brand-600 hover:underline"
                >
                  {row.route_name}
                </Link>
              </td>
              <td className="px-3 py-2 text-slate-600">
                {formatDate(row.planned_date)}
              </td>
              <td className="px-3 py-2 text-slate-600">{row.polo ?? "—"}</td>
              <td className="px-3 py-2 text-right">{row.stops_total}</td>
              <td className="px-3 py-2 text-right">{row.stops_visited}</td>
              <td className="px-3 py-2 text-right">{row.positive_visits}</td>
              <td className="px-3 py-2 text-right">{row.orders_generated}</td>
              <td className="px-3 py-2 text-right">
                {row.visit_rate_percent}%
              </td>
              <td className="px-3 py-2 text-right font-semibold">
                {row.conversion_rate_percent}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function RegionHistoryPanel({
  regions,
}: {
  regions: RegionHistoryItem[];
}) {
  if (regions.length === 0) {
    return (
      <p className="py-8 text-center text-sm text-slate-500">
        Sem histórico por região no período.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">
              Região
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Clientes
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Visitas
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Cotações
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Valor cotado
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Pedidos
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Valor vendido
            </th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">
              Conversão
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {regions.map((row) => (
            <tr key={row.region_slug} className="hover:bg-slate-50/80">
              <td className="px-3 py-2">
                <p className="font-medium text-slate-900">{row.region_name}</p>
                {row.expansion_priority ? (
                  <p className="text-xs text-slate-500">
                    Prioridade {row.expansion_priority}
                  </p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-right">{row.customers_count}</td>
              <td className="px-3 py-2 text-right">{row.visits_count}</td>
              <td className="px-3 py-2 text-right">{row.quotes_count}</td>
              <td className="px-3 py-2 text-right">
                {formatCurrency(row.quotes_value, "BRL")}
              </td>
              <td className="px-3 py-2 text-right">{row.orders_count}</td>
              <td className="px-3 py-2 text-right font-medium">
                {formatCurrency(row.orders_value, "BRL")}
              </td>
              <td className="px-3 py-2 text-right">
                {row.conversion_rate_percent}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
