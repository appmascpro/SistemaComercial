import { PageHeader } from "@/components/layout/page-header";
import { SampleForm } from "@/components/samples/sample-form";
import { getCarriersForSelect } from "@/lib/carriers/queries";

export const dynamic = "force-dynamic";

export default async function NovaAmostraPage() {
  const carriers = await getCarriersForSelect().catch(() => []);

  return (
    <div>
      <PageHeader
        title="Nova amostra"
        description="Registre produtos enviados, transportadora e follow-ups automáticos (2, 7 e 15 dias)."
      />
      <SampleForm carriers={carriers} />
    </div>
  );
}
