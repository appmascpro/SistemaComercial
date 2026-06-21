import { PageHeader } from "@/components/layout/page-header";
import { CustomerForm } from "@/components/customers/customer-form";

export default function NovoClientePage() {
  return (
    <div>
      <PageHeader
        title="Novo cliente"
        description="Cadastre o cliente com endereço e UF para cálculo correto de ICMS nas cotações."
      />
      <CustomerForm />
    </div>
  );
}
