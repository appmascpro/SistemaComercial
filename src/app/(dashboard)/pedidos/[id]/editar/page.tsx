import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { OrderForm } from "@/components/orders/order-form";
import { canEditOrder } from "@/lib/edit/status";
import { getOrderById } from "@/lib/orders/queries";
import { getProductsByIds } from "@/lib/quotes/queries";

export const dynamic = "force-dynamic";

export default async function EditarPedidoPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const order = await getOrderById(id);

  if (!order) notFound();

  if (!canEditOrder(order)) {
    redirect(`/pedidos/${id}`);
  }

  const products = await getProductsByIds(
    order.items.map((item) => item.product_id)
  );

  return (
    <div>
      <PageHeader
        title={`Editar ${order.order_number}`}
        description="Altere itens e condições enquanto o pedido não estiver faturado."
        action={
          <Link
            href={`/pedidos/${order.id}`}
            className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </Link>
        }
      />
      <OrderForm order={order} initialProducts={products} />
    </div>
  );
}
