import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/layout/empty-module";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function CotacoesPage() {
  return (
    <div>
      <PageHeader
        title="Cotações"
        description="Crie propostas comerciais com cálculo de preços, impostos e geração de PDF."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova cotação
          </Button>
        }
      />
      <EmptyModule
        title="Módulo de Cotações"
        description="Pesquise produtos, selecione tamanhos, aplique descontos dentro da faixa permitida e gere PDF da proposta."
      />
    </div>
  );
}
