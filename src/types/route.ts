export type RouteStatus = "planejada" | "em_andamento" | "concluida" | "cancelada";
export type RoutePriority = "baixa" | "normal" | "alta";
export type RouteStopStatus = "pendente" | "visitado" | "cancelado";

export interface RouteListItem {
  id: string;
  name: string;
  polo: string | null;
  city: string | null;
  state: string | null;
  priority: string;
  status: string;
  planned_date: string | null;
  stops_count: number;
  created_at: string;
}

export interface RouteStopDetail {
  id: string;
  stop_order: number;
  priority: string;
  status: string;
  planned_at: string | null;
  completed_at: string | null;
  notes: string | null;
  customer: {
    id: string;
    company_name: string;
    city: string | null;
    state: string | null;
    phone: string | null;
  };
}

export interface RouteDetail {
  id: string;
  name: string;
  polo: string | null;
  city: string | null;
  state: string | null;
  priority: string;
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
  planned_date?: string;
  priority?: RoutePriority;
  notes?: string;
  stops: Array<{
    customer_id: string;
    stop_order: number;
    priority?: RoutePriority;
    notes?: string;
  }>;
}
