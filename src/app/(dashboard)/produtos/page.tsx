import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getProductsForTenant } from "@/lib/company/get-company";
import { formatCurrency } from "@/lib/utils";
import { Plus, Upload } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProdutosPage() {
  const { products, total, ptax } = await getProductsForTenant();

  return (
    <div>
      <PageHeader
        title="Produtos"
        description={`Catálogo com ${total} produto(s). PTAX venda: ${formatCurrency(ptax.rate, "BRL")}/USD (${new Date(ptax.validFrom + "T12:00:00").toLocaleDateString("pt-BR")}).`}
        action={
          <div className="flex gap-2">
            <Link
              href="/produtos/importar"
              className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              <Upload className="h-4 w-4" />
              Importar planilha
            </Link>
            <span className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white opacity-60">
              <Plus className="h-4 w-4" />
              Novo produto
            </span>
          </div>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Catálogo</CardTitle>
        </CardHeader>
        <CardContent>
          {products.length === 0 ? (
            <p className="py-8 text-center text-sm text-slate-500">
              Nenhum produto encontrado.{" "}
              <Link href="/produtos/importar" className="text-brand-600 hover:underline">
                Importar planilha
              </Link>
            </p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="min-w-full divide-y divide-slate-200 text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Código
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Produto
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Descrição
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      INCI
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">
                      Preço USD
                    </th>
                    <th className="px-3 py-2 text-right font-medium text-slate-600">
                      Preço BRL
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Moeda
                    </th>
                    <th className="px-3 py-2 text-left font-medium text-slate-600">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 bg-white">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-slate-50/80">
                      <td className="px-3 py-2 font-mono text-xs text-slate-500">
                        {product.internal_code}
                      </td>
                      <td className="px-3 py-2 font-medium text-slate-900">
                        {product.commercial_name}
                      </td>
                      <td className="max-w-[220px] truncate px-3 py-2 text-slate-600">
                        {product.description ?? "—"}
                      </td>
                      <td className="max-w-[200px] truncate px-3 py-2 text-slate-500">
                        {product.inci_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {product.price_usd != null
                          ? formatCurrency(product.price_usd, "USD")
                          : "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {product.price_brl_display != null ? (
                          <span
                            title={
                              product.pricing_currency === "USD"
                                ? `Calculado: USD × PTAX (${formatCurrency(ptax.rate, "BRL")})`
                                : undefined
                            }
                          >
                            {formatCurrency(product.price_brl_display, "BRL")}
                            {product.pricing_currency === "USD" && (
                              <span className="ml-1 text-[10px] text-slate-400">
                                PTAX
                              </span>
                            )}
                          </span>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td className="px-3 py-2">
                        <span
                          className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            product.pricing_currency === "USD"
                              ? "bg-blue-50 text-blue-700"
                              : "bg-emerald-50 text-emerald-700"
                          }`}
                        >
                          {product.pricing_currency}
                        </span>
                      </td>
                      <td className="px-3 py-2">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-600">
                          {product.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          {total > products.length && (
            <p className="mt-2 text-xs text-slate-500">
              Exibindo {products.length} de {total} produtos.
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
