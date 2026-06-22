import {
  CUSTOMER_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  type CustomerDetail,
} from "@/types/customer";
import { formatDate } from "@/lib/utils";

export function CustomerKnownProfile({
  customer,
  compact = false,
}: {
  customer: CustomerDetail;
  compact?: boolean;
}) {
  const items = [
    customer.city && customer.state
      ? `${customer.city} / ${customer.state}`
      : customer.city ?? customer.state,
    customer.segment,
    customer.customer_type
      ? CUSTOMER_TYPE_LABELS[customer.customer_type]
      : null,
    customer.potential_volume ? `Volume: ${customer.potential_volume}` : null,
    customer.buyer_name ? `Comprador: ${customer.buyer_name}` : null,
    customer.buyer_phone ?? customer.phone
      ? `Tel: ${customer.buyer_phone ?? customer.phone}`
      : null,
    customer.current_supplier ? `Fornecedor: ${customer.current_supplier}` : null,
    customer.products_of_interest ? `Interesse: ${customer.products_of_interest}` : null,
    customer.pain_point ? `Dor: ${customer.pain_point}` : null,
    customer.lead_status ? LEAD_STATUS_LABELS[customer.lead_status] : null,
    customer.last_visit_at
      ? `Última visita: ${formatDate(customer.last_visit_at)}`
      : null,
    customer.next_visit_at
      ? `Próxima: ${formatDate(customer.next_visit_at + "T12:00:00")}`
      : null,
  ].filter(Boolean) as string[];

  if (items.length === 0) {
    return (
      <p className="text-xs text-amber-700">
        Primeira visita — preencha o perfil comercial abaixo.
      </p>
    );
  }

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-slate-50 ${
        compact ? "p-2" : "p-3"
      }`}
    >
      <p className="mb-2 text-xs font-medium text-slate-600">
        O que você já sabe — não repita na conversa
      </p>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => (
          <span
            key={item}
            className="rounded-full bg-white px-2 py-0.5 text-xs text-slate-700 ring-1 ring-slate-200"
          >
            {item}
          </span>
        ))}
      </div>
    </div>
  );
}
