"use client";

import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { QuoteListItem } from "@/types/quote";

const statusStyles: Record<string, string> = {
  aberta: "bg-blue-50 text-blue-700",
  enviada: "bg-amber-50 text-amber-700",
  aprovada: "bg-emerald-50 text-emerald-700",
  recusada: "bg-red-50 text-red-700",
  expirada: "bg-slate-100 text-slate-600",
};

export function QuotesTable({ quotes }: { quotes: QuoteListItem[] }) {
  if (quotes.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Nenhuma cotação cadastrada.{" "}
        <Link href="/cotacoes/nova" className="text-brand-600 hover:underline">
          Criar primeira cotação
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-200">
      <table className="min-w-full divide-y divide-slate-200 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Número</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Cliente</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Local</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Validade</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Total</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100 bg-white">
          {quotes.map((quote) => (
            <tr key={quote.id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2 font-mono text-xs text-slate-700">
                {quote.quote_number}
              </td>
              <td className="px-3 py-2 font-medium text-slate-900">
                {quote.customer.company_name}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {[quote.customer.city, quote.customer.state]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </td>
              <td className="px-3 py-2 text-slate-600">
                {quote.valid_until ? formatDate(quote.valid_until) : "—"}
              </td>
              <td className="px-3 py-2 text-right font-medium">
                {formatCurrency(quote.total, "BRL")}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                    statusStyles[quote.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {quote.status}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/cotacoes/${quote.id}`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Ver
                  </Link>
                  <Link
                    href={`/cotacoes/${quote.id}/pdf`}
                    className="text-xs font-medium text-slate-600 hover:underline"
                  >
                    PDF
                  </Link>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
