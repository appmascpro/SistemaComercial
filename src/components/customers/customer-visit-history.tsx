"use client";

import { useEffect, useState, useTransition } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { createVisitAction } from "@/app/actions/visits";
import { CustomerKnownProfile } from "@/components/customers/customer-known-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LEAD_STATUS_LABELS,
  PAIN_POINT_SUGGESTIONS,
  PRODUCT_INTEREST_SUGGESTIONS,
  type CustomerDetail,
  type CustomerVisitHistoryItem,
  type LeadStatus,
} from "@/types/customer";
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

function resolveNextActionDate(customer: CustomerDetail): string {
  if (customer.next_visit_at) {
    return customer.next_visit_at.slice(0, 10);
  }
  return defaultNextContactDate();
}

export function CustomerVisitHistory({
  visits,
}: {
  visits: CustomerVisitHistoryItem[];
}) {
  if (visits.length === 0) {
    return (
      <p className="text-sm text-slate-500">
        Nenhum contato registrado ainda.
      </p>
    );
  }

  return (
    <ol className="space-y-4">
      {visits.map((visit) => (
        <li
          key={visit.id}
          className="relative border-l-2 border-brand-200 pl-4 pb-1"
        >
          <div className="absolute -left-[5px] top-1 h-2 w-2 rounded-full bg-brand-500" />
          <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span className="font-medium text-slate-800">
              {formatDate(visit.visited_at)}
            </span>
            <span className="rounded-full bg-slate-100 px-2 py-0.5 capitalize">
              {visit.contact_type === "whatsapp" ? "WhatsApp" : "Presencial"}
            </span>
            {visit.seller_name ? <span>· {visit.seller_name}</span> : null}
          </div>
          {visit.contact_person_name ? (
            <p className="mt-1 text-sm text-slate-700">
              {visit.contact_person_name}
              {visit.contact_person_phone ? (
                <span className="text-slate-500"> · {visit.contact_person_phone}</span>
              ) : null}
            </p>
          ) : null}
          {visit.conversation_summary ? (
            <p className="mt-2 text-sm text-slate-700">{visit.conversation_summary}</p>
          ) : null}
          {visit.products_of_interest ? (
            <p className="mt-1 text-xs text-slate-600">
              <strong>Interesse:</strong> {visit.products_of_interest}
            </p>
          ) : null}
          {visit.next_action ? (
            <p className="mt-1 text-xs text-brand-700">
              <strong>Próxima ação:</strong> {visit.next_action}
              {visit.next_action_date
                ? ` · ${formatDate(visit.next_action_date + "T12:00:00")}`
                : null}
            </p>
          ) : null}
          {visit.notes ? (
            <p className="mt-1 text-xs text-slate-500">{visit.notes}</p>
          ) : null}
        </li>
      ))}
    </ol>
  );
}

