export type CommissionStatus =
  | "prevista"
  | "pendente"
  | "proporcional"
  | "liberada"
  | "cancelada"
  | "paga";

export const COMMISSION_STATUS_LABELS: Record<CommissionStatus, string> = {
  prevista: "Prevista",
  pendente: "Pendente",
  proporcional: "Proporcional",
  liberada: "Liberada",
  cancelada: "Cancelada",
  paga: "Paga",
};

export interface CommissionListItem {
  id: string;
  status: CommissionStatus;
  order_id: string;
  order_number: string;
  order_status: string;
  seller_id: string;
  seller_name: string;
  order_total: number;
  margin_percent: number;
  commission_rate: number;
  commission_amount: number;
  released_at: string | null;
  paid_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  customer_name: string;
}

export interface CommissionSummary {
  prevista: number;
  pendente: number;
  proporcional: number;
  liberada: number;
  paga: number;
  cancelada: number;
  total_open: number;
}
