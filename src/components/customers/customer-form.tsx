"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { BRAZILIAN_STATES, type CustomerDetail, type CustomerFormInput } from "@/types/customer";

const inputClass =
  "h-9 w-full rounded-lg border border-slate-200 px-3 text-sm outline-none ring-brand-500 focus:ring-2";

interface CustomerFormProps {
  customer?: CustomerDetail;
}

export function CustomerForm({ customer }: CustomerFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<CustomerFormInput>({
    company_name: customer?.company_name ?? "",
    trade_name: customer?.trade_name ?? "",
    document: customer?.document ?? "",
    document_type: customer?.document_type ?? "",
    segment: customer?.segment ?? "",
    purchase_potential: customer?.purchase_potential ?? "",
    email: customer?.email ?? "",
    phone: customer?.phone ?? "",
    address_line: customer?.address_line ?? "",
    address_number: customer?.address_number ?? "",
    address_complement: customer?.address_complement ?? "",
    neighborhood: customer?.neighborhood ?? "",
    city: customer?.city ?? "",
    state: customer?.state ?? "",
    zip_code: customer?.zip_code ?? "",
    notes: customer?.notes ?? "",
    status: (customer?.status as CustomerFormInput["status"]) ?? "ativo",
  });

  function updateField<K extends keyof CustomerFormInput>(
    key: K,
    value: CustomerFormInput[K]
  ) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleSubmit() {
    setError(null);
    startTransition(async () => {
      const result = customer
        ? await updateCustomerAction(customer.id, form)
        : await createCustomerAction(form);

      if (result.error) {
        setError(result.error);
        return;
      }

      router.push(
        result.customerId ? `/clientes/${result.customerId}` : "/clientes"
      );
    });
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Identificação</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Nome / Razão social *</span>
            <input
              value={form.company_name}
              onChange={(e) => updateField("company_name", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Nome fantasia</span>
            <input
              value={form.trade_name}
              onChange={(e) => updateField("trade_name", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Tipo documento</span>
            <select
              value={form.document_type ?? ""}
              onChange={(e) =>
                updateField(
                  "document_type",
                  e.target.value as CustomerFormInput["document_type"]
                )
              }
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="cnpj">CNPJ</option>
              <option value="cpf">CPF</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">CNPJ / CPF</span>
            <input
              value={form.document}
              onChange={(e) => updateField("document", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Segmento</span>
            <input
              value={form.segment}
              onChange={(e) => updateField("segment", e.target.value)}
              placeholder="Cosméticos, Pet, Bebidas..."
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Potencial de compra</span>
            <select
              value={form.purchase_potential ?? ""}
              onChange={(e) => updateField("purchase_potential", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione</option>
              <option value="alto">Alto</option>
              <option value="medio">Médio</option>
              <option value="baixo">Baixo</option>
            </select>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Contato</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">E-mail</span>
            <input
              type="email"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Telefone</span>
            <input
              value={form.phone}
              onChange={(e) => updateField("phone", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Endereço</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Logradouro</span>
            <input
              value={form.address_line}
              onChange={(e) => updateField("address_line", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Número</span>
            <input
              value={form.address_number}
              onChange={(e) => updateField("address_number", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Complemento</span>
            <input
              value={form.address_complement}
              onChange={(e) => updateField("address_complement", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Bairro</span>
            <input
              value={form.neighborhood}
              onChange={(e) => updateField("neighborhood", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Cidade</span>
            <input
              value={form.city}
              onChange={(e) => updateField("city", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">UF</span>
            <select
              value={form.state ?? ""}
              onChange={(e) => updateField("state", e.target.value)}
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
            <span className="mb-1 block text-slate-600">CEP</span>
            <input
              value={form.zip_code}
              onChange={(e) => updateField("zip_code", e.target.value)}
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Observações</h3>
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
        />
        {customer ? (
          <label className="mt-4 block text-sm">
            <span className="mb-1 block text-slate-600">Status</span>
            <select
              value={form.status}
              onChange={(e) =>
                updateField("status", e.target.value as CustomerFormInput["status"])
              }
              className={inputClass}
            >
              <option value="ativo">Ativo</option>
              <option value="inativo">Inativo</option>
            </select>
          </label>
        ) : null}
      </section>

      <Button type="button" onClick={handleSubmit} disabled={isPending} size="lg">
        {isPending ? "Salvando..." : customer ? "Salvar alterações" : "Cadastrar cliente"}
      </Button>
    </div>
  );
}
