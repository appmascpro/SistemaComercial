import Link from "next/link";
import type { CustomerListItem } from "@/types/customer";

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
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Cliente</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Documento</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Local</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Contato</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Segmento</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {customers.map((customer) => (
            <tr key={customer.id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2">
                <p className="font-medium text-slate-900">{customer.company_name}</p>
                {customer.trade_name ? (
                  <p className="text-xs text-slate-500">{customer.trade_name}</p>
                ) : null}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {customer.document ?? "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {[customer.city, customer.state].filter(Boolean).join(" / ") || "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {customer.email ?? customer.phone ?? "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {customer.segment ?? "—"}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    customer.status === "ativo"
                      ? "bg-emerald-50 text-emerald-700"
                      : "bg-slate-100 text-slate-600"
                  }`}
                >
                  {customer.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <Link
                  href={`/clientes/${customer.id}`}
                  className="text-xs font-medium text-brand-600 hover:underline"
                >
                  Ver
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
