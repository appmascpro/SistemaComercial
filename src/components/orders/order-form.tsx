"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Save, Search, Trash2 } from "lucide-react";
import { getProductQuotePricingAction } from "@/app/actions/quotes";
import { searchProductsAction } from "@/app/actions/customers";
import { updateOrderAction } from "@/app/actions/orders";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { calculateMarkup, formatMarkupPercent } from "@/lib/quotes/markup";
import { formatCurrency } from "@/lib/utils";
import type { OrderDetail, OrderFormInput } from "@/types/order";
import type { ProductSearchResult } from "@/types/quote";

interface DraftItem {
  key: string;
  product: ProductSearchResult;
  package_id: string | null;
  quantity: number;
  unit_price: number;
  min_price: number;
  max_price: number;
}

function getItemMarkup(item: DraftItem) {
  return calculateMarkup(
    item.unit_price,
    item.min_price,
    item.max_price,
    item.quantity
  );
}

export function OrderForm({
  order,
  initialProducts,
}: {
  order: OrderDetail;
  initialProducts: ProductSearchResult[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const [productQuery, setProductQuery] = useState("");
  const [products, setProducts] = useState<ProductSearchResult[]>([]);
  const [items, setItems] = useState<DraftItem[]>([]);
  const [paymentTerms, setPaymentTerms] = useState(order.payment_terms ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");

  const markupSummary = useMemo(() => {
    let totalMarkupBrl = 0;
    for (const item of items) {
      totalMarkupBrl += getItemMarkup(item).markupBrlLine;
    }
    return { totalMarkupBrl: Math.round(totalMarkupBrl * 100) / 100 };
  }, [items]);

  useEffect(() => {
    const timer = setTimeout(async () => {
      setProducts(await searchProductsAction(productQuery));
    }, 250);
    return () => clearTimeout(timer);
  }, [productQuery]);

  useEffect(() => {
    if (!initialProducts.length || items.length > 0) return;

    const productMap = new Map(initialProducts.map((p) => [p.id, p]));

    async function loadItems() {
      const draftItems: DraftItem[] = [];

      for (const item of order.items) {
        const product = productMap.get(item.product_id);
        if (!product) continue;

        const pricing = await getProductQuotePricingAction(
          item.product_id,
          item.package_id
        );

        draftItems.push({
          key: item.id,
          product,
          package_id: item.package_id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          min_price: pricing?.min_price ?? item.unit_price,
          max_price: pricing?.max_price ?? item.unit_price,
        });
      }

      setItems(draftItems);
    }

    void loadItems();
  }, [order.items, initialProducts, items.length]);

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
        min_price: pricing.min_price,
        max_price: pricing.max_price,
      },
    ]);
    setProductQuery("");
    setProducts([]);
    setError(null);
  }

  async function changePackage(
    key: string,
    productId: string,
    packageId: string | null
  ) {
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

  function handleSubmit() {
    setError(null);

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

    const payload: OrderFormInput = {
      payment_terms: paymentTerms,
      notes,
      items: items.map((item) => ({
        product_id: item.product.id,
        package_id: item.package_id,
        quantity: item.quantity,
        unit_price: item.unit_price,
      })),
    };

    startTransition(async () => {
      const result = await updateOrderAction(order.id, payload);
      if (result.error) {
        setError(result.error);
        return;
      }
      router.push(`/pedidos/${order.id}`);
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
        <CardContent>
          <div className="rounded-lg border border-slate-200 bg-slate-50/60 p-3">
            <p className="font-medium text-slate-900">
              {order.customer.company_name}
            </p>
            <p className="text-sm text-slate-600">
              {[order.customer.city, order.customer.state]
                .filter(Boolean)
                .join(" / ") || "—"}
            </p>
            {order.quote_number ? (
              <p className="mt-1 text-xs text-slate-500">
                Origem: cotação {order.quote_number}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Produtos do pedido</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
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
            <ul className="max-h-48 divide-y divide-slate-100 overflow-y-auto rounded-lg border border-slate-200">
              {products.map((product) => (
                <li key={product.id}>
                  <button
                    type="button"
                    onClick={() => addProduct(product)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2 text-left text-sm hover:bg-slate-50"
                  >
                    <span className="font-medium">{product.commercial_name}</span>
                    <span className="text-xs text-slate-500">
                      {product.internal_code}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          {items.length === 0 ? (
            <p className="text-sm text-slate-500">Adicione produtos ao pedido.</p>
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
                      <th className="px-2 py-2"></th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {items.map((item) => {
                      const markup = getItemMarkup(item);
                      return (
                        <tr key={item.key}>
                          <td className="px-2 py-2 font-medium">
                            {item.product.commercial_name}
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
                                className="h-8 rounded border px-1 text-xs"
                              >
                                {item.product.packages.map((pkg) => (
                                  <option key={pkg.id} value={pkg.id}>
                                    {pkg.name}
                                  </option>
                                ))}
                              </select>
                            ) : (
                              "Padrão"
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
                              className="h-8 w-16 rounded border px-1 text-right text-xs"
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
                              className="h-8 w-24 rounded border px-1 text-right text-xs"
                            />
                          </td>
                          <td className="px-2 py-2 text-right text-xs font-semibold text-brand-700">
                            {formatMarkupPercent(markup.markupPercent)}
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

              <div className="rounded-lg border border-emerald-200 bg-emerald-50/60 px-4 py-3">
                <p className="text-xs font-medium uppercase text-emerald-800">
                  Markup total
                </p>
                <p className="text-lg font-semibold text-emerald-900">
                  {formatCurrency(markupSummary.totalMarkupBrl, "BRL")}
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
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Condições de pagamento</span>
            <input
              value={paymentTerms}
              onChange={(e) => setPaymentTerms(e.target.value)}
              className="h-9 w-full rounded-lg border border-slate-200 px-3 text-sm"
            />
          </label>
          <label className="block text-sm sm:col-span-2">
            <span className="mb-1 block text-slate-600">Observações</span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm"
            />
          </label>
        </CardContent>
      </Card>

      <Button type="button" onClick={handleSubmit} disabled={isPending} size="lg">
        <Save className="h-4 w-4" />
        {isPending ? "Salvando..." : "Salvar pedido"}
      </Button>
    </div>
  );
}
