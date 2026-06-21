import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/layout/empty-module";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function AmostrasPage() {
  return (
    <div>
      <PageHeader
        title="Amostras"
        description="Controle envio de amostras, status, feedback e follow-up automático."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Nova amostra
          </Button>
        }
      />
      <EmptyModule
        title="Gestão de Amostras"
        description="Registre amostras enviadas por cliente e produto, acompanhe status e feedback."
      />
    </div>
  );
}
