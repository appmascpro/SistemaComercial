import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/layout/empty-module";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";

export default function ClientesPage() {
  return (
    <div>
      <PageHeader
        title="Clientes"
        description="Cadastro de clientes, contatos, endereços, segmento e potencial de compra."
        action={
          <Button size="sm">
            <Plus className="h-4 w-4" />
            Novo cliente
          </Button>
        }
      />
      <EmptyModule
        title="Base de Clientes"
        description="Gerencie CNPJ/CPF, contatos, endereços, cidade, UF, segmento e histórico comercial."
      />
    </div>
  );
}
