import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { RoutesTable } from "@/components/routes/routes-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getRoutesForTenant } from "@/lib/routes/queries";

export const dynamic = "force-dynamic";

export default async function RotasPage() {
  const routes = await getRoutesForTenant();

  return (
    <div>
      <PageHeader
        title="Rotas"
        description="Planeje visitas por polo, cidade e prioridade comercial."
        action={
          <Link
            href="/rotas/nova"
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nova rota
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Rotas planejadas</CardTitle>
        </CardHeader>
        <CardContent>
          <RoutesTable routes={routes} />
        </CardContent>
      </Card>
    </div>
  );
}
