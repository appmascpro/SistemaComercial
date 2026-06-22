export type RouteStatus = "planejada" | "em_andamento" | "concluida" | "cancelada";
export type RouteStopPriority = "A" | "B" | "C";
export type RouteStopStatus = "planejado" | "visitado" | "reagendar";

export type VisitResult =
  | "cotou"
  | "pediu"
  | "pediu_amostra"
  | "sem_interesse";

export const ROUTE_POLO_OPTIONS = [
  "Marília",
  "Assis",
  "Bauru",
  "Tupã",
  "Ourinhos",
  "Jaú",
  "Botucatu",
] as const;

export const ROUTE_STOP_PRIORITY_LABELS: Record<RouteStopPriority, string> = {
  A: "Prioridade A",
  B: "Prioridade B",
  C: "Prioridade C",
};

export const ROUTE_STOP_STATUS_LABELS: Record<RouteStopStatus, string> = {
  planejado: "Planejado",
  visitado: "Visitado",
  reagendar: "Reagendar",
};

export const VISIT_RESULT_LABELS: Record<VisitResult, string> = {
  cotou: "Cotou",
  pediu: "Pediu",
  pediu_amostra: "Pediu amostra",
  sem_interesse: "Sem interesse",
};

export const ROUTE_STOP_PRIORITY_ORDER: Record<RouteStopPriority, number> = {
  A: 0,
  B: 1,
  C: 2,
};

export interface RouteListItem {
  id: string;
  name: string;
  polo: string | null;
  city: string | null;
  state: string | null;
  week_number: number | null;
  status: string;
  planned_date: string | null;
  stops_count: number;
  visited_count: number;
  created_at: string;
}

export interface RouteStopDetail {
  id: string;
  stop_order: number;
  priority: string;
  status: string;
  planned_at: string | null;
  completed_at: string | null;
  visit_id: string | null;
  notes: string | null;
  city: string | null;
  state: string | null;
  customer: {
    id: string;
    company_name: string;
    city: string | null;
    state: string | null;
    phone: string | null;
    buyer_name: string | null;
    buyer_phone: string | null;
    lead_status: string | null;
    products_of_interest: string | null;
    pain_point: string | null;
    current_supplier: string | null;
    potential_volume: string | null;
    next_visit_at: string | null;
  };
}

export interface RouteDetail {
  id: string;
  name: string;
  polo: string | null;
  city: string | null;
  state: string | null;
  week_number: number | null;
  status: string;
  planned_date: string | null;
  started_at: string | null;
  finished_at: string | null;
  notes: string | null;
  created_at: string;
  stops: RouteStopDetail[];
}

export interface RouteFormInput {
  name: string;
  polo?: string;
  city?: string;
  state?: string;
  week_number?: number | null;
  planned_date?: string;
  notes?: string;
  stops: Array<{
    customer_id: string;
    stop_order: number;
    priority?: RouteStopPriority;
    planned_at?: string;
    notes?: string;
  }>;
}

export interface TodayRouteCityGroup {
  cityKey: string;
  city: string;
  state: string | null;
  stops: Array<
    RouteStopDetail & {
      route_id: string;
      route_name: string;
      route_polo: string | null;
      week_number: number | null;
    }
  >;
}

export interface TodayRoutesExecution {
  date: string;
  routes: RouteDetail[];
  cityGroups: TodayRouteCityGroup[];
  summary: {
    total_stops: number;
    visited: number;
    planned: number;
    reschedule: number;
  };
}
