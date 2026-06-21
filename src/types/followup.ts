export type FollowupStatus = "pendente" | "concluido" | "cancelado";

export type FollowupReportPeriod = "hoje" | "7d" | "15d" | "mes" | "atrasados";

export interface OrderFollowupItem {
  id: string;
  title: string | null;
  notes: string | null;
  status: FollowupStatus;
  due_at: string;
  completed_at: string | null;
  created_at: string;
  order: {
    id: string;
    order_number: string;
    status: string;
  };
  customer: {
    id: string;
    company_name: string;
    city: string | null;
    state: string | null;
    phone: string | null;
  };
}

export interface FollowupDayGroup {
  date: string;
  items: OrderFollowupItem[];
}

export interface FollowupReportSummary {
  total: number;
  pendentes: number;
  concluidos: number;
  atrasados: number;
}
