export type VisitContactType = "presencial" | "whatsapp";

export type VisitReportPeriod = "hoje" | "7d" | "15d" | "mes";

export const VISIT_NEXT_ACTIONS = [
  "Cotar",
  "Visitar",
  "Ligar",
  "Enviar amostra",
  "Enviar cotação",
  "Retornar WhatsApp",
] as const;

export type VisitResult =
  | "cotou"
  | "pediu"
  | "pediu_amostra"
  | "sem_interesse";

export interface VisitFormInput {
  customer_id: string;
  contact_type: VisitContactType;
  visited_at: string;
  conversation_summary: string;
  contact_person_name: string;
  contact_person_phone: string;
  next_action_date: string;
  products_of_interest?: string;
  pain_point?: string;
  current_supplier?: string;
  potential_volume?: string;
  next_action?: string;
  lead_status?: "frio" | "morno" | "quente" | "cliente" | "";
  visit_result?: VisitResult | "";
  route_id?: string;
  route_stop_id?: string;
  notes?: string;
}

export interface VisitListItem {
  id: string;
  visited_at: string;
  contact_type: VisitContactType;
  conversation_summary: string | null;
  contact_person_name: string | null;
  contact_person_phone: string | null;
  next_action_date: string | null;
  city: string | null;
  state: string | null;
  customer: {
    id: string;
    company_name: string;
    city: string | null;
    state: string | null;
  };
  seller: {
    id: string;
    full_name: string | null;
  } | null;
}

export interface VisitReportDayGroup {
  date: string;
  visits: VisitListItem[];
}

export interface VisitReportSummary {
  total: number;
  presencial: number;
  whatsapp: number;
}
