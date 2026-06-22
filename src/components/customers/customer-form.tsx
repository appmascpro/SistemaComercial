"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  createCustomerAction,
  updateCustomerAction,
} from "@/app/actions/customers";
import { Button } from "@/components/ui/button";
import { BRAZILIAN_STATES, CUSTOMER_TYPE_LABELS, LEAD_STATUS_LABELS, PAIN_POINT_SUGGESTIONS, PRODUCT_INTEREST_SUGGESTIONS, SEGMENT_SUGGESTIONS, type CustomerDetail, type CustomerFormInput } from "@/types/customer";

const inputClass =
  "h-9 w-full rounded-lg border border-slate-300 px-3 text-sm outline-none ring-brand-500 focus:ring-2";

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
    customer_type: customer?.customer_type ?? "",
    lead_status: customer?.lead_status ?? "",
    purchase_potential: customer?.purchase_potential ?? "",
    potential_volume: customer?.potential_volume ?? "",
    products_of_interest: customer?.products_of_interest ?? "",
    current_supplier: customer?.current_supplier ?? "",
    pain_point: customer?.pain_point ?? "",
    buyer_name: customer?.buyer_name ?? "",
    buyer_phone: customer?.buyer_phone ?? "",
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

      <section className="rounded-xl border border-slate-300 bg-white p-5">
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
            <select
              value={form.segment ?? ""}
              onChange={(e) => updateField("segment", e.target.value)}
              className={inputClass}
            >
              <option value="">Selecione</option>
              {SEGMENT_SUGGESTIONS.map((segment) => (
                <option key={segment} value={segment}>
                  {segment}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Tipo de cliente</span>
            <select
              value={form.customer_type ?? ""}
              onChange={(e) =>
                updateField(
                  "customer_type",
                  e.target.value as CustomerFormInput["customer_type"]
                )
              }
              className={inputClass}
            >
              <option value="">Selecione</option>
              {(Object.entries(CUSTOMER_TYPE_LABELS) as [keyof typeof CUSTOMER_TYPE_LABELS, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Status comercial</span>
            <select
              value={form.lead_status ?? ""}
              onChange={(e) =>
                updateField(
                  "lead_status",
                  e.target.value as CustomerFormInput["lead_status"]
                )
              }
              className={inputClass}
            >
              <option value="">Selecione</option>
              {(Object.entries(LEAD_STATUS_LABELS) as [keyof typeof LEAD_STATUS_LABELS, string][]).map(
                ([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                )
              )}
            </select>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Volume potencial</span>
            <input
              value={form.potential_volume}
              onChange={(e) => updateField("potential_volume", e.target.value)}
              placeholder="10L, 50L, 200L/mês"
              className={inputClass}
            />
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Perfil comercial</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Comprador</span>
            <input
              value={form.buyer_name}
              onChange={(e) => updateField("buyer_name", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">WhatsApp / telefone do comprador</span>
            <input
              value={form.buyer_phone}
              onChange={(e) => updateField("buyer_phone", e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Produtos de interesse</span>
            <input
              value={form.products_of_interest}
              onChange={(e) => updateField("products_of_interest", e.target.value)}
              list="customer-product-interests"
              placeholder="álcool, essência, base, laurel..."
              className={inputClass}
            />
            <datalist id="customer-product-interests">
              {PRODUCT_INTEREST_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Fornecedor atual</span>
            <input
              value={form.current_supplier}
              onChange={(e) => updateField("current_supplier", e.target.value)}
              placeholder="Quem vende hoje para o cliente"
              className={inputClass}
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Dor / necessidade</span>
            <input
              value={form.pain_point}
              onChange={(e) => updateField("pain_point", e.target.value)}
              list="customer-pain-points"
              placeholder="preço, prazo, qualidade, falta de suporte..."
              className={inputClass}
            />
            <datalist id="customer-pain-points">
              {PAIN_POINT_SUGGESTIONS.map((item) => (
                <option key={item} value={item} />
              ))}
            </datalist>
          </label>
        </div>
      </section>

      <section className="rounded-xl border border-slate-300 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Contato da empresa</h3>
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

      <section className="rounded-xl border border-slate-300 bg-white p-5">
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

      <section className="rounded-xl border border-slate-300 bg-white p-5">
        <h3 className="mb-4 text-sm font-semibold text-slate-900">Observações</h3>
        <textarea
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
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
