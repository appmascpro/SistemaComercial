"use client";

import { useActionState, useState, useTransition } from "react";
import {
  syncPtaxFromBcbAction,
  updatePtaxAction,
  type PtaxActionState,
} from "@/app/actions/ptax";
import { Button } from "@/components/ui/button";
import { formatCurrency } from "@/lib/utils";
import type { PtaxHistoryItem, PtaxRate } from "@/lib/pricing/ptax";

interface PtaxFormProps {
  current: PtaxRate;
  history: PtaxHistoryItem[];
}

function sourceLabel(source: PtaxRate["source"]): string {
  switch (source) {
    case "bcb":
      return "BCB (automático)";
    case "manual":
      return "cadastro manual";
    case "tenant_settings":
      return "padrão do tenant";
    case "default":
      return "padrão Tavares";
    default:
      return "tabela de câmbio";
  }
}

function historySourceLabel(source: string | null): string | null {
  if (source === "bcb") return "BCB";
  if (source === "manual") return "Manual";
  return null;
}

export function PtaxForm({ current, history }: PtaxFormProps) {
  const today = new Date().toISOString().slice(0, 10);
  const [state, formAction, pending] = useActionState<PtaxActionState, FormData>(
    updatePtaxAction,
    {}
  );
  const [bcbPending, startBcbSync] = useTransition();
  const [bcbState, setBcbState] = useState<PtaxActionState>({});

  async function handleBcbSync() {
    startBcbSync(async () => {
      const result = await syncPtaxFromBcbAction();
      setBcbState(result);
    });
  }

  const feedback = bcbState.success || bcbState.error || state.success || state.error;
  const feedbackIsError = Boolean(bcbState.error || state.error);

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
          {" · "}
          {sourceLabel(current.source)}
          {current.bcbReferenceDate
            ? ` · ref. BCB ${new Date(current.bcbReferenceDate + "T12:00:00").toLocaleDateString("pt-BR")}`
            : null}
        </p>
      </div>

      <div className="rounded-lg border border-slate-300 bg-slate-50 px-4 py-3">
        <p className="text-sm font-medium text-slate-800">
          Atualização automática BCB
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Consulta a API Olinda/PTAX do Banco Central (PTAX venda). Horários
          agendados: <strong>07h00</strong> e <strong>13h30</strong> (dias úteis,
          horário de Brasília). Produtos em USD recalculam na listagem; cada
          cotação guarda a PTAX usada no momento da criação.
        </p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={bcbPending || pending}
          onClick={handleBcbSync}
        >
          {bcbPending ? "Consultando BCB..." : "Atualizar dólar agora"}
        </Button>
      </div>

      <form action={formAction} className="space-y-3">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
          Ajuste manual
        </p>
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

        {feedback ? (
          <p
            className={`rounded-lg px-3 py-2 text-sm ${
              feedbackIsError
                ? "bg-red-50 text-red-700"
                : "bg-emerald-50 text-emerald-700"
            }`}
          >
            {feedback}
          </p>
        ) : null}

        <Button type="submit" disabled={pending || bcbPending}>
          {pending ? "Salvando..." : "Salvar PTAX manual"}
        </Button>
      </form>

      {history.length > 0 && (
        <div>
          <p className="mb-2 text-xs font-medium uppercase tracking-wide text-slate-400">
            Histórico recente
          </p>
          <ul className="divide-y divide-slate-300 rounded-lg border border-slate-300">
            {history.map((item) => {
              const tag = historySourceLabel(item.source);
              return (
                <li
                  key={`${item.valid_from}-${item.rate}-${item.source}`}
                  className="flex items-center justify-between px-3 py-2 text-sm"
                >
                  <span className="text-slate-600">
                    {new Date(item.valid_from + "T12:00:00").toLocaleDateString(
                      "pt-BR"
                    )}
                    {tag ? (
                      <span className="ml-2 rounded-full bg-slate-100 px-1.5 py-0.5 text-[10px] font-semibold text-slate-600">
                        {tag}
                      </span>
                    ) : null}
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
              );
            })}
          </ul>
        </div>
      )}

      <p className="text-xs text-slate-500">
        Configure o cron no Supabase com o arquivo{" "}
        <code className="rounded bg-slate-100 px-1">setup_ptax_cron.sql</code>{" "}
        após definir <code className="rounded bg-slate-100 px-1">CRON_SECRET</code>{" "}
        no Vercel e a URL pública do app.
      </p>
    </div>
  );
}
