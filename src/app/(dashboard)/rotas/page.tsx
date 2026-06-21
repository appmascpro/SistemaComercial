import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/layout/empty-module";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function RotasPage() {
  return (
    <div>
      <PageHeader
        title="Rotas"
        description="Planeje visitas por polo, cidade, cliente, prioridade e status."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova rota
          </Button>
        }
      />
      <EmptyModule
        title="Planejamento de Rotas"
        description="Organize visitas comerciais, histórico de conversas e próximas ações."
      />
    </div>
  );
}
