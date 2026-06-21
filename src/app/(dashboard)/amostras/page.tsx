import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SamplesTable } from "@/components/samples/samples-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getSamplesForTenant } from "@/lib/samples/queries";

export const dynamic = "force-dynamic";

export default async function AmostrasPage() {
  const samples = await getSamplesForTenant();

  return (
    <div>
      <PageHeader
        title="Amostras"
        description="Envio de amostras por cliente, follow-up e feedback comercial."
        action={
          <Link
            href="/amostras/nova"
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nova amostra
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Amostras recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <SamplesTable samples={samples} />
        </CardContent>
      </Card>
    </div>
  );
}
