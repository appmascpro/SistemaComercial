import Link from "next/link";
import {
  LEAD_STATUS_LABELS,
  type CustomerListItem,
  type LeadStatus,
} from "@/types/customer";
import { formatDate } from "@/lib/utils";

const LEAD_STATUS_STYLES: Record<LeadStatus, string> = {
  frio: "bg-sky-50 text-sky-700",
  morno: "bg-amber-50 text-amber-700",
  quente: "bg-orange-50 text-orange-700",
  cliente: "bg-emerald-50 text-emerald-700",
};

export function CustomersTable({ customers }: { customers: CustomerListItem[] }) {
  if (customers.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Nenhum cliente cadastrado.{" "}
        <Link href="/clientes/novo" className="text-brand-600 hover:underline">
          Cadastrar primeiro cliente
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Cliente</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Local</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Segmento</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Próxima visita</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2">
                <p className="font-medium text-slate-900">{customer.company_name}</p>
                {customer.trade_name ? (
                  <p className="text-xs text-slate-500">{customer.trade_name}</p>
                ) : null}
                {customer.phone ? (
                  <p className="text-xs text-slate-500">{customer.phone}</p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {[customer.city, customer.state].filter(Boolean).join(" / ") || "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {customer.segment ?? "—"}
              </td>
              <td className="px-3 py-2">
                {customer.lead_status ? (
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      LEAD_STATUS_STYLES[customer.lead_status]
                    }`}
                  >
                    {LEAD_STATUS_LABELS[customer.lead_status]}
                  </span>
                ) : (
                  <span className="text-slate-400">—</span>
                )}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {customer.next_visit_at
                  ? formatDate(customer.next_visit_at + "T12:00:00")
                  : "—"}
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/clientes/${customer.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Ver ficha
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
