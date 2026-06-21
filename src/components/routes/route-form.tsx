"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import { searchCustomersAction } from "@/app/actions/customers";
import { createRouteAction } from "@/app/actions/routes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ServiceCityWithRegion } from "@/lib/service-cities/queries";
import type { MicroRegion } from "@/lib/service-cities/micro-regions";
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

interface RouteFormProps {
  serviceCities: ServiceCityWithRegion[];
  microRegions: MicroRegion[];
}

export function RouteForm({ serviceCities, microRegions }: RouteFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [name, setName] = useState("");
  const [polo, setPolo] = useState("");
  const [microRegionSlug, setMicroRegionSlug] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("SP");
  const [plannedDate, setPlannedDate] = useState("");
  const [priority, setPriority] = useState<RoutePriority>("normal");
  const [notes, setNotes] = useState("");

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [stops, setStops] = useState<DraftStop[]>([]);

  const selectedMicroRegion = useMemo(
    () => microRegions.find((r) => r.slug === microRegionSlug),
    [microRegions, microRegionSlug]
  );

  const citiesInRegion = useMemo(() => {
    if (!microRegionSlug) return [];
    return serviceCities.filter((item) => item.region === microRegionSlug);
  }, [serviceCities, microRegionSlug]);

  const customerFilterLabel = useMemo(() => {
    if (!microRegionSlug) return null;
    if (city) return `${city} / ${state}`;
    return selectedMicroRegion?.name ?? "Micro-região";
  }, [microRegionSlug, city, state, selectedMicroRegion]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (!microRegionSlug) {
        setCustomers([]);
        return;
      }

      const filters: { city?: string; cities?: string[]; state?: string } = {
        state: state || "SP",
      };

      if (city.trim()) {
        filters.city = city.trim();
      } else if (citiesInRegion.length > 0) {
        filters.cities = citiesInRegion.map((item) => item.city);
      }

      setCustomers(await searchCustomersAction(customerQuery, filters));
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery, city, state, microRegionSlug, citiesInRegion]);

  function handleMicroRegionChange(slug: string) {
    setMicroRegionSlug(slug);
    setCity("");
    setState("SP");

    const region = microRegions.find((r) => r.slug === slug);
    if (region) {
      setPolo(region.name);
      if (!name.trim()) {
        setName(`Rota — ${region.name}`);
      }
    }
  }

  function handleCityChange(value: string) {
    if (!value) {
      setCity("");
      setState("SP");
      if (selectedMicroRegion && !name.trim()) {
        setName(`Rota — ${selectedMicroRegion.name}`);
      }
      return;
    }

    const [selectedCity, selectedState] = value.split("|");
    setCity(selectedCity);
    setState(selectedState);
    if (!name.trim()) {
      setName(`Rota — ${selectedCity}`);
    }
  }

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

    if (!microRegionSlug) {
      setError("Selecione a micro-região de atuação.");
      return;
    }

    const payload: RouteFormInput = {
      name,
      polo: polo || selectedMicroRegion?.name || "",
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
              placeholder="Ex.: Rota — Marília e entorno"
              className={inputClass}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">
              Micro-região * ({microRegions.length} eixos — ordem de expansão)
            </span>
            <select
              value={microRegionSlug}
              onChange={(e) => handleMicroRegionChange(e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione a micro-região</option>
              {microRegions.map((region) => (
                <option key={region.slug} value={region.slug}>
                  {region.expansionPriority}. {region.name} ({region.cities.length}{" "}
                  cidades)
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Cidade foco</span>
            <select
              value={city ? `${city}|${state}` : ""}
              onChange={(e) => handleCityChange(e.target.value)}
              disabled={!microRegionSlug}
              className={inputClass}
            >
              <option value="">
                Toda a micro-região
                {citiesInRegion.length > 0
                  ? ` (${citiesInRegion.length} cidades)`
                  : ""}
              </option>
              {citiesInRegion.map((item) => (
                <option key={item.id} value={`${item.city}|${item.state}`}>
                  {item.city} / {item.state}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Polo</span>
            <input
              value={polo}
              onChange={(e) => setPolo(e.target.value)}
              placeholder="Preenchido pela micro-região"
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
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Clientes na rota</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {microRegionSlug ? (
            <p className="text-xs text-slate-500">
              Buscando clientes em{" "}
              <strong>{customerFilterLabel}</strong>
              {city ? "" : " (todas as cidades da micro-região)"}
            </p>
          ) : (
            <p className="text-xs text-slate-500">
              Selecione a micro-região acima para filtrar clientes da área de
              atuação.
            </p>
          )}

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={customerQuery}
              onChange={(e) => setCustomerQuery(e.target.value)}
              placeholder="Adicionar cliente à rota..."
              disabled={!microRegionSlug}
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm disabled:bg-slate-50"
            />
          </div>

          {customers.length > 0 ? (
            <ul className="max-h-40 divide-y divide-slate-200 overflow-y-auto rounded-lg border border-slate-300">
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
