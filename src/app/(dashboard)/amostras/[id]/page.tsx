import Link from "next/link";
import { notFound } from "next/navigation";
import { FileDown, Pencil } from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import { SampleFeedbackForm } from "@/components/samples/sample-feedback-form";
import { SampleFollowupsPanel } from "@/components/samples/sample-followups-panel";
import { SampleStatusSelect } from "@/components/samples/sample-status-select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { canEditSample } from "@/lib/edit/status";
import {
  formatCustomerAddress,
  formatDocumentLabel,
} from "@/lib/pdf/format-address";
import { getSampleFollowupsBySampleId } from "@/lib/samples/followup-queries";
import { getSampleById } from "@/lib/samples/queries";
import {
  SAMPLE_NEXT_ACTION_LABELS,
  SAMPLE_STATUS_LABELS,
  type SampleNextAction,
} from "@/types/sample";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AmostraDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [sample, followups] = await Promise.all([
    getSampleById(id),
    getSampleFollowupsBySampleId(id),
  ]);

  if (!sample) notFound();

  const shippingAddress = formatCustomerAddress(sample.customer);
  const documentLine = formatDocumentLabel(
    sample.customer.document,
    sample.customer.document_type
  );
  const editable = canEditSample(sample);
  const statusLabel =
    SAMPLE_STATUS_LABELS[sample.status as keyof typeof SAMPLE_STATUS_LABELS] ??
    sample.status;
  const carrierLabel =
    sample.carrier?.name ?? sample.carrier_name ?? "—";
  const nextActionLabel = sample.next_action
    ? SAMPLE_NEXT_ACTION_LABELS[sample.next_action as SampleNextAction]
    : null;

  return (
    <div>
      <PageHeader
        title={sample.sample_number ?? "Amostra"}
        description={`Cliente: ${sample.customer.company_name} · ${statusLabel}`}
        action={
          <div className="flex flex-wrap gap-2">
            {editable ? (
              <Link
                href={`/amostras/${sample.id}/editar`}
                className="inline-flex h-8 items-center gap-2 rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
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

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <p className="text-xs text-slate-500">Próximo follow-up</p>
            <p className="text-lg font-semibold">
              {sample.follow_up_date
                ? formatDate(sample.follow_up_date)
                : "—"}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="text-xs text-slate-500">Custo interno</p>
            <p className="text-lg font-semibold">
              {sample.internal_cost != null
                ? formatCurrency(sample.internal_cost, "BRL")
                : "—"}
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
        <div className="space-y-6 lg:col-span-2">
          <Card>
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
                  <tbody className="divide-y divide-slate-200">
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
                        <td className="px-3 py-2 text-slate-600">
                          {SAMPLE_STATUS_LABELS[
                            item.status as keyof typeof SAMPLE_STATUS_LABELS
                          ] ?? item.status}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Follow-ups automáticos</CardTitle>
            </CardHeader>
            <CardContent>
              <SampleFollowupsPanel followups={followups} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Retorno e próxima ação</CardTitle>
            </CardHeader>
            <CardContent>
              <SampleFeedbackForm sample={sample} />
              {nextActionLabel ? (
                <p className="mt-3 text-xs text-slate-500">
                  Próxima ação definida:{" "}
                  <strong>{nextActionLabel}</strong>
                  {sample.next_action === "cotar" ? (
                    <>
                      {" · "}
                      <Link
                        href={`/cotacoes/nova?cliente=${sample.customer.id}`}
                        className="text-brand-600 hover:underline"
                      >
                        Abrir cotação
                      </Link>
                    </>
                  ) : null}
                </p>
              ) : null}
            </CardContent>
          </Card>
        </div>

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
              {documentLine ? (
                <p className="text-slate-600">{documentLine}</p>
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

          <Card>
            <CardHeader>
              <CardTitle>Transporte</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-slate-600">
              <p>
                <span className="text-slate-500">Transportadora:</span>{" "}
                {carrierLabel}
              </p>
              {sample.carrier?.phone ? (
                <p>
                  <span className="text-slate-500">Tel.:</span>{" "}
                  {sample.carrier.phone}
                </p>
              ) : null}
              {sample.tracking_code ? (
                <p>
                  <span className="text-slate-500">Rastreio:</span>{" "}
                  {sample.tracking_code}
                </p>
              ) : null}
              {sample.delivered_at ? (
                <p>
                  <span className="text-slate-500">Recebida em:</span>{" "}
                  {formatDate(sample.delivered_at)}
                </p>
              ) : null}
            </CardContent>
          </Card>

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
