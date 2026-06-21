export type CustomerStatus = "ativo" | "inativo";
export type DocumentType = "cnpj" | "cpf";

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
  status: string;
  created_at: string;
}

export interface CustomerDetail {
  id: string;
  company_name: string;
  trade_name: string | null;
  document: string | null;
  document_type: DocumentType | null;
  segment: string | null;
  purchase_potential: string | null;
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
  created_at: string;
  stats: {
    quotes_count: number;
    orders_count: number;
  };
}

export interface CustomerFormInput {
  company_name: string;
  trade_name?: string;
  document?: string;
  document_type?: DocumentType | "";
  segment?: string;
  purchase_potential?: string;
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
