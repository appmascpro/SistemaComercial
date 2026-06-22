import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { PageHeader } from "@/components/layout/page-header";
import { SampleForm } from "@/components/samples/sample-form";
import { canEditSample } from "@/lib/edit/status";
import { getProductsByIds } from "@/lib/quotes/queries";
import { getCarriersForSelect } from "@/lib/carriers/queries";
import { getSampleById } from "@/lib/samples/queries";

export const dynamic = "force-dynamic";

export default async function EditarAmostraPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sample = await getSampleById(id);

  if (!sample) notFound();

  if (!canEditSample(sample)) {
    redirect(`/amostras/${id}`);
  }

  const products = await getProductsByIds(
    sample.items.map((item) => item.product_id)
  );
  const carriers = await getCarriersForSelect().catch(() => []);

  return (
    <div>
      <PageHeader
        title={`Editar ${sample.sample_number ?? "amostra"}`}
        description="Inclua ou remova produtos antes do envio."
        action={
          <Link
            href={`/amostras/${sample.id}`}
            className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
          >
            Voltar
          </Link>
        }
      />
      <SampleForm sample={sample} initialProducts={products} carriers={carriers} />
    </div>
  );
}
