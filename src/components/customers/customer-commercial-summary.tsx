import { Calendar, Flame } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  CUSTOMER_TYPE_LABELS,
  LEAD_STATUS_LABELS,
  type CustomerDetail,
  type LeadStatus,
} from "@/types/customer";
import { formatDate } from "@/lib/utils";

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  frio: "bg-sky-50 text-sky-700",
  morno: "bg-amber-50 text-amber-700",
  quente: "bg-orange-50 text-orange-700",
  cliente: "bg-emerald-50 text-emerald-700",
};

function Field({
  label,
  value,
}: {
  label: string;
  value: string | null | undefined;
}) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-900">{value?.trim() || "—"}</p>
    </div>
  );
}

export function CustomerCommercialSummary({
  customer,
}: {
  customer: CustomerDetail;
}) {
  const leadStatus = customer.lead_status;

  return (
    <Card className="border-brand-200 bg-brand-50/30">
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <CardTitle className="text-base">Resumo comercial</CardTitle>
          {leadStatus ? (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                LEAD_STATUS_STYLES[leadStatus]
              }`}
            >
              <Flame className="h-3 w-3" />
              {LEAD_STATUS_LABELS[leadStatus]}
            </span>
          ) : null}
        </div>
        <p className="text-xs text-slate-600">
          Consulte antes da visita — não repita perguntas que o cliente já respondeu.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Field
            label="Cidade"
            value={
              [customer.city, customer.state].filter(Boolean).join(" / ") || null
            }
          />
          <Field label="Segmento" value={customer.segment} />
          <Field
            label="Tipo"
            value={
              customer.customer_type
                ? CUSTOMER_TYPE_LABELS[customer.customer_type]
                : null
            }
          />
          <Field label="Volume potencial" value={customer.potential_volume} />
          <Field label="Comprador" value={customer.buyer_name} />
          <Field label="WhatsApp / telefone" value={customer.buyer_phone ?? customer.phone} />
          <Field label="Fornecedor atual" value={customer.current_supplier} />
          <Field label="Produtos de interesse" value={customer.products_of_interest} />
          <Field label="Dor / necessidade" value={customer.pain_point} />
        </div>

        <div className="flex flex-wrap gap-4 border-t border-brand-100 pt-4 text-sm">
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              <strong>Última visita:</strong>{" "}
              {customer.last_visit_at
                ? formatDate(customer.last_visit_at)
                : "Nunca registrada"}
            </span>
          </div>
          <div className="flex items-center gap-2 text-slate-700">
            <Calendar className="h-4 w-4 text-slate-400" />
            <span>
              <strong>Próxima visita:</strong>{" "}
              {customer.next_visit_at
                ? formatDate(customer.next_visit_at + "T12:00:00")
                : "Não agendada"}
            </span>
          </div>
        </div>

        {customer.notes ? (
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <p className="text-xs font-medium text-slate-500">Observações gerais</p>
            <p className="mt-1 text-sm text-slate-700">{customer.notes}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
