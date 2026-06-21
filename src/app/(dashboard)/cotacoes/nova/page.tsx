import { PageHeader } from "@/components/layout/page-header";
import { QuoteForm } from "@/components/quotes/quote-form";

export default function NovaCotacaoPage() {
  return (
    <div>
      <PageHeader
        title="Nova cotação"
        description="Selecione o cliente, adicione produtos e gere a proposta comercial."
      />
      <QuoteForm />
    </div>
  );
}
