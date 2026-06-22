"use client";

import { useActionState, useState, useTransition } from "react";
import {
  addCommissionCategoryAction,
  deleteCommissionCategoryRateAction,
  saveCommissionRatesAction,
  type CommissionRateActionState,
} from "@/app/actions/commission-rates";
import { Button } from "@/components/ui/button";
import { formatPercent } from "@/lib/utils";
import type { CommissionRatesConfig } from "@/types/commission-rate";

interface CommissionRatesFormProps {
  config: CommissionRatesConfig;
  isAdmin: boolean;
}

export function CommissionRatesForm({
  config,
  isAdmin,
}: CommissionRatesFormProps) {
  const [state, formAction, pending] = useActionState<
    CommissionRateActionState,
    FormData
  >(saveCommissionRatesAction, {});
  const [deletePending, startDelete] = useTransition();
  const [addPending, startAdd] = useTransition();
  const [addState, setAddState] = useState<CommissionRateActionState>({});
  const [newCategory, setNewCategory] = useState("");
  const [newRate, setNewRate] = useState("3");
  const [extraRows, setExtraRows] = useState<
    { key: string; category: string; rate: string }[]
  >([]);

  const feedback = addState.success || addState.error || state.success || state.error;
  const feedbackIsError = Boolean(addState.error || state.error);

  function handleAddSuggestion(category: string) {
    setExtraRows((rows) => [
      ...rows,
      { key: `${category}-${Date.now()}`, category, rate: "3" },
    ]);
  }

  function handleQuickAdd() {
    startAdd(async () => {
      const rate = Number(newRate.replace(",", "."));
      const result = await addCommissionCategoryAction(newCategory, rate);
      setAddState(result);
      if (!result.error) {
        setNewCategory("");
        setNewRate("3");
      }
    });
  }

  function handleDelete(rateId: string) {
    if (!window.confirm("Remover esta taxa de comissão?")) return;
    startDelete(async () => {
      await deleteCommissionCategoryRateAction(rateId);
    });
  }

  if (!isAdmin) {
    return (
      <div className="space-y-3 text-sm text-slate-600">
        <p>
          Taxa padrão: <strong>{formatPercent(config.defaultRate)}</strong>
        </p>
        {config.rates.length === 0 ? (
          <p>Nenhuma taxa por categoria cadastrada.</p>
        ) : (
          <ul className="space-y-1">
            {config.rates.map((row) => (
              <li key={row.id}>
                {row.category}: {formatPercent(row.commission_rate)}
              </li>
            ))}
          </ul>
        )}
        <p className="text-xs text-slate-500">
          Apenas administradores podem alterar as taxas.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {config.usesLegacyMarginRule ? (
        <p className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-900">
          Nenhuma taxa cadastrada ainda. O sistema usa a regra automática por
          margem (2%, 3% ou 5%). Salve abaixo para passar a usar comissão por
          tipo de produto.
        </p>
      ) : (
        <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-900">
          Comissões calculadas por categoria de produto (e override no produto,
          se houver).
        </p>
      )}

      {feedback ? (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            feedbackIsError
              ? "border border-red-200 bg-red-50 text-red-800"
              : "border border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          {feedback}
        </p>
      ) : null}

      <form action={formAction} className="space-y-4">
        <div className="max-w-xs">
          <label className="mb-1 block text-sm font-medium text-slate-700">
            Taxa padrão (%)
          </label>
          <input
            name="default_rate"
            type="text"
            defaultValue={String(config.defaultRate).replace(".", ",")}
            className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            placeholder="Ex.: 3"
          />
          <p className="mt-1 text-xs text-slate-500">
            Usada quando a categoria do produto não tiver taxa específica.
          </p>
        </div>

        <div className="overflow-x-auto rounded-lg border border-slate-300">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-xs text-slate-600">
              <tr>
                <th className="px-3 py-2">Categoria / tipo de produto</th>
                <th className="px-3 py-2 text-right">Comissão (%)</th>
                <th className="px-3 py-2 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 bg-white">
              {config.rates.map((row) => (
                <tr key={row.id}>
                  <td className="px-3 py-2">
                    <input type="hidden" name="category" value={row.category} />
                    <span className="font-medium text-slate-900">
                      {row.category}
                    </span>
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      name="rate"
                      type="text"
                      defaultValue={String(row.commission_rate).replace(
                        ".",
                        ","
                      )}
                      className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <button
                      type="button"
                      disabled={deletePending}
                      onClick={() => handleDelete(row.id)}
                      className="text-xs font-medium text-red-600 hover:underline disabled:opacity-50"
                    >
                      Remover
                    </button>
                  </td>
                </tr>
              ))}

              {extraRows.map((row) => (
                <tr key={row.key}>
                  <td className="px-3 py-2">
                    <input
                      name="category"
                      type="text"
                      defaultValue={row.category}
                      className="h-8 w-full rounded-lg border border-slate-300 px-2 text-sm"
                    />
                  </td>
                  <td className="px-3 py-2 text-right">
                    <input
                      name="rate"
                      type="text"
                      defaultValue={row.rate}
                      className="h-8 w-24 rounded-lg border border-slate-300 px-2 text-right text-sm"
                    />
                  </td>
                  <td className="px-3 py-2" />
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() =>
              setExtraRows((rows) => [
                ...rows,
                { key: `new-${Date.now()}`, category: "", rate: "3" },
              ])
            }
          >
            + Linha em branco
          </Button>
          <Button type="submit" variant="primary" size="sm" disabled={pending}>
            {pending ? "Salvando…" : "Salvar taxas"}
          </Button>
        </div>
      </form>

      {config.unconfiguredCategories.length > 0 ? (
        <div>
          <p className="mb-2 text-sm font-medium text-slate-700">
            Categorias encontradas nos produtos (sem taxa ainda)
          </p>
          <div className="flex flex-wrap gap-2">
            {config.unconfiguredCategories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => handleAddSuggestion(category)}
                className="rounded-full border border-slate-300 bg-white px-3 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                + {category}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
        <p className="text-sm font-medium text-slate-800">
          Cadastrar categoria rapidamente
        </p>
        <div className="mt-2 flex flex-wrap items-end gap-2">
          <div>
            <label className="mb-1 block text-xs text-slate-500">Categoria</label>
            <input
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              className="h-9 rounded-lg border border-slate-300 px-3 text-sm"
              placeholder="Ex.: Álcool"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs text-slate-500">Comissão %</label>
            <input
              value={newRate}
              onChange={(e) => setNewRate(e.target.value)}
              className="h-9 w-24 rounded-lg border border-slate-300 px-3 text-sm"
            />
          </div>
          <Button
            type="button"
            variant="primary"
            size="sm"
            disabled={addPending}
            onClick={handleQuickAdd}
          >
            {addPending ? "Salvando…" : "Adicionar"}
          </Button>
        </div>
      </div>

      <p className="text-xs text-slate-500">
        A categoria vem do campo <strong>Categoria</strong> do produto (planilha
        de importação). Você também pode definir comissão individual no produto
        quando disponível. Pedidos já existentes recalculam ao mudar status ou
        editar itens.
      </p>
    </div>
  );
}
