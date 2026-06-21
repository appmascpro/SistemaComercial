"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search } from "lucide-react";
import { searchCustomersAction } from "@/app/actions/customers";
import { createVisitAction } from "@/app/actions/visits";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CustomerSearchResult } from "@/types/quote";
import type { VisitContactType, VisitFormInput } from "@/types/visit";

function todayDateOnly(): string {
  return new Date().toISOString().slice(0, 10);
}

function defaultNextContactDate(): string {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  return date.toISOString().slice(0, 10);
}

export function VisitForm({ onSuccess }: { onSuccess?: () => void }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);

  const [contactType, setContactType] = useState<VisitContactType>("presencial");
  const [visitedAt, setVisitedAt] = useState(todayDateOnly());
  const [conversationSummary, setConversationSummary] = useState("");
  const [contactPersonName, setContactPersonName] = useState("");
  const [contactPersonPhone, setContactPersonPhone] = useState("");
  const [nextActionDate, setNextActionDate] = useState(defaultNextContactDate());
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setCustomers(await searchCustomersAction(customerQuery));
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  function resetForm() {
    setSelectedCustomer(null);
    setCustomerQuery("");
    setContactType("presencial");
    setVisitedAt(todayDateOnly());
    setConversationSummary("");
    setContactPersonName("");
    setContactPersonPhone("");
    setNextActionDate(defaultNextContactDate());
    setNotes("");
  }

  function handleSubmit() {
    setError(null);
    setSuccess(null);

    if (!selectedCustomer) {
      setError("Selecione o cliente.");
      return;
    }

    const input: VisitFormInput = {
      customer_id: selectedCustomer.id,
      contact_type: contactType,
      visited_at: visitedAt,
      conversation_summary: conversationSummary,
      contact_person_name: contactPersonName,
      contact_person_phone: contactPersonPhone,
      next_action_date: nextActionDate,
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
      onSuccess?.();
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
            <div className="flex items-center justify-between rounded-lg border border-slate-300 bg-slate-50 px-3 py-2">
              <div>
                <p className="text-sm font-medium">{selectedCustomer.company_name}</p>
                <p className="text-xs text-slate-500">
                  {[selectedCustomer.city, selectedCustomer.state]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-brand-600 hover:underline"
              >
                Trocar
              </button>
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

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Tipo de contato
          </label>
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
            <label className="text-sm font-medium text-slate-700">
              Data do contato
            </label>
            <input
              type="date"
              value={visitedAt}
              onChange={(e) => setVisitedAt(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Próximo contato
            </label>
            <input
              type="date"
              value={nextActionDate}
              onChange={(e) => setNextActionDate(e.target.value)}
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Com quem falou
            </label>
            <input
              type="text"
              value={contactPersonName}
              onChange={(e) => setContactPersonName(e.target.value)}
              placeholder="Nome do contato"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-slate-700">
              Telefone / WhatsApp
            </label>
            <input
              type="text"
              value={contactPersonPhone}
              onChange={(e) => setContactPersonPhone(e.target.value)}
              placeholder="(00) 00000-0000"
              className="h-10 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Como foi o contato
          </label>
          <textarea
            value={conversationSummary}
            onChange={(e) => setConversationSummary(e.target.value)}
            rows={4}
            placeholder="Resumo da conversa, interesse, objeções, próximos passos..."
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-slate-700">
            Observações adicionais
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={2}
            placeholder="Opcional"
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>

        {error ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
        {success ? (
          <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
            {success}
          </p>
        ) : null}

        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full sm:w-auto"
        >
          {isPending ? "Salvando..." : "Salvar visita"}
        </Button>
      </CardContent>
    </Card>
  );
}
