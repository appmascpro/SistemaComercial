import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { OrdersTable } from "@/components/orders/orders-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getOrdersForTenant } from "@/lib/orders/queries";

export const dynamic = "force-dynamic";

export default async function PedidosPage() {
  const orders = await getOrdersForTenant();

  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Pedidos gerados a partir de cotações aprovadas. Acompanhe status e faturamento."
        action={
          <Link
            href="/cotacoes"
            className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Ver cotações
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Pedidos recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <OrdersTable orders={orders} />
        </CardContent>
      </Card>
    </div>
  );
}