export function CustomerVisitForm({
  customer,
  onSuccess,
}: {
  customer: CustomerDetail;
  onSuccess?: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProfileFields, setShowProfileFields] = useState(false);

  const [contactType, setContactType] = useState<VisitContactType>("presencial");
  const [visitedAt, setVisitedAt] = useState(todayDateOnly());
  const [conversationSummary, setConversationSummary] = useState("");
  const [contactPersonName, setContactPersonName] = useState(
    customer.buyer_name ?? ""
  );
  const [contactPersonPhone, setContactPersonPhone] = useState(
    customer.buyer_phone ?? customer.phone ?? ""
  );
  const [productsOfInterest, setProductsOfInterest] = useState(
    customer.products_of_interest ?? ""
  );
  const [painPoint, setPainPoint] = useState(customer.pain_point ?? "");
  const [currentSupplier, setCurrentSupplier] = useState(
    customer.current_supplier ?? ""
  );
  const [potentialVolume, setPotentialVolume] = useState(
    customer.potential_volume ?? ""
  );
  const [nextActionPreset, setNextActionPreset] = useState("");
  const [nextActionOther, setNextActionOther] = useState("");
  const [nextActionDate, setNextActionDate] = useState(() =>
    resolveNextActionDate(customer)
  );
  const [leadStatus, setLeadStatus] = useState<LeadStatus | "">(
    customer.lead_status ?? ""
  );
  const [notes, setNotes] = useState("");

  useEffect(() => {
    setContactPersonName(customer.buyer_name ?? "");
    setContactPersonPhone(customer.buyer_phone ?? customer.phone ?? "");
    setProductsOfInterest(customer.products_of_interest ?? "");
    setPainPoint(customer.pain_point ?? "");
    setCurrentSupplier(customer.current_supplier ?? "");
    setPotentialVolume(customer.potential_volume ?? "");
    setLeadStatus(customer.lead_status ?? "");
    setNextActionDate(resolveNextActionDate(customer));
  }, [customer]);

  function resolveNextAction(): string {
    if (nextActionPreset === "Outro") return nextActionOther.trim();
    return nextActionPreset;
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    startTransition(async () => {
      const result = await createVisitAction({
        customer_id: customer.id,
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
        notes,
      });

      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Contato registrado.");
      setConversationSummary("");
      setNextActionPreset("");
      setNextActionOther("");
      setNotes("");
      setShowProfileFields(false);
      onSuccess?.();
    });
  }

  return (
    <Card className="border-brand-200">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageCircle className="h-4 w-4" />
          Registrar contato
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <CustomerKnownProfile customer={customer} />

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
            <span className="mb-1 block text-slate-600">Data do contato</span>
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
              rows={4}
              placeholder="O que foi dito de novo neste contato — objeções, compromissos, mudanças..."
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
            />
          </label>
        </div>

        <button
          type="button"
          onClick={() => setShowProfileFields((v) => !v)}
          className="flex w-full items-center justify-between rounded-lg border border-slate-200 bg-white px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-50"
        >
          <span>Atualizar dados do cliente (só se mudou)</span>
          <ChevronDown
            className={`h-4 w-4 transition-transform ${
              showProfileFields ? "rotate-180" : ""
            }`}
          />
        </button>

        {showProfileFields ? (
          <div className="grid gap-3 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">WhatsApp / telefone</span>
              <input
                value={contactPersonPhone}
                onChange={(e) => setContactPersonPhone(e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Volume potencial</span>
              <input
                value={potentialVolume}
                onChange={(e) => setPotentialVolume(e.target.value)}
                placeholder="10L, 50L, 200L/mês"
                className={inputClass}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Produtos de interesse</span>
              <input
                value={productsOfInterest}
                onChange={(e) => setProductsOfInterest(e.target.value)}
                list="visit-product-interests"
                placeholder="álcool, essência, base, laurel..."
                className={inputClass}
              />
              <datalist id="visit-product-interests">
                {PRODUCT_INTEREST_SUGGESTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Fornecedor atual</span>
              <input
                value={currentSupplier}
                onChange={(e) => setCurrentSupplier(e.target.value)}
                placeholder="Quem vende hoje"
                className={inputClass}
              />
            </label>
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Dor / necessidade</span>
              <input
                value={painPoint}
                onChange={(e) => setPainPoint(e.target.value)}
                list="visit-pain-points"
                placeholder="preço, prazo, qualidade..."
                className={inputClass}
              />
              <datalist id="visit-pain-points">
                {PAIN_POINT_SUGGESTIONS.map((item) => (
                  <option key={item} value={item} />
                ))}
              </datalist>
            </label>
          </div>
        ) : null}

        <div className="grid gap-3 border-t border-slate-100 pt-4 sm:grid-cols-2">
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
            <span className="mb-1 block text-slate-600">Próxima visita</span>
            <input
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
              className={inputClass}
            />
          </label>
          {nextActionPreset === "Outro" ? (
            <label className="block text-sm sm:col-span-2">
              <span className="mb-1 block text-slate-600">Descreva a ação</span>
              <input
                value={nextActionOther}
                onChange={(e) => setNextActionOther(e.target.value)}
                className={inputClass}
              />
            </label>
          ) : null}
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Status (temperatura)</span>
            <select
              value={leadStatus}
              onChange={(e) => setLeadStatus(e.target.value as LeadStatus | "")}
              className={inputClass}
            >
              <option value="">Manter atual</option>
              {(Object.entries(LEAD_STATUS_LABELS) as [LeadStatus, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Observações</span>
            <input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className={inputClass}
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <Button type="button" onClick={handleSubmit} disabled={isPending} size="lg">
          {isPending ? "Salvando..." : "Salvar no histórico"}
        </Button>
      </CardContent>
    </Card>
  );
}
