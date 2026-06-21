import Link from "next/link";
import { Plus } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { QuotesTable } from "@/components/quotes/quotes-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getQuotesForTenant } from "@/lib/quotes/queries";

export const dynamic = "force-dynamic";

export default async function CotacoesPage() {
  const quotes = await getQuotesForTenant();

  return (
    <div>
      <PageHeader
        title="Cotações"
        description="Propostas comerciais com cálculo de preços, impostos e PDF tcQUÍMICA."
        action={
          <Link
            href="/cotacoes/nova"
            className="inline-flex h-8 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
          >
            <Plus className="h-4 w-4" />
            Nova cotação
          </Link>
        }
      />

      <Card>
        <CardHeader>
          <CardTitle>Propostas recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <QuotesTable quotes={quotes} />
        </CardContent>
      </Card>
    </div>
  );
}
