"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ChevronDown,
  ExternalLink,
  FlaskConical,
  FileText,
  MessageCircle,
} from "lucide-react";
import { createVisitAction } from "@/app/actions/visits";
import { rescheduleRouteStopAction } from "@/app/actions/routes";
import { CustomerKnownProfile } from "@/components/customers/customer-known-profile";
import { Button } from "@/components/ui/button";
import {
  LEAD_STATUS_LABELS,
  PAIN_POINT_SUGGESTIONS,
  PRODUCT_INTEREST_SUGGESTIONS,
  type CustomerDetail,
  type LeadStatus,
} from "@/types/customer";
import {
  ROUTE_STOP_PRIORITY_LABELS,
  ROUTE_STOP_STATUS_LABELS,
  VISIT_RESULT_LABELS,
  type RouteStopDetail,
  type RouteStopPriority,
  type VisitResult,
} from "@/types/route";
import { VISIT_NEXT_ACTIONS, type VisitContactType } from "@/types/visit";
import { formatDate } from "@/lib/utils";

const inputClass =
  "h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-brand-500 focus:ring-2";

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultNextContactDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

function stopToCustomerPreview(
  stop: RouteStopDetail,
  routeId: string
): CustomerDetail {
  const c = stop.customer;
  return {
    id: c.id,
    company_name: c.company_name,
    trade_name: null,
    document: null,
    document_type: null,
    segment: null,
    customer_type: null,
    lead_status: c.lead_status as CustomerDetail["lead_status"],
    purchase_potential: null,
    potential_volume: c.potential_volume,
    products_of_interest: c.products_of_interest,
    current_supplier: c.current_supplier,
    pain_point: c.pain_point,
    buyer_name: c.buyer_name,
    buyer_phone: c.buyer_phone,
    email: null,
    phone: c.phone,
    address_line: null,
    address_number: null,
    address_complement: null,
    neighborhood: null,
    city: c.city ?? stop.city,
    state: c.state ?? stop.state,
    zip_code: null,
    country: "BR",
    status: "ativo",
    notes: null,
    last_visit_at: null,
    next_visit_at: c.next_visit_at,
    created_at: new Date().toISOString(),
    stats: { quotes_count: 0, orders_count: 0, samples_count: 0, visits_count: 0 },
  };
}

