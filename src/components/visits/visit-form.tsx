"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { ChevronDown, Search } from "lucide-react";
import {
  searchCustomersAction,
  getCustomerVisitDefaultsAction,
  getCustomerForQuoteAction,
} from "@/app/actions/customers";
import { createVisitAction } from "@/app/actions/visits";
import { CustomerKnownProfile } from "@/components/customers/customer-known-profile";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LEAD_STATUS_LABELS,
  PAIN_POINT_SUGGESTIONS,
  PRODUCT_INTEREST_SUGGESTIONS,
  type CustomerDetail,
  type LeadStatus,
} from "@/types/customer";
import type { CustomerSearchResult } from "@/types/quote";
import { VISIT_NEXT_ACTIONS, type VisitContactType, type VisitFormInput } from "@/types/visit";

const inputClass =
  "h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100";

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultNextContactDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

type VisitDefaults = NonNullable<Awaited<ReturnType<typeof getCustomerVisitDefaultsAction>>>;

function defaultsToCustomerPreview(
  customerId: string,
  defaults: VisitDefaults
): CustomerDetail {
  return {
    id: customerId,
    company_name: defaults.company_name,
    trade_name: null,
    document: null,
    document_type: null,
    segment: defaults.segment,
    customer_type: defaults.customer_type,
    lead_status: defaults.lead_status,
    purchase_potential: null,
    potential_volume: defaults.potential_volume,
    products_of_interest: defaults.products_of_interest,
    current_supplier: defaults.current_supplier,
    pain_point: defaults.pain_point,
    buyer_name: defaults.buyer_name,
    buyer_phone: defaults.buyer_phone,
    email: null,
    phone: defaults.buyer_phone,
    address_line: null,
    address_number: null,
    address_complement: null,
    neighborhood: null,
    city: defaults.city,
    state: defaults.state,
    zip_code: null,
    country: "BR",
    status: "ativo",
    notes: null,
    last_visit_at: defaults.last_visit_at,
    next_visit_at: defaults.next_visit_at,
    created_at: new Date().toISOString(),
    stats: {
      quotes_count: 0,
      orders_count: 0,
      samples_count: 0,
      visits_count: 0,
    },
  };
}

