"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  CustomerScorePanel,
  MarginReportPanel,
  PanoramaPanel,
  ProductsPanel,
  RegionHistoryPanel,
  RepurchasePanel,
  RouteConversionPanel,
  StalledAlertsPanel,
} from "@/components/intelligence/intelligence-panels";
import type {
  IntelligencePageData,
  IntelligencePeriod,
  IntelligenceTab,
} from "@/types/intelligence";

const TABS: { value: IntelligenceTab; label: string; period?: boolean }[] = [
  { value: "panorama", label: "Panorama", period: true },
  { value: "score", label: "Score cliente" },
  { value: "recompra", label: "Recompra" },
  { value: "alertas", label: "Alertas" },
  { value: "margem", label: "Margem", period: true },
  { value: "produtos", label: "Produtos", period: true },
  { value: "rotas", label: "Rotas", period: true },
  { value: "regiao", label: "Região", period: true },
];

const PERIODS: { value: IntelligencePeriod; label: string }[] = [
  { value: "30d", label: "30 dias" },
  { value: "90d", label: "90 dias" },
  { value: "180d", label: "6 meses" },
  { value: "365d", label: "12 meses" },
];

function tabHref(tab: IntelligenceTab, period: IntelligencePeriod) {
  const params = new URLSearchParams();
  if (tab !== "panorama") params.set("aba", tab);
  if (TABS.find((item) => item.value === tab)?.period) {
    params.set("periodo", period);
  }
  const query = params.toString();
  return query ? `/inteligencia?${query}` : "/inteligencia";
}

export function IntelligencePageClient({ data }: { data: IntelligencePageData }) {
  const showPeriod = TABS.find((item) => item.value === data.tab)?.period;

  return (
    <div className="space-y-4">
      <div className="flex gap-1 overflow-x-auto rounded-lg border border-slate-300 bg-slate-50 p-1">
        {TABS.map((item) => (
          <Link
            key={item.value}
            href={tabHref(item.value, data.period)}
            className={cn(
              "shrink-0 rounded-md px-3 py-2 text-center text-sm font-medium transition-colors",
              data.tab === item.value
                ? "bg-white text-brand-700 shadow-sm"
                : "text-slate-600 hover:text-slate-900"
            )}
          >
            {item.label}
          </Link>
        ))}
      </div>

      {showPeriod ? (
        <div className="flex flex-wrap gap-2">
          {PERIODS.map((item) => (
            <Link
              key={item.value}
              href={tabHref(data.tab, item.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                data.period === item.value
                  ? "bg-brand-600 text-white"
                  : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
              )}
            >
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}

      {data.tab === "panorama" && data.panorama ? (
        <PanoramaPanel data={data.panorama} />
      ) : null}

      {data.tab === "score" && data.customerScores ? (
        <CustomerScorePanel scores={data.customerScores} />
      ) : null}

      {data.tab === "recompra" && data.repurchase ? (
        <RepurchasePanel suggestions={data.repurchase} />
      ) : null}

      {data.tab === "alertas" && data.alerts ? (
        <StalledAlertsPanel alerts={data.alerts} />
      ) : null}

      {data.tab === "margem" && data.margin ? (
        <MarginReportPanel
          summary={data.margin.summary}
          rows={data.margin.rows}
        />
      ) : null}

      {data.tab === "produtos" &&
      data.quotedProducts &&
      data.soldProducts ? (
        <ProductsPanel quoted={data.quotedProducts} sold={data.soldProducts} />
      ) : null}

      {data.tab === "rotas" && data.routeConversion ? (
        <RouteConversionPanel routes={data.routeConversion} />
      ) : null}

      {data.tab === "regiao" && data.regionHistory ? (
        <RegionHistoryPanel regions={data.regionHistory} />
      ) : null}
    </div>
  );
}
