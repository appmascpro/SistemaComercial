export type OrderStatus =
  | "criado"
  | "confirmado"
  | "faturado"
  | "cancelado";

export interface OrderListItem {
  id: string;
  order_number: string;
  status: string;
  total: number;
  ordered_at: string | null;
  created_at: string;
  quote_id: string | null;
  customer: {
    company_name: string;
    city: string | null;
    state: string | null;
  };
  quote_number: string | null;
}

export interface OrderDetail {
  id: string;
  order_number: string;
  status: string;
  payment_terms: string | null;
  payment_method: string | null;
  subtotal: number;
  discount_total: number;
  icms_total: number;
  ipi_total: number;
  tax_total: number;
  total: number;
  ordered_at: string | null;
  notes: string | null;
  created_at: string;
  quote_id: string | null;
  quote_number: string | null;
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
  items: OrderItemDetail[];
}

export interface OrderItemDetail {
  id: string;
  product_id: string;
  product_code: string;
  product_name: string;
  package_name: string | null;
  quantity: number;
  unit_price: number;
  discount_percent: number;
  icms_rate: number;
  ipi_rate: number;
  line_total: number;
}
