import type { LeadStatus } from "@/types/customer";

export type IntelligencePeriod = "30d" | "90d" | "180d" | "365d";

export type IntelligenceTab =
  | "panorama"
  | "score"
  | "recompra"
  | "alertas"
  | "margem"
  | "produtos"
  | "rotas"
  | "regiao";

export interface CustomerScoreItem {
  customer_id: string;
  company_name: string;
  city: string | null;
  state: string | null;
  lead_status: LeadStatus | null;
  score: number;
  grade: "A" | "B" | "C" | "D";
  orders_count: number;
  last_order_at: string | null;
  last_visit_at: string | null;
  open_quotes: number;
}

export interface RepurchaseSuggestion {
  customer_id: string;
  company_name: string;
  city: string | null;
  last_order_at: string;
  days_since_last_order: number;
  avg_reorder_days: number | null;
  suggested_products: string[];
  urgency: "alta" | "media";
}

export type StalledAlertKind =
  | "sem_contato"
  | "visita_atrasada"
  | "cotacao_parada"
  | "lead_esfriando"
  | "followup_atrasado";

export interface StalledAlert {
  id: string;
  kind: StalledAlertKind;
  customer_id: string;
  company_name: string;
  city: string | null;
  message: string;
  severity: "alta" | "media";
  reference_date: string | null;
}

export interface MarginReportRow {
  order_id: string;
  order_number: string;
  customer_name: string;
  seller_name: string;
  order_total: number;
  margin_percent: number;
  commission_rate: number;
  invoiced_at: string | null;
}

export interface MarginReportSummary {
  order_count: number;
  total_revenue: number;
  avg_margin_percent: number;
  low_margin_count: number;
}

export interface ProductRankingItem {
  product_id: string;
  product_name: string;
  product_code: string | null;
  quote_count: number;
  quantity: number;
  total_value: number;
}

export interface RouteConversionItem {
  route_id: string;
  route_name: string;
  polo: string | null;
  planned_date: string;
  stops_total: number;
  stops_visited: number;
  positive_visits: number;
  orders_generated: number;
  visit_rate_percent: number;
  conversion_rate_percent: number;
}

export interface RegionHistoryItem {
  region_slug: string;
  region_name: string;
  expansion_priority: number | null;
  customers_count: number;
  visits_count: number;
  quotes_count: number;
  quotes_value: number;
  orders_count: number;
  orders_value: number;
  conversion_rate_percent: number;
}

export interface IntelligencePanorama {
  avg_customer_score: number;
  customers_grade_a: number;
  repurchase_pending: number;
  stalled_alerts_count: number;
  avg_margin_percent: number;
  top_quoted_product: string | null;
  top_sold_product: string | null;
  best_route_name: string | null;
  top_region_name: string | null;
}

export interface IntelligencePageData {
  tab: IntelligenceTab;
  period: IntelligencePeriod;
  panorama?: IntelligencePanorama;
  customerScores?: CustomerScoreItem[];
  repurchase?: RepurchaseSuggestion[];
  alerts?: StalledAlert[];
  margin?: { summary: MarginReportSummary; rows: MarginReportRow[] };
  quotedProducts?: ProductRankingItem[];
  soldProducts?: ProductRankingItem[];
  routeConversion?: RouteConversionItem[];
  regionHistory?: RegionHistoryItem[];
}
