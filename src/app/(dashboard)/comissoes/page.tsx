import { PageHeader } from "@/components/layout/page-header";
import { EmptyModule } from "@/components/layout/empty-module";

export default function ComissoesPage() {
  return (
    <div>
      <PageHeader
        title="Comissões"
        description="Acompanhe comissões previstas, liberadas e canceladas por vendedor."
      />
      <EmptyModule
        title="Comissões de Vendedores"
        description="Pedidos geram comissão prevista; ao faturar, a comissão é liberada. Pedidos cancelados cancelam a comissão."
      />
    </div>
  );
}
