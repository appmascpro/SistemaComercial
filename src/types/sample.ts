export type SampleStatus =
  | "pendente"
  | "enviado"
  | "recebido"
  | "testando"
  | "aprovado"
  | "reprovado"
  | "cancelada";

export type SampleNextAction = "cotar" | "visitar" | "ligar" | "descartar";

export const SAMPLE_STATUS_LABELS: Record<SampleStatus, string> = {
  pendente: "Pendente",
  enviado: "Enviado",
  recebido: "Recebido",
  testando: "Testando",
  aprovado: "Aprovado",
  reprovado: "Reprovado",
  cancelada: "Cancelada",
};

export const SAMPLE_NEXT_ACTION_LABELS: Record<SampleNextAction, string> = {
  cotar: "Cotar",
  visitar: "Visitar",
  ligar: "Ligar",
  descartar: "Descartar",
};

export interface SampleListItem {
  id: string;
  sample_number: string | null;
  status: string;
  sent_at: string | null;
  follow_up_date: string | null;
  internal_cost: number | null;
  created_at: string;
  customer: {
    company_name: string;
    city: string | null;
    state: string | null;
  };
  items_count: number;
}

export interface SampleItemDetail {
  id: string;
  product_id: string;
  package_id: string | null;
  product_code: string;
  product_name: string;
  package_name: string | null;
  quantity: number;
  status: string;
  feedback: string | null;
}

export interface SampleDetail {
  id: string;
  sample_number: string | null;
  status: string;
  sent_at: string | null;
  delivered_at: string | null;
  feedback: string | null;
  feedback_at: string | null;
  follow_up_date: string | null;
  auto_follow_up: boolean;
  followups_scheduled: boolean;
  notes: string | null;
  carrier_id: string | null;
  carrier_name: string | null;
  tracking_code: string | null;
  internal_cost: number | null;
  next_action: SampleNextAction | null;
  created_at: string;
  customer: {
    id: string;
    company_name: string;
    trade_name: string | null;
    document: string | null;
    document_type: string | null;
    segment: string | null;
    email: string | null;
    phone: string | null;
    address_line: string | null;
    address_number: string | null;
    address_complement: string | null;
    neighborhood: string | null;
    city: string | null;
    state: string | null;
    zip_code: string | null;
  };
  carrier: {
    id: string;
    name: string;
    phone: string | null;
  } | null;
  items: SampleItemDetail[];
}

export interface SampleFormInput {
  customer_id: string;
  sent_at?: string;
  carrier_id?: string | null;
  carrier_name?: string;
  tracking_code?: string;
  internal_cost?: number | null;
  notes?: string;
  auto_follow_up?: boolean;
  items: Array<{
    product_id: string;
    package_id?: string | null;
    quantity: number;
  }>;
}

export interface SampleFeedbackInput {
  feedback?: string;
  next_action?: SampleNextAction | null;
  status?: SampleStatus;
}
