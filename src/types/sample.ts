export type SampleStatus =
  | "pendente"
  | "enviada"
  | "entregue"
  | "feedback_recebido"
  | "cancelada";

export interface SampleListItem {
  id: string;
  sample_number: string | null;
  status: string;
  sent_at: string | null;
  follow_up_date: string | null;
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
  notes: string | null;
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
  items: SampleItemDetail[];
}

export interface SampleFormInput {
  customer_id: string;
  notes?: string;
  follow_up_date?: string;
  auto_follow_up?: boolean;
  items: Array<{
    product_id: string;
    package_id?: string | null;
    quantity: number;
  }>;
}