export function VisitForm({
  onSuccess,
  initialCustomerId,
}: {
  onSuccess?: (customerId: string) => void;
  initialCustomerId?: string;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showProfileFields, setShowProfileFields] = useState(false);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);
  const [customerPreview, setCustomerPreview] = useState<CustomerDetail | null>(
    null
  );

  const [contactType, setContactType] = useState<VisitContactType>("presencial");
  const [visitedAt, setVisitedAt] = useState(todayDateOnly());
  const [conversationSummary, setConversationSummary] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [productsOfInterest, setProductsOfInterest] = useState("");
  const [painPoint, setPainPoint] = useState("");
  const [currentSupplier, setCurrentSupplier] = useState("");
  const [potentialVolume, setPotentialVolume] = useState("");
  const [nextActionPreset, setNextActionPreset] = useState("");
  const [nextActionOther, setNextActionOther] = useState("");
  const [nextActionDate, setNextActionDate] = useState(defaultNextContactDate());
  const [leadStatus, setLeadStatus] = useState<LeadStatus | "">("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setCustomers(await searchCustomersAction(customerQuery));
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  useEffect(() => {
    if (!initialCustomerId) return;
    void applyCustomerDefaults(initialCustomerId, true);
  }, [initialCustomerId]);

  async function applyCustomerDefaults(customerId: string, selectCustomer = false) {
    const [defaults, customer] = await Promise.all([
      getCustomerVisitDefaultsAction(customerId),
      selectCustomer ? getCustomerForQuoteAction(customerId) : Promise.resolve(null),
    ]);

    if (selectCustomer && customer) {
      setSelectedCustomer(customer);
    }

    if (!defaults) return;

    setCustomerPreview(defaultsToCustomerPreview(customerId, defaults));
    setContactPersonName(defaults.buyer_name ?? "");
    setContactPersonPhone(defaults.buyer_phone ?? "");
    setProductsOfInterest(defaults.products_of_interest ?? "");
    setPainPoint(defaults.pain_point ?? "");
    setCurrentSupplier(defaults.current_supplier ?? "");
    setPotentialVolume(defaults.potential_volume ?? "");
    setLeadStatus(defaults.lead_status ?? "");
    setNextActionDate(
      defaults.next_visit_at
        ? defaults.next_visit_at.slice(0, 10)
        : defaultNextContactDate()
    );
  }

  function resolveNextAction(): string {
    if (nextActionPreset === "Outro") return nextActionOther.trim();
    return nextActionPreset;
  }

  function resetForm() {
    setSelectedCustomer(null);
    setCustomerPreview(null);
    setCustomerQuery("");
    setShowProfileFields(false);
    setContactType("presencial");
    setVisitedAt(todayDateOnly());
    setConversationSummary("");
    setContactPersonName("");
    setContactPersonPhone("");
    setProductsOfInterest("");
    setPainPoint("");
    setCurrentSupplier("");
    setPotentialVolume("");
    setNextActionPreset("");
    setNextActionOther("");
    setNextActionDate(defaultNextContactDate());
    setLeadStatus("");
    setNotes("");
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!selectedCustomer) {
      setError("Selecione o cliente.");
      return;
    }

    const customerId = selectedCustomer.id;
    const input: VisitFormInput = {
      customer_id: customerId,
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
    };

    startTransition(async () => {
      const result = await createVisitAction(input);
      if (result.error) {
        setError(result.error);
        return;
      }

      setSuccess(result.success ?? "Visita registrada.");
      resetForm();
      router.refresh();
      onSuccess?.(customerId);
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Registrar contato comercial</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">Cliente</label>
          {selectedCustomer ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
                <div>
                  <p className="text-sm font-medium">{selectedCustomer.company_name}</p>
                  <p className="text-xs text-slate-500">
                    {[selectedCustomer.city, selectedCustomer.state]
                      .filter(Boolean)
                      .join(" / ")}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Link
                    href={`/clientes/${selectedCustomer.id}`}
                    className="text-xs text-brand-600 hover:underline"
                  >
                    Ver ficha
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCustomer(null);
                      setCustomerPreview(null);
                    }}
                    className="text-xs text-slate-500 hover:underline"
                  >
                    Trocar
                  </button>
                </div>
              </div>
              {customerPreview ? (
                <CustomerKnownProfile customer={customerPreview} compact />
              ) : null}
            </div>
          ) : (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="search"
                value={customerQuery}
                onChange={(e) => setCustomerQuery(e.target.value)}
                placeholder="Buscar cliente..."
                className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              />
              {customers.length > 0 && customerQuery.trim() && (
                <ul className="absolute z-10 mt-1 max-h-48 w-full overflow-y-auto rounded-lg border border-slate-300 bg-white shadow-lg">
                  {customers.map((customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerQuery("");
                          setCustomers([]);
                          void applyCustomerDefaults(customer.id);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium">{customer.company_name}</span>
                        <span className="ml-2 text-xs text-slate-500">
                          {[customer.city, customer.state].filter(Boolean).join(" / ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </div>

        {selectedCustomer ? (
          <>
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700">Tipo de contato</label>
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
                    className={`rounded-lg border px-4 py-2 text-sm font-medium transition-colors ${
                      contactType === option.value
                        ? "border-brand-600 bg-brand-50 text-brand-700"
                        : "border-slate-300 text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Data do contato</label>
                <input
                  type="date"
                  value={visitedAt}
                  onChange={(e) => setVisitedAt(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Com quem falou *</label>
                <input
                  type="text"
                  value={contactPersonName}
                  onChange={(e) => setContactPersonName(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">
                  Resumo da conversa *
                </label>
                <textarea
                  value={conversationSummary}
                  onChange={(e) => setConversationSummary(e.target.value)}
                  rows={4}
                  placeholder="O que foi dito de novo neste contato..."
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
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
              <div className="grid gap-4 rounded-lg border border-slate-200 bg-slate-50/50 p-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Telefone</label>
                  <input
                    type="text"
                    value={contactPersonPhone}
                    onChange={(e) => setContactPersonPhone(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Volume potencial</label>
                  <input
                    type="text"
                    value={potentialVolume}
                    onChange={(e) => setPotentialVolume(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Produtos de interesse</label>
                  <input
                    type="text"
                    value={productsOfInterest}
                    onChange={(e) => setProductsOfInterest(e.target.value)}
                    list="visit-page-product-interests"
                    className={inputClass}
                  />
                  <datalist id="visit-page-product-interests">
                    {PRODUCT_INTEREST_SUGGESTIONS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Fornecedor atual</label>
                  <input
                    type="text"
                    value={currentSupplier}
                    onChange={(e) => setCurrentSupplier(e.target.value)}
                    className={inputClass}
                  />
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Dor / necessidade</label>
                  <input
                    type="text"
                    value={painPoint}
                    onChange={(e) => setPainPoint(e.target.value)}
                    list="visit-page-pain-points"
                    className={inputClass}
                  />
                  <datalist id="visit-page-pain-points">
                    {PAIN_POINT_SUGGESTIONS.map((item) => (
                      <option key={item} value={item} />
                    ))}
                  </datalist>
                </div>
              </div>
            ) : null}

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Próxima ação</label>
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
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Próxima visita</label>
                <input
                  type="date"
                  value={nextActionDate}
                  onChange={(e) => setNextActionDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              {nextActionPreset === "Outro" ? (
                <div className="space-y-2 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">Descreva a ação</label>
                  <input
                    type="text"
                    value={nextActionOther}
                    onChange={(e) => setNextActionOther(e.target.value)}
                    className={inputClass}
                  />
                </div>
              ) : null}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700">Status comercial</label>
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
              </div>
              <div className="space-y-2 sm:col-span-2">
                <label className="text-sm font-medium text-slate-700">Observações</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  rows={2}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                />
              </div>
            </div>
          </>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        {selectedCustomer ? (
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isPending}
            className="w-full sm:w-auto"
          >
            {isPending ? "Salvando..." : "Salvar no histórico"}
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
