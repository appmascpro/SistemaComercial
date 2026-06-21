"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { searchCustomersAction } from "@/app/actions/customers";
import { createRouteAction } from "@/app/actions/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BRAZILIAN_STATES } from "@/types/customer";
import type { CustomerSearchResult } from "@/types/quote";
import type { RouteFormInput, RoutePriority } from "@/types/route";

interface DraftStop {
  key: string;
  customer: CustomerSearchResult;
  priority: RoutePriority;
  notes: string;
}

const inputClass =
  "h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-brand-500 focus:ring-2";

export function RouteForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [polo, setPolo] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [plannedDate, setPlannedDate] = useState("");
  const [priority, setPriority] = useState<RoutePriority>("normal");
  const [notes, setNotes] = useState("");

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [stops, setStops] = useState<DraftStop[]>([]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setCustomers(await searchCustomersAction(customerQuery));
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  function addStop(customer: CustomerSearchResult) {
    if (stops.some((s) => s.customer.id === customer.id)) return;
    setStops((current) => [
      ...current,
      {
        key: `${customer.id}-${Date.now()}`,
        customer,
        priority: "normal",
        notes: "",
      },
    ]);
    setCustomerQuery("");
    setCustomers([]);
  }

  function handleSubmit() {
    setError(null);

    const payload: RouteFormInput = {
      name,
      polo,
      city,
      state,
      planned_date: plannedDate || undefined,
      priority,
      notes,
      stops: stops.map((stop, index) => ({
        customer_id: stop.customer.id,
        stop_order: index + 1,
        priority: stop.priority,
        notes: stop.notes || undefined,
      })),
    };

    startTransition(async () => {
      const result = await createRouteAction(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(result.routeId ? `/rotas/${result.routeId}` : "/rotas");
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <Card>
        <CardHeader>
          <CardTitle>Dados da rota</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Nome da rota *</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex.: Polo SP — Zona Leste"
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Polo</span>
            <input
              value={polo}
              onChange={(e) => setPolo(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Prioridade</span>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value as RoutePriority)}
              className={inputClass}
            >
              <option value="baixa">Baixa</option>
              <option value="normal">Normal</option>
              <option value="alta">Alta</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Cidade</span>
            <input value={city} onChange={(e) => setCity(e.target.value)} className={inputClass} />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">UF</span>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {BRAZILIAN_STATES.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Data planejada</span>
            <input
              type="date"
              value={plannedDate}
              onChange={(e) => setPlannedDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Observações</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="w-full rounded-lg border px-3 py-2 text-sm"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes na rota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Adicionar cliente à rota..."
              className="h-10 w-full rounded-lg border pl-9 pr-3 text-sm"
            />
          </div>

          {customers.length > 0 ? (
            <ul className="max-h-40 divide-y divide-slate-300 overflow-y-auto rounded-lg border">
              {customers.map((c) => (
                <li key={c.id}>
                  <button
                    type="button"
                    onClick={() => addStop(c)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    {c.company_name}
                    <span className="ml-2 text-xs text-slate-500">
                      {[c.city, c.state].filter(Boolean).join(" / ")}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {stops.length > 0 ? (
            <ol className="space-y-2">
              {stops.map((stop, index) => (
                <li
                  key={stop.key}
                  className="flex items-start gap-3 rounded-lg border border-slate-300 p-3"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">
                    {index + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">{stop.customer.company_name}</p>
                    <p className="text-xs text-slate-500">
                      {[stop.customer.city, stop.customer.state]
                        .filter(Boolean)
                        .join(" / ")}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setStops((list) => list.filter((s) => s.key !== stop.key))
                    }
                    className="text-slate-400 hover:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ol>
          ) : (
            <p className="text-sm text-slate-500">
              Adicione clientes na ordem de visita.
            </p>
          )}
        </CardContent>
      </Card>

      <Button type="button" onClick={handleSubmit} disabled={isPending} size="lg">
        <Plus className="h-4 w-4" />
        {isPending ? "Salvando..." : "Criar rota"}
      </Button>
    </div>
  );
}
