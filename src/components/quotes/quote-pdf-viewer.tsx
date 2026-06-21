"use client";

import Link from "next/link";
import { ArrowLeft, Download } from "lucide-react";

const btnOutline =
  "inline-flex h-8 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50";
const btnPrimary =
  "inline-flex h-8 items-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700";

export function QuotePdfViewer({
  quoteId,
  quoteNumber,
  backHref,
  backLabel = "Voltar para cotação",
  orderHref,
  orderNumber,
}: {
  quoteId: string;
  quoteNumber: string;
  backHref: string;
  backLabel?: string;
  orderHref?: string | null;
  orderNumber?: string | null;
}) {
  const pdfUrl = `/api/quotes/${quoteId}/pdf`;
  const fileName = `cotacao-${quoteNumber}.pdf`;

  return (
    <div className="-mx-4 -mb-24 flex min-h-[calc(100dvh-7rem)] flex-col sm:-mx-6 lg:mb-0 lg:min-h-[calc(100dvh-5rem)]">
      <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <p className="text-sm font-semibold text-slate-900">
          Proposta {quoteNumber}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <a href={pdfUrl} download={fileName} className={btnOutline}>
            <Download className="h-3.5 w-3.5" />
            Salvar PDF
          </a>
          {orderHref && orderNumber ? (
            <Link href={orderHref} className={btnOutline}>
              Pedido {orderNumber}
            </Link>
          ) : null}
          <Link href={backHref} className={btnPrimary}>
            <ArrowLeft className="h-3.5 w-3.5" />
            {backLabel}
          </Link>
        </div>
      </div>

      <iframe
        src={pdfUrl}
        title={`Cotação ${quoteNumber}`}
        className="min-h-0 flex-1 w-full border-0 bg-slate-100"
      />
    </div>
  );
}
