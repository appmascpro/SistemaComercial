import { PageHeader } from "@/components/layout/page-header";
import { RouteForm } from "@/components/routes/route-form";

export default function NovaRotaPage() {
  return (
    <div>
      <PageHeader
        title="Nova rota"
        description="Organize clientes na ordem de visita e defina polo e prioridade."
      />
      <RouteForm />
    </div>
  );
}
