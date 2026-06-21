import { PageHeader } from "@/components/layout/page-header";
import { QuoteForm } from "@/components/quotes/quote-form";

export default async function NovaCotacaoPage({
  searchParams,
}: {
  searchParams: Promise<{ cliente?: string }>;
}) {
  const { cliente } = await searchParams;

  return (
    <div>
      <PageHeader
        title="Nova cotação"
        description="Selecione o cliente, adicione produtos e gere a proposta comercial."
      />
      <QuoteForm initialCustomerId={cliente} />
    </div>
  );
}
