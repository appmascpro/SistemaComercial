export type QuoteStatus = "aberta" | "enviada" | "aprovada" | "recusada" | "expirada";

export interface QuoteListItem {
  id: string;
  quote_number: string;
  status: string;
  valid_until: string | null;
  total: number;
  created_at: string;
  customer: {
    company_name: string;
    city: string | null;
    state: string | null;
  };
}

export interface QuoteItemInput {
  product_id: string;
  package_id?: string | null;
  quantity: number;
  discount_percent: number;
}

export interface QuoteFormInput {
  customer_id: string;
  valid_until?: string;
  notes?: string;
  items: QuoteItemInput[];
}

export interface ResolvedQuoteItem {
  product_id: string;
  package_id: string | null;
  product_code: string;
  product_name: string;
  package_name: string | null;
  quantity: number;
  unit_price: number;
  min_price: number | null;
  max_price: number | null;
  discount_percent: number;
  discount_amount: number;
  icms_rate: number;
  icms_amount: number;
  ipi_rate: number;
  ipi_amount: number;
  line_subtotal: number;
  line_total: number;
  sort_order: number;
}

export interface QuoteMetadata {
  ptax: number;
  freight: string;
  payment_terms: string;
}

export interface QuoteDetail {
  id: string;
  quote_number: string;
  status: string;
  valid_until: string | null;
  customer_state: string | null;
  notes: string | null;
  subtotal: number;
  discount_total: number;
  icms_total: number;
  ipi_total: number;
  tax_total: number;
  total: number;
  created_at: string;
  metadata: QuoteMetadata;
  customer: {
    id: string;
    company_name: string;
    trade_name: string | null;
    document: string | null;
    email: string | null;
    phone: string | null;
    city: string | null;
    state: string | null;
  };
  items: Array<
    ResolvedQuoteItem & {
      id: string;
    }
  >;
}

export interface ProductSearchResult {
  id: string;
  internal_code: string;
  commercial_name: string;
  description: string | null;
  inci_name: string | null;
  unit: string;
  price_brl_display: number | null;
  pricing_currency: "USD" | "BRL";
  packages: Array<{
    id: string;
    name: string;
    is_default: boolean;
  }>;
}

export interface CustomerSearchResult {
  id: string;
  company_name: string;
  city: string | null;
  state: string | null;
  document: string | null;
}
