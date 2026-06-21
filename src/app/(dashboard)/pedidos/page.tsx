import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/layout/empty-module";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function PedidosPage() {
  return (
    <div>
      <PageHeader
        title="Pedidos"
        description="Converta cotações em pedidos, acompanhe status e gere espelho em PDF."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo pedido
          </Button>
        }
      />
      <EmptyModule
        title="Módulo de Pedidos"
        description="Registre transportadora, condição de pagamento, status do pedido e gere espelho em PDF."
      />
    </div>
  );
}
