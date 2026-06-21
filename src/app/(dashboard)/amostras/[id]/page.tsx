import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SampleStatusSelect } from "@/components/samples/sample-status-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canEditSample } from "@/lib/edit/status";
import {
  formatCustomerAddress,
  formatDocumentLabel,
} from "@/lib/pdf/format-address";
import { getSampleById } from "@/lib/samples/queries";
import { formatDate, formatQuantity } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AmostraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const sample = await getSampleById(id);

  if (!sample) notFound();

  const shippingAddress = formatCustomerAddress(sample.customer);
  const documentLine = formatDocumentLabel(
    sample.customer.document,
    sample.customer.document_type
  );
  const editable = canEditSample(sample);

  return (
    <div>
      <PageHeader
        title={sample.sample_number ?? "Amostra"}
        description={`Cliente: ${sample.customer.company_name}`}
        action={
          <div className="flex flex-wrap gap-2">
            {editable ? (
              <Link
                href={`/amostras/${sample.id}/editar`}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
              >
                <Pencil className="h-4 w-4" />
                Editar
              </Link>
            ) : null}
            <SampleStatusSelect sampleId={sample.id} currentStatus={sample.status} />
            <a
              href={`/api/samples/${sample.id}/pdf`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex h-9 items-center gap-2 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700"
            >
              <FileDown className="h-4 w-4" />
              Baixar PDF
            </a>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Follow-up</p>
            <p className="text-lg font-semibold">
              {sample.follow_up_date
                ? formatDate(sample.follow_up_date)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Enviada em</p>
            <p className="text-lg font-semibold">
              {sample.sent_at ? formatDate(sample.sent_at) : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Itens</p>
            <p className="text-lg font-semibold">{sample.items.length}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Produtos enviados</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto rounded-lg border">
              <table className="min-w-full text-sm">
                <thead className="bg-slate-50 text-xs text-slate-600">
                  <tr>
                    <th className="px-3 py-2 text-left">Produto</th>
                    <th className="px-3 py-2 text-left">Emb.</th>
                    <th className="px-3 py-2 text-right">Qtd</th>
                    <th className="px-3 py-2 text-left">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {sample.items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{item.product_name}</p>
                        <p className="text-xs text-slate-500">{item.product_code}</p>
                      </td>
                      <td className="px-3 py-2 text-slate-600">
                        {item.package_name ?? "—"}
                      </td>
                      <td className="px-3 py-2 text-right">
                        {formatQuantity(item.quantity)}
                      </td>
                      <td className="px-3 py-2 capitalize text-slate-600">
                        {item.status}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Cliente e entrega</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <Link
                href={`/clientes/${sample.customer.id}`}
                className="font-medium text-brand-600 hover:underline"
              >
                {sample.customer.company_name}
              </Link>
              {sample.customer.trade_name ? (
                <p className="text-slate-600">{sample.customer.trade_name}</p>
              ) : null}
              {documentLine ? (
                <p className="text-slate-600">{documentLine}</p>
              ) : null}
              {sample.customer.segment ? (
                <p className="text-slate-600">Segmento: {sample.customer.segment}</p>
              ) : null}
              {sample.customer.email ? (
                <p className="text-slate-600">{sample.customer.email}</p>
              ) : null}
              {sample.customer.phone ? (
                <p className="text-slate-600">{sample.customer.phone}</p>
              ) : null}
              <div className="rounded-lg border border-blue-100 bg-blue-50/60 p-3">
                <p className="text-xs font-medium uppercase text-blue-800">
                  Endereço de entrega
                </p>
                <p className="mt-1 text-slate-700">{shippingAddress}</p>
              </div>
            </CardContent>
          </Card>

          {sample.feedback ? (
            <Card>
              <CardHeader>
                <CardTitle>Feedback</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{sample.feedback}</p>
                {sample.feedback_at ? (
                  <p className="mt-2 text-xs text-slate-400">
                    {formatDate(sample.feedback_at)}
                  </p>
                ) : null}
              </CardContent>
            </Card>
          ) : null}

          {sample.notes ? (
            <Card>
              <CardHeader>
                <CardTitle>Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-slate-600">{sample.notes}</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}