function formatPlannedTime(plannedAt: string | null): string | null {
  if (!plannedAt) return null;
  const date = new Date(plannedAt);
  if (Number.isNaN(date.getTime())) return null;
  return date.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export function RouteStopVisitPanel({
  stop,
  routeId,
  routeName,
  weekNumber,
}: {
  stop: RouteStopDetail;
  routeId: string;
  routeName?: string;
  weekNumber?: number | null;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [expanded, setExpanded] = useState(stop.status === "planejado");
  const [showProfileFields, setShowProfileFields] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const customerPreview = stopToCustomerPreview(stop, routeId);
  const priority = (stop.priority as RouteStopPriority) in ROUTE_STOP_PRIORITY_LABELS
    ? (stop.priority as RouteStopPriority)
    : "B";

  const [contactType, setContactType] = useState<VisitContactType>("presencial");
  const [visitedAt, setVisitedAt] = useState(todayDateOnly());
  const [conversationSummary, setConversationSummary] = useState("");
  const [contactPersonName, setContactPersonName] = useState(
    stop.customer.buyer_name ?? ""
  );
  const [contactPersonPhone, setContactPersonPhone] = useState(
    stop.customer.buyer_phone ?? stop.customer.phone ?? ""
  );
  const [productsOfInterest, setProductsOfInterest] = useState(
    stop.customer.products_of_interest ?? ""
  );
  const [painPoint, setPainPoint] = useState(stop.customer.pain_point ?? "");
  const [currentSupplier, setCurrentSupplier] = useState(
    stop.customer.current_supplier ?? ""
  );
  const [potentialVolume, setPotentialVolume] = useState(
    stop.customer.potential_volume ?? ""
  );
  const [visitResult, setVisitResult] = useState<VisitResult | "">("");
  const [nextActionPreset, setNextActionPreset] = useState("");
  const [nextActionOther, setNextActionOther] = useState("");
  const [nextActionDate, setNextActionDate] = useState(
    stop.customer.next_visit_at?.slice(0, 10) ?? defaultNextContactDate()
  );
  const [leadStatus, setLeadStatus] = useState<LeadStatus | "">(
    (stop.customer.lead_status as LeadStatus) ?? ""
  );
  const [rescheduleDate, setRescheduleDate] = useState(defaultNextContactDate());

  function resolveNextAction(): string {
    if (nextActionPreset === "Outro") return nextActionOther.trim();
    return nextActionPreset;
  }

  function handleSubmitVisit() {
    setError(null);
    setSuccess(null);

    if (!visitResult) {
      setError("Informe o resultado da visita.");
      return;
    }

    startTransition(async () => {
      const result = await createVisitAction({
        customer_id: stop.customer.id,
        route_id: routeId,
        route_stop_id: stop.id,
        contact_type: contactType,
        visited_at: visitedAt,
        conversation_summary: conversationSummary,
        contact_person_name: contactPersonName,
        contact_person_phone: contactPersonPhone,
        next_action_date: nextActionDate,
        products_of_interest: productsOfInterest,
        pain_point: painPoint,
        current_supplier: currentSupplier,
        potential_volume: potentialVolume,
        next_action: resolveNextAction(),
        lead_status: leadStatus,
        visit_result: visitResult,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Visita registrada.");
      setExpanded(false);
      router.refresh();
    });
  }

  function handleReschedule() {
    startTransition(async () => {
      const result = await rescheduleRouteStopAction(
        stop.id,
        routeId,
        rescheduleDate
      );
      if (result.error) setError(result.error);
      else {
        setSuccess("Visita reagendada.");
        router.refresh();
      }
    });
  }

  const plannedTime = formatPlannedTime(stop.planned_at);
  const isDone = stop.status === "visitado";

  return (
    <div
      className={`rounded-xl border p-4 ${
        isDone
          ? "border-emerald-200 bg-emerald-50/40"
          : stop.status === "reagendar"
            ? "border-amber-200 bg-amber-50/40"
            : "border-slate-300 bg-white"
      }`}
    >
      <div className="flex flex-wrap items-start gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-100 text-sm font-bold text-brand-700">
          {stop.stop_order}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <Link
              href={`/clientes/${stop.customer.id}`}
              className="font-medium text-brand-600 hover:underline"
            >
              {stop.customer.company_name}
            </Link>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                priority === "A"
                  ? "bg-red-50 text-red-700"
                  : priority === "B"
                    ? "bg-amber-50 text-amber-700"
                    : "bg-slate-100 text-slate-600"
              }`}
            >
              {ROUTE_STOP_PRIORITY_LABELS[priority]}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs capitalize text-slate-600">
              {ROUTE_STOP_STATUS_LABELS[
                stop.status as keyof typeof ROUTE_STOP_STATUS_LABELS
              ] ?? stop.status}
            </span>
          </div>
          <p className="text-xs text-slate-500">
            {[stop.city ?? stop.customer.city, stop.state ?? stop.customer.state]
              .filter(Boolean)
              .join(" / ")}
            {plannedTime ? ` · ${plannedTime}` : ""}
            {stop.customer.phone ? ` · ${stop.customer.phone}` : ""}
          </p>
          {routeName ? (
            <p className="mt-0.5 text-xs text-slate-400">
              {routeName}
              {weekNumber ? ` · Semana ${weekNumber}` : ""}
            </p>
          ) : null}
        </div>

        {!isDone ? (
          <Button
            type="button"
            size="sm"
            variant={expanded ? "outline" : "primary"}
            onClick={() => setExpanded((v) => !v)}
          >
            <MessageCircle className="h-4 w-4" />
            {expanded ? "Fechar" : "Iniciar visita"}
          </Button>
        ) : (
          <span className="text-xs font-medium text-emerald-700">Concluída</span>
        )}
      </div>

      {expanded && !isDone ? (
        <div className="mt-4 space-y-4 border-t border-slate-200 pt-4">
          <CustomerKnownProfile customer={customerPreview} compact />

          <div className="flex flex-wrap gap-2">
            {(
              [
                { value: "presencial", label: "Presencial" },
                { value: "whatsapp", label: "WhatsApp" },
              ] as const
            ).map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setContactType(option.value)}
                className={`rounded-lg border px-3 py-1.5 text-xs font-medium ${
                  contactType === option.value
                    ? "border-brand-600 bg-brand-50 text-brand-700"
                    : "border-slate-300 text-slate-600"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Data</span>
              <input
                type="date"
                value={visitedAt}
                onChange={(e) => setVisitedAt(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Com quem falou *</span>
              <input
                value={contactPersonName}
                onChange={(e) => setContactPersonName(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Resumo da conversa *</span>
              <textarea
                value={conversationSummary}
                onChange={(e) => setConversationSummary(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Resultado *</span>
              <select
                value={visitResult}
                onChange={(e) => setVisitResult(e.target.value as VisitResult | "")}
                className={inputClass}
              >
                <option value="">Selecione o resultado</option>
                {(Object.entries(VISIT_RESULT_LABELS) as [VisitResult, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          <button
            type="button"
            onClick={() => setShowProfileFields((v) => !v)}
            className="flex w-full items-center justify-between rounded-lg border border-slate-200 px-3 py-2 text-left text-sm text-slate-700"
          >
            Atualizar perfil (só se mudou)
            <ChevronDown
              className={`h-4 w-4 ${showProfileFields ? "rotate-180" : ""}`}
            />
          </button>

          {showProfileFields ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-slate-600">Produtos de interesse</span>
                <input
                  value={productsOfInterest}
                  onChange={(e) => setProductsOfInterest(e.target.value)}
                  list={`products-${stop.id}`}
                  className={inputClass}
                />
                <datalist id={`products-${stop.id}`}>
                  {PRODUCT_INTEREST_SUGGESTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
              <label className="block text-sm sm:col-span-2">
                <span className="mb-1 block text-slate-600">Dor</span>
                <input
                  value={painPoint}
                  onChange={(e) => setPainPoint(e.target.value)}
                  list={`pain-${stop.id}`}
                  className={inputClass}
                />
                <datalist id={`pain-${stop.id}`}>
                  {PAIN_POINT_SUGGESTIONS.map((item) => (
                    <option key={item} value={item} />
                  ))}
                </datalist>
              </label>
            </div>
          ) : null}

          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Próxima ação</span>
              <select
                value={nextActionPreset}
                onChange={(e) => setNextActionPreset(e.target.value)}
                className={inputClass}
              >
                <option value="">Selecione</option>
                {VISIT_NEXT_ACTIONS.map((action) => (
                  <option key={action} value={action}>
                    {action}
                  </option>
                ))}
                <option value="Outro">Outro</option>
              </select>
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Próximo contato</span>
              <input
                type="date"
                value={nextActionDate}
                onChange={(e) => setNextActionDate(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Status comercial</span>
              <select
                value={leadStatus}
                onChange={(e) => setLeadStatus(e.target.value as LeadStatus | "")}
                className={inputClass}
              >
                <option value="">Manter</option>
                {(Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][]).map(
                  ([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  )
                )}
              </select>
            </label>
          </div>

          {error ? (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
          ) : null}

          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={handleSubmitVisit} disabled={isPending}>
              {isPending ? "Salvando..." : "Salvar visita"}
            </Button>
            <div className="flex items-center gap-2">
              <input
                type="date"
                value={rescheduleDate}
                onChange={(e) => setRescheduleDate(e.target.value)}
                className="h-9 rounded-lg border border-slate-300 px-2 text-sm"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={isPending}
                onClick={handleReschedule}
              >
                Reagendar
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {success ? (
        <div className="mt-3 space-y-2 rounded-lg bg-emerald-50 p-3">
          <p className="text-sm text-emerald-700">{success}</p>
          <div className="flex flex-wrap gap-2">
            <Link
              href={`/cotacoes/nova?cliente=${stop.customer.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              <FileText className="h-3.5 w-3.5" />
              Nova cotação
            </Link>
            <Link
              href={`/amostras/nova?cliente=${stop.customer.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-brand-200 bg-white px-2 py-1 text-xs font-medium text-brand-700 hover:bg-brand-50"
            >
              <FlaskConical className="h-3.5 w-3.5" />
              Nova amostra
            </Link>
            <Link
              href={`/clientes/${stop.customer.id}`}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs text-slate-600 hover:bg-slate-50"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              Ficha do cliente
            </Link>
          </div>
        </div>
      ) : null}

      {isDone && stop.completed_at ? (
        <p className="mt-2 text-xs text-emerald-600">
          Visitado em {formatDate(stop.completed_at)}
        </p>
      ) : null}
    </div>
  );
}
