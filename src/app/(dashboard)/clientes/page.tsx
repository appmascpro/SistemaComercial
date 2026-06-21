import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { CustomersTable } from "@/components/customers/customers-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCustomersForTenant } from "@/lib/customers/queries";

export const dynamic = "force-dynamic";

export default async function ClientesPage() {
  const { customers, total } = await getCustomersForTenant();

  return (
    <div>
      <PageHeader
        title="Clientes"
        description={`Base com ${total} cliente(s). Cadastro completo para cotações e pedidos.`}
        action={
          <Link
            href="/clientes/novo"
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Novo cliente
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Base de clientes</CardTitle>
        </CardHeader>
        <CardContent>
          <CustomersTable customers={customers} />
        </CardContent>
      </Card>
    </div>
  );
}
