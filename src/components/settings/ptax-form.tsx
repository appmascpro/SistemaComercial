"use client";

import { useActionState } from "react";
import { updatePtaxAction, type PtaxActionState } from "@/app/actions/ptax";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PtaxHistoryItem, PtaxRate } from "@/lib/pricing/ptax";

interface PtaxFormProps {
  current: PtaxRate;
  history: PtaxHistoryItem[];
}

export function PtaxForm({ current, history }: PtaxFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [state, formAction, pending] = useActionState<PtaxActionState, FormData>(
    updatePtaxAction,
    {}
  );

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-brand-100 bg-brand-50/60 px-4 py-3">
        <p className="text-xs font-medium uppercase tracking-wide text-brand-700/80">
          PTAX venda ativa
        </p>
        <p className="mt-1 text-2xl font-bold text-brand-800">
          {formatCurrency(current.rate, "BRL")}
          <span className="ml-1 text-sm font-normal text-brand-700/80">/ USD</span>
        </p>
        <p className="mt-0.5 text-xs text-brand-700/70">
          Vigência:{" "}
          {new Date(current.validFrom + "T12:00:00").toLocaleDateString("pt-BR")}
          {current.source === "tenant_settings" && " (padrão do tenant)"}
          {current.source === "default" && " (padrão Tavares)"}
        </p>
      </div>

      <form action={formAction} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label
              htmlFor="ptax-rate"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Nova PTAX venda (R$/USD)
            </label>
            <input
              id="ptax-rate"
              name="rate"
              type="text"
              inputMode="decimal"
              placeholder="5.078"
              required
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
          <div>
            <label
              htmlFor="ptax-date"
              className="mb-1.5 block text-sm font-medium text-slate-700"
            >
              Vigência
            </label>
            <input
              id="ptax-date"
              name="valid_from"
              type="date"
              defaultValue={today}
              className="h-10 w-full rounded-lg border border-slate-300 bg-white px-3 text-sm focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            />
          </div>
        </div>

        {state.error && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {state.error}
          </p>
        )}
        {state.success && (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {state.success}
          </p>
        )}

        <Button type="submit" disabled={pending}>
          {pending ? "Salvando..." : "Atualizar PTAX do dia"}
        </Button>
      </form>

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Histórico recente
          </p>
          <ul className="divide-y divide-slate-300 rounded-lg border border-slate-300">
            {history.map((item) => (
              <li
                key={`${item.valid_from}-${item.rate}`}
                className="flex items-center justify-between px-3 py-2 text-sm"
              >
                <span className="text-slate-600">
                  {new Date(item.valid_from + "T12:00:00").toLocaleDateString(
                    "pt-BR"
                  )}
                </span>
                <span className="font-medium text-slate-900">
                  {formatCurrency(item.rate, "BRL")}
                  {item.status === "ativo" && (
                    <span className="ml-2 rounded-full bg-emerald-50 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                      ativa
                    </span>
                  )}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Produtos em dólar têm o preço BRL recalculado automaticamente com esta
        cotação na listagem e nas cotações.
      </p>
    </div>
  );
}
