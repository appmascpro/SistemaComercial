"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Plus, Search, Trash2 } from "lucide-react";
import {
  createCustomerQuickAction,
  searchCustomersAction,
  searchProductsAction,
} from "@/app/actions/customers";
import { createSampleAction, updateSampleAction } from "@/app/actions/samples";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CarrierOption } from "@/lib/carriers/queries";
import type { CustomerSearchResult } from "@/types/quote";
import type { ProductSearchResult } from "@/types/quote";
import type { SampleDetail, SampleFormInput } from "@/types/sample";

interface DraftItem {
  key: string;
  product: ProductSearchResult;
  package_id: string | null;
  quantity: number;
}

function todayDateInput(): string {
  return new Date().toISOString().slice(0, 10);
}

export function SampleForm({
  sample,
  initialProducts,
  carriers = [],
}: {
  sample?: SampleDetail;
  initialProducts?: ProductSearchResult[];
  carriers?: CarrierOption[];
}) {
  const isEditing = Boolean(sample);
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [customerQuery, setCustomerQuery] = useState("");
  const [customers, setCustomers] = useState<CustomerSearchResult[]>([]);
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSearchResult | null>(null);

  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [sentAt, setSentAt] = useState(todayDateInput());
  const [carrierId, setCarrierId] = useState("");
  const [carrierName, setCarrierName] = useState("");
  const [trackingCode, setTrackingCode] = useState("");
  const [internalCost, setInternalCost] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    const timer = setTimeout(async () => {
      setCustomers(await searchCustomersAction(customerQuery));
    }, 250);
    return () => clearTimeout(timer);
  }, [customerQuery]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setProducts(await searchProductsAction(productQuery));
    }, 250);
    return () => clearTimeout(timer);
  }, [productQuery]);

  useEffect(() => {
    if (!sample || !initialProducts?.length || items.length > 0) return;

    setSelectedCustomer({
      id: sample.customer.id,
      company_name: sample.customer.company_name,
      city: sample.customer.city,
      state: sample.customer.state,
      document: sample.customer.document,
    });
    setSentAt(sample.sent_at?.slice(0, 10) ?? todayDateInput());
    setCarrierId(sample.carrier_id ?? "");
    setCarrierName(sample.carrier_name ?? sample.carrier?.name ?? "");
    setTrackingCode(sample.tracking_code ?? "");
    setInternalCost(
      sample.internal_cost != null ? String(sample.internal_cost) : ""
    );
    setNotes(sample.notes ?? "");

    const productMap = new Map(initialProducts.map((p) => [p.id, p]));
    const draftItems: DraftItem[] = [];

    for (const item of sample.items) {
      const product = productMap.get(item.product_id);
      if (!product) continue;

      draftItems.push({
        key: item.id,
        product,
        package_id: item.package_id,
        quantity: item.quantity,
      });
    }

    setItems(draftItems);
  }, [sample, initialProducts, items.length]);

  function addProduct(product: ProductSearchResult) {
    const defaultPackage =
      product.packages.find((p) => p.is_default) ?? product.packages[0] ?? null;

    setItems((current) => [
      ...current,
      {
        key: `${product.id}-${Date.now()}`,
        product,
        package_id: defaultPackage?.id ?? null,
        quantity: 1,
      },
    ]);
    setProductQuery("");
    setProducts([]);
  }

  function handleSubmit() {
    setError(null);
    if (!selectedCustomer) {
      setError("Selecione um cliente.");
      return;
    }
    if (items.length === 0) {
      setError("Adicione ao menos um produto.");
      return;
    }

    const cost = internalCost.trim().replace(",", ".");
    const parsedCost = cost ? Number(cost) : null;

    const payload: SampleFormInput = {
      customer_id: selectedCustomer.id,
      sent_at: sentAt || undefined,
      carrier_id: carrierId || null,
      carrier_name: carrierName,
      tracking_code: trackingCode,
      internal_cost:
        parsedCost != null && Number.isFinite(parsedCost) ? parsedCost : null,
      notes,
      items: items.map((item) => ({
        product_id: item.product.id,
        package_id: item.package_id,
        quantity: item.quantity,
      })),
    };

    startTransition(async () => {
      const result = isEditing
        ? await updateSampleAction(sample!.id, payload)
        : await createSampleAction(payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(result.sampleId ? `/amostras/${result.sampleId}` : "/amostras");
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
                <p className="font-medium">{selectedCustomer.company_name}</p>
                <p className="text-sm text-slate-600">
                  {[selectedCustomer.city, selectedCustomer.state]
                    .filter(Boolean)
                    .join(" / ") || "—"}
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
                  placeholder="Buscar cliente..."
                  className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm"
                />
              </div>
              {customers.length > 0 ? (
                <ul className="max-h-48 divide-y divide-slate-300 overflow-y-auto rounded-lg border">
                  {customers.map((c) => (
                    <li key={c.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedCustomer(c);
                          setCustomerQuery("");
                          setCustomers([]);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                      >
                        {c.company_name}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : null}
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos da amostra</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={productQuery}
              onChange={(e) => setProductQuery(e.target.value)}
              placeholder="Buscar produto, descrição ou INCI..."
              className="h-10 w-full rounded-lg border border-slate-300 pl-9 pr-3 text-sm"
            />
          </div>

          {products.length > 0 ? (
            <ul className="max-h-48 divide-y divide-slate-300 overflow-y-auto rounded-lg border">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium">{product.commercial_name}</span>
                    <span className="ml-2 text-xs text-slate-500">
                      {product.internal_code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {items.length > 0 ? (
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-left">Emb.</th>
                    <th className="px-3 py-2 text-left">Qtd</th>
                    <th className="px-3 py-2"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-300">
                  {items.map((item) => (
                    <tr key={item.key}>
                      <td className="px-3 py-2 font-medium">
                        {item.product.commercial_name}
                      </td>
                      <td className="px-3 py-2">
                        {item.product.packages.length > 0 ? (
                          <select
                            value={item.package_id ?? ""}
                            onChange={(e) =>
                              setItems((list) =>
                                list.map((i) =>
                                  i.key === item.key
                                    ? {
                                        ...i,
                                        package_id: e.target.value || null,
                                      }
                                    : i
                                )
                              )
                            }
                            className="h-8 rounded border px-2 text-xs"
                          >
                            {item.product.packages.map((p) => (
                              <option key={p.id} value={p.id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        ) : (
                          "Padrão"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0.0001"
                          step="any"
                          value={item.quantity}
                          onChange={(e) =>
                            setItems((list) =>
                              list.map((i) =>
                                i.key === item.key
                                  ? { ...i, quantity: Number(e.target.value) }
                                  : i
                              )
                            )
                          }
                          className="h-8 w-20 rounded border px-2 text-xs"
                        />
                      </td>
                      <td className="px-3 py-2">
                        <button
                          type="button"
                          onClick={() =>
                            setItems((list) => list.filter((i) => i.key !== item.key))
                          }
                          className="text-slate-400 hover:text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-slate-500">Adicione produtos à amostra.</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Envio e custo</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          {!isEditing ? (
            <label className="block text-sm">
              <span className="mb-1 block text-slate-600">Data de envio</span>
              <input
                type="date"
                value={sentAt}
                onChange={(e) => setSentAt(e.target.value)}
                className="h-9 w-full rounded-lg border border-slate-300 px-3"
              />
              <span className="mt-1 block text-xs text-slate-500">
                Ao informar a data, a amostra já entra como enviada e dispara
                follow-ups em 2, 7 e 15 dias.
              </span>
            </label>
          ) : null}

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Transportadora</span>
            {carriers.length > 0 ? (
              <select
                value={carrierId}
                onChange={(e) => {
                  setCarrierId(e.target.value);
                  const selected = carriers.find((c) => c.id === e.target.value);
                  if (selected) setCarrierName(selected.name);
                }}
                className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
              >
                <option value="">Outra / informar abaixo</option>
                {carriers.map((carrier) => (
                  <option key={carrier.id} value={carrier.id}>
                    {carrier.name}
                    {[carrier.city, carrier.state].filter(Boolean).join(" / ")
                      ? ` — ${[carrier.city, carrier.state].filter(Boolean).join(" / ")}`
                      : ""}
                  </option>
                ))}
              </select>
            ) : null}
            <input
              value={carrierName}
              onChange={(e) => setCarrierName(e.target.value)}
              placeholder="Nome da transportadora"
              className="mt-2 h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Rastreio</span>
            <input
              value={trackingCode}
              onChange={(e) => setTrackingCode(e.target.value)}
              placeholder="Código de rastreamento"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
            />
          </label>

          <label className="block text-sm">
            <span className="mb-1 block text-slate-600">Custo interno (R$)</span>
            <input
              value={internalCost}
              onChange={(e) => setInternalCost(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
              className="h-9 w-full rounded-lg border border-slate-300 px-3 text-sm"
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

      <Button type="button" onClick={handleSubmit} disabled={isPending} size="lg">
        <Plus className="h-4 w-4" />
        {isPending ? "Salvando..." : isEditing ? "Salvar alterações" : "Registrar amostra"}
      </Button>
    </div>
  );
}
