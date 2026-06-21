import { PageHeader } from "@/components/layout/page-header";
import { SampleForm } from "@/components/samples/sample-form";

export default function NovaAmostraPage() {
  return (
    <div>
      <PageHeader
        title="Nova amostra"
        description="Registre produtos enviados ao cliente e programe o follow-up."
      />
      <SampleForm />
    </div>
  );
}
