import Link from "next/link";
import { formatDate } from "@/lib/utils";
import {
  SAMPLE_STATUS_LABELS,
  type SampleListItem,
} from "@/types/sample";

const statusStyles: Record<string, string> = {
  pendente: "bg-slate-100 text-slate-600",
  enviado: "bg-blue-50 text-blue-700",
  recebido: "bg-cyan-50 text-cyan-700",
  testando: "bg-purple-50 text-purple-700",
  aprovado: "bg-emerald-50 text-emerald-700",
  reprovado: "bg-red-50 text-red-700",
  cancelada: "bg-slate-200 text-slate-600",
  enviada: "bg-blue-50 text-blue-700",
  entregue: "bg-emerald-50 text-emerald-700",
  feedback_recebido: "bg-purple-50 text-purple-700",
};

export function SamplesTable({ samples }: { samples: SampleListItem[] }) {
  if (samples.length === 0) {
    return (
      <p className="py-10 text-center text-sm text-slate-500">
        Nenhuma amostra registrada.{" "}
        <Link href="/amostras/nova" className="text-brand-600 hover:underline">
          Registrar primeira amostra
        </Link>
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-slate-300">
      <table className="min-w-full divide-y divide-slate-300 text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Número</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Cliente</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Itens</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Follow-up</th>
            <th className="px-3 py-2 text-left font-medium text-slate-600">Status</th>
            <th className="px-3 py-2 text-right font-medium text-slate-600">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-300 bg-white">
          {samples.map((sample) => (
            <tr key={sample.id} className="hover:bg-slate-50/80">
              <td className="px-3 py-2 font-mono text-xs">
                {sample.sample_number ?? "—"}
              </td>
              <td className="px-3 py-2">
                <p className="font-medium">{sample.customer.company_name}</p>
                <p className="text-xs text-slate-500">
                  {[sample.customer.city, sample.customer.state]
                    .filter(Boolean)
                    .join(" / ")}
                </p>
              </td>
              <td className="px-3 py-2 text-slate-600">{sample.items_count}</td>
              <td className="px-3 py-2 text-slate-600">
                {sample.follow_up_date
                  ? formatDate(sample.follow_up_date)
                  : "—"}
              </td>
              <td className="px-3 py-2">
                <span
                  className={`rounded-full px-2 py-0.5 text-xs font-medium capitalize ${
                    statusStyles[sample.status] ?? "bg-slate-100 text-slate-600"
                  }`}
                >
                  {SAMPLE_STATUS_LABELS[
                    sample.status as keyof typeof SAMPLE_STATUS_LABELS
                  ] ?? sample.status.replace("_", " ")}
                </span>
              </td>
              <td className="px-3 py-2 text-right">
                <div className="flex justify-end gap-2">
                  <Link
                    href={`/amostras/${sample.id}`}
                    className="text-xs font-medium text-brand-600 hover:underline"
                  >
                    Ver
                  </Link>
                  <a
                    href={`/api/samples/${sample.id}/pdf`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-slate-600 hover:underline"
                  >
                    PDF
                  </a>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
