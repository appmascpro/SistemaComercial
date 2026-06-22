export type CustomerStatus = "ativo" | "inativo";
export type DocumentType = "cnpj" | "cpf";

export type CustomerType =
  | "formal"
  | "artesanal"
  | "revenda"
  | "fonte_indicacao";

export type LeadStatus = "frio" | "morno" | "quente" | "cliente";

export const CUSTOMER_TYPE_LABELS: Record<CustomerType, string> = {
  formal: "Formal",
  artesanal: "Artesanal",
  revenda: "Revenda",
  fonte_indicacao: "Fonte de indicação",
};

export const LEAD_STATUS_LABELS: Record<LeadStatus, string> = {
  frio: "Frio",
  morno: "Morno",
  quente: "Quente",
  cliente: "Cliente",
};

export const SEGMENT_SUGGESTIONS = [
  "Cosmético",
  "Pet",
  "Limpeza",
  "Bebidas",
] as const;

export const PRODUCT_INTEREST_SUGGESTIONS = [
  "Álcool",
  "Essência",
  "Base",
  "Laurel",
] as const;

export const PAIN_POINT_SUGGESTIONS = [
  "Preço",
  "Prazo",
  "Qualidade",
  "Falta de suporte",
] as const;

export interface CustomerListItem {
  id: string;
  company_name: string;
  trade_name: string | null;
  document: string | null;
  document_type: DocumentType | null;
  city: string | null;
  state: string | null;
  email: string | null;
  phone: string | null;
  segment: string | null;
  lead_status: LeadStatus | null;
  status: string;
  next_visit_at: string | null;
  created_at: string;
}

export interface CustomerDetail {
  id: string;
  company_name: string;
  trade_name: string | null;
  document: string | null;
  document_type: DocumentType | null;
  segment: string | null;
  customer_type: CustomerType | null;
  lead_status: LeadStatus | null;
  purchase_potential: string | null;
  potential_volume: string | null;
  products_of_interest: string | null;
  current_supplier: string | null;
  pain_point: string | null;
  buyer_name: string | null;
  buyer_phone: string | null;
  email: string | null;
  phone: string | null;
  address_line: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  country: string;
  status: string;
  notes: string | null;
  last_visit_at: string | null;
  next_visit_at: string | null;
  created_at: string;
  stats: {
    quotes_count: number;
    orders_count: number;
    samples_count: number;
    visits_count: number;
  };
}

export interface CustomerFormInput {
  company_name: string;
  trade_name?: string;
  document?: string;
  document_type?: DocumentType | "";
  segment?: string;
  customer_type?: CustomerType | "";
  lead_status?: LeadStatus | "";
  purchase_potential?: string;
  potential_volume?: string;
  products_of_interest?: string;
  current_supplier?: string;
  pain_point?: string;
  buyer_name?: string;
  buyer_phone?: string;
  email?: string;
  phone?: string;
  address_line?: string;
  address_number?: string;
  address_complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  notes?: string;
  status?: CustomerStatus;
}

export const BRAZILIAN_STATES = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA",
  "MT", "MS", "MG", "PA", "PB", "PR", "PE", "PI", "RJ", "RN",
  "RS", "RO", "RR", "SC", "SP", "SE", "TO",
] as const;

export interface CustomerVisitHistoryItem {
  id: string;
  visited_at: string;
  contact_type: string;
  conversation_summary: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  products_of_interest: string | null;
  next_action: string | null;
  next_action_date: string | null;
  notes: string | null;
  seller_name: string | null;
}

export interface CustomerSampleListItem {
  id: string;
  sample_number: string | null;
  status: string;
  sent_at: string | null;
  created_at: string;
}
