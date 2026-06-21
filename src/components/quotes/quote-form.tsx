"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  createCustomerQuickAction,
  getCustomerForQuoteAction,
  searchCustomersAction,
  searchProductsAction,
} from "@/app/actions/customers";
import {
  createQuoteAction,
  getProductQuotePricingAction,
} from "@/app/actions/quotes";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateMarkup, formatMarkupPercent } from "@/lib/quotes/markup";
import { formatCurrency } from "@/lib/utils";
import type {
  CustomerSearchResult,
  ProductSearchResult,
  QuoteFormInput,
} from "@/types/quote";

interface DraftItem {
  key: string;
  product: ProductSearchResult;
  package_id: string | null;
  quantity: number;
  unit_price: number;
  list_price: number;
  min_price: number;
  max_price: number;
}

function defaultValidUntil(): string {
  const date = new Date();
  date.setDate(date.getDate() + 30);
  return date.toISOString().slice(0, 10);
}

function getItemMarkup(item: DraftItem) {
  return calculateMarkup(
    item.unit_price,
    item.min_price,
    item.max_price,
    item.quantity
  );
}

export function QuoteForm({ initialCustomerId }: { initialCustomerId?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);
  const [showNewCustomer, setShowNewCustomer] = useState(false);
  const [newCustomer, setNewCustomer] = useState({
    company_name: "",
    state: "",
    city: "",
    email: "",
  });

  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [validUntil, setValidUntil] = useState(defaultValidUntil());
  const [notes, setNotes] = useState("");

  const markupSummary = useMemo(() => {
    let totalMarkupBrl = 0;
    for (const item of items) {
      totalMarkupBrl += getItemMarkup(item).markupBrlLine;
    }
    return { totalMarkupBrl: Math.round(totalMarkupBrl * 100) / 100 };
  }, [items]);

  useEffect(() => {
    if (!initialCustomerId || selectedCustomer) return;
    getCustomerForQuoteAction(initialCustomerId).then((customer) => {
      if (customer) setSelectedCustomer(customer);
    });
  }, [initialCustomerId, selectedCustomer]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const results = await searchCustomersAction(customerQuery);
      setCustomers(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      const results = await searchProductsAction(productQuery);
      setProducts(results);
    }, 250);
    return () => clearTimeout(timer);
  }, [productQuery]);

  async function addProduct(product: ProductSearchResult) {
    const defaultPackage =
      product.packages.find((p) => p.is_default) ?? product.packages[0] ?? null;

    const pricing = await getProductQuotePricingAction(
      product.id,
      defaultPackage?.id ?? null
    );

    if (!pricing) {
      setError("Produto sem preço cadastrado para esta embalagem.");
      return;
    }

    setItems((current) => [
      ...current,
      {
        key: `${product.id}-${Date.now()}`,
        product,
        package_id: defaultPackage?.id ?? null,
        quantity: 1,
        unit_price: pricing.max_price,
        list_price: pricing.list_price,
        min_price: pricing.min_price,
        max_price: pricing.max_price,
      },
    ]);
    setProductQuery("");
    setProducts([]);
    setError(null);
  }

  async function changePackage(key: string, productId: string, packageId: string | null) {
    const pricing = await getProductQuotePricingAction(productId, packageId);
    if (!pricing) {
      setError("Preço não encontrado para esta embalagem.");
      return;
    }

    setItems((current) =>
      current.map((item) =>
        item.key === key
          ? {
              ...item,
              package_id: packageId,
              list_price: pricing.list_price,
              min_price: pricing.min_price,
              max_price: pricing.max_price,
              unit_price: pricing.max_price,
            }
          : item
      )
    );
  }

  function updateItem(key: string, patch: Partial<DraftItem>) {
    setItems((current) =>
      current.map((item) => (item.key === key ? { ...item, ...patch } : item))
    );
  }

  function removeItem(key: string) {
    setItems((current) => current.filter((item) => item.key !== key));
  }

  async function handleCreateCustomer() {
    setError(null);
    const result = await createCustomerQuickAction(newCustomer);
    if (result.error) {
      setError(result.error);
      return;
    }
    if (result.customer) {
      setSelectedCustomer(result.customer);
      setShowNewCustomer(false);
      setNewCustomer({ company_name: "", state: "", city: "", email: "" });
    }
  }

  function handleSubmit() {
    setError(null);

    if (!selectedCustomer) {
      setError("Selecione ou cadastre um cliente.");
      return;
    }

    if (items.length === 0) {
      setError("Adicione ao menos um produto.");
      return;
    }

    for (const item of items) {
      if (item.unit_price < item.min_price) {
        setError(
          `Preço de "${item.product.commercial_name}" abaixo do mínimo (${formatCurrency(item.min_price, "BRL")}).`
        );
        return;
      }
    }

    const payload: QuoteFormInput = {
      customer_id: selectedCustomer.id,
      valid_until: validUntil,
      notes,
      items: items.map((item) => ({
        product_id: item.product.id,
        package_id: item.package_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    startTransition(async () => {
      const result = await createQuoteAction(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      if (result.quoteId) {
        router.push(`/cotacoes/${result.quoteId}`);
      } else {
        router.push("/cotacoes");
      }
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
          <CardTitle>Cliente</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {selectedCustomer ? (
            <div className="flex items-start justify-between rounded-lg border border-brand-100 bg-brand-50/50 p-3">
              <div>
                <p className="font-medium text-slate-900">
                  {selectedCustomer.company_name}
                </p>
                <p className="text-sm text-slate-600">
                  {[selectedCustomer.city, selectedCustomer.state]
                    .filter(Boolean)
                    .join(" / ") || "Sem localidade"}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCustomer(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Trocar
              </button>
            </div>
          ) : (
            <>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={customerQuery}
                  onChange={(e) => setCustomerQuery(e.target.value)}
                  placeholder="Buscar cliente por nome ou documento..."
                  className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-brand-500 focus:ring-2"
                />
              </div>

              {customers.length > 0 ? (
                <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
                  {customers.map((customer) => (
                    <li key={customer.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(customer);
                          setCustomerQuery("");
                          setCustomers([]);
                        }}
                        className="flex w-full items-center justify-between px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        <span className="font-medium">{customer.company_name}</span>
                        <span className="text-xs text-slate-500">
                          {[customer.city, customer.state]
                            .filter(Boolean)
                            .join(" / ")}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}

              <button
                type="button"
                onClick={() => setShowNewCustomer((v) => !v)}
                className="text-sm font-medium text-brand-600 hover:underline"
              >
                {showNewCustomer
                  ? "Cancelar cadastro rápido"
                  : "+ Cadastrar cliente rápido"}
              </button>

              {showNewCustomer ? (
                <div className="grid gap-3 rounded-lg border border-slate-200 p-4 sm:grid-cols-2">
                  <input
                    value={newCustomer.company_name}
                    onChange={(e) =>
                      setNewCustomer((c) => ({
                        ...c,
                        company_name: e.target.value,
                      }))
                    }
                    placeholder="Nome / razão social *"
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2"
                  />
                  <input
                    value={newCustomer.city}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, city: e.target.value }))
                    }
                    placeholder="Cidade"
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm"
                  />
                  <input
                    value={newCustomer.state}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, state: e.target.value }))
                    }
                    placeholder="UF"
                    maxLength={2}
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm uppercase"
                  />
                  <input
                    value={newCustomer.email}
                    onChange={(e) =>
                      setNewCustomer((c) => ({ ...c, email: e.target.value }))
                    }
                    placeholder="E-mail"
                    className="h-9 rounded-lg border border-slate-200 px-3 text-sm sm:col-span-2"
                  />
                  <Button
                    type="button"
                    size="sm"
                    onClick={handleCreateCustomer}
                    className="sm:col-span-2"
                  >
                    Salvar cliente
                  </Button>
                </div>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-xs text-slate-500">
            Markup: 0% no preço mínimo · 100% no preço máximo · acima do máximo
            continua subindo (101%, 102%…).
          </p>

          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar por produto, descrição ou INCI..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm outline-none ring-brand-500 focus:ring-2"
            />
          </div>

          {products.length > 0 ? (
            <ul className="max-h-56 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{product.commercial_name}</p>
                      <p className="text-xs text-slate-500">
                        {product.internal_code}
                        {product.min_price != null && product.max_price != null
                          ? ` · Mín ${formatCurrency(product.min_price, "BRL")} · Máx ${formatCurrency(product.max_price, "BRL")}`
                          : ""}
                      </p>
                    </div>
                    <span className="shrink-0 text-xs font-medium text-brand-700">
                      {product.price_brl_display != null
                        ? formatCurrency(product.price_brl_display, "BRL")
                        : "—"}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {items.length === 0 ? (
            <p className="text-sm text-slate-500">
              Busque e adicione produtos à cotação.
            </p>
          ) : (
            <>
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="min-w-full text-sm">
                  <thead className="bg-slate-50 text-left text-xs text-slate-600">
                    <tr>
                      <th className="px-2 py-2">Produto</th>
                      <th className="px-2 py-2">Emb.</th>
                      <th className="px-2 py-2 text-right">Qtd</th>
                      <th className="px-2 py-2 text-right">Mín</th>
                      <th className="px-2 py-2 text-right">Máx</th>
                      <th className="px-2 py-2 text-right">Preço unit.</th>
                      <th className="px-2 py-2 text-right">Markup %</th>
                      <th className="px-2 py-2 text-right">Markup R$</th>
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const markup = getItemMarkup(item);
                      const aboveMax = item.unit_price > item.max_price;

                      return (
                        <tr key={item.key}>
                          <td className="px-2 py-2">
                            <p className="max-w-[140px] truncate font-medium">
                              {item.product.commercial_name}
                            </p>
                            <p className="text-[10px] text-slate-500">
                              {item.product.internal_code}
                            </p>
                          </td>
                          <td className="px-2 py-2">
                            {item.product.packages.length > 0 ? (
                              <select
                                value={item.package_id ?? ""}
                                onChange={(e) =>
                                  changePackage(
                                    item.key,
                                    item.product.id,
                                    e.target.value || null
                                  )
                                }
                                className="h-8 w-full min-w-[100px] rounded border border-slate-200 px-1 text-xs"
                              >
                                {item.product.packages.map((pkg) => (
                                  <option key={pkg.id} value={pkg.id}>
                                    {pkg.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              <span className="text-slate-400">Padrão</span>
                            )}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min="0.0001"
                              step="any"
                              value={item.quantity}
                              onChange={(e) =>
                                updateItem(item.key, {
                                  quantity: Number(e.target.value),
                                })
                              }
                              className="h-8 w-16 rounded border border-slate-200 px-1 text-right text-xs"
                            />
                          </td>
                          <td className="px-2 py-2 text-right text-xs text-emerald-700">
                            {formatCurrency(item.min_price, "BRL")}
                          </td>
                          <td className="px-2 py-2 text-right text-xs text-blue-700">
                            {formatCurrency(item.max_price, "BRL")}
                          </td>
                          <td className="px-2 py-2">
                            <input
                              type="number"
                              min={item.min_price}
                              step="0.01"
                              value={item.unit_price}
                              onChange={(e) =>
                                updateItem(item.key, {
                                  unit_price: Number(e.target.value),
                                })
                              }
                              className={`h-8 w-24 rounded border px-1 text-right text-xs font-medium ${
                                aboveMax
                                  ? "border-amber-300 bg-amber-50 text-amber-900"
                                  : item.unit_price <= item.min_price
                                    ? "border-emerald-200 bg-emerald-50"
                                    : "border-slate-200"
                              }`}
                            />
                          </td>
                          <td
                            className={`px-2 py-2 text-right text-xs font-semibold ${
                              markup.markupPercent > 100
                                ? "text-amber-700"
                                : markup.markupPercent > 0
                                  ? "text-brand-700"
                                  : "text-slate-500"
                            }`}
                          >
                            {formatMarkupPercent(markup.markupPercent)}
                          </td>
                          <td className="px-2 py-2 text-right text-xs font-medium text-slate-700">
                            {formatCurrency(markup.markupBrlLine, "BRL")}
                          </td>
                          <td className="px-2 py-2">
                            <button
                              type="button"
                              onClick={() => removeItem(item.key)}
                              className="rounded p-1 text-slate-400 hover:bg-red-50 hover:text-red-600"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <div>
                  <p className="text-xs font-medium uppercase tracking-wide text-emerald-800">
                    Markup total da cotação
                  </p>
                  <p className="text-lg font-semibold text-emerald-900">
                    {formatCurrency(markupSummary.totalMarkupBrl, "BRL")}
                  </p>
                </div>
                <p className="text-xs text-emerald-700">
                  Soma do markup positivo de todas as linhas (preço − mínimo) ×
                  quantidade
                </p>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Condições</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Validade</span>
            <input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 px-3"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Observações</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Informações adicionais para o cliente..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </CardContent>
      </Card>

      <div className="flex flex-wrap gap-3">
        <Button
          type="button"
          onClick={handleSubmit}
          disabled={isPending}
          size="lg"
        >
          <Plus className="h-4 w-4" />
          {isPending ? "Salvando..." : "Gerar cotação"}
        </Button>
      </div>
    </div>
  );
}
