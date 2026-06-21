"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";
import { ArrowLeft, Download, Loader2, X } from "lucide-react";

const btnOutline =
  "inline-flex h-10 min-w-[2.75rem] items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50 active:bg-slate-100";
const btnPrimary =
  "inline-flex h-10 min-w-[2.75rem] items-center justify-center gap-1.5 rounded-lg bg-brand-600 px-3 text-xs font-medium text-white hover:bg-brand-700 active:bg-brand-800";

export function QuotePdfViewer({
  quoteId,
  quoteNumber,
  backHref,
  backLabel = "Voltar para cotação",
  documentType = "cotacao",
  orderHref,
  orderNumber,
}: {
  quoteId: string;
  quoteNumber: string;
  backHref: string;
  backLabel?: string;
  documentType?: "cotacao" | "pedido";
  orderHref?: string | null;
  orderNumber?: string | null;
}) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const pdfQuery =
    documentType === "pedido" ? "?tipo=pedido" : "";
  const pdfUrl = `/api/quotes/${quoteId}/pdf${pdfQuery}`;
  const downloadUrl = `${pdfUrl}${pdfQuery ? "&" : "?"}download=1`;
  const filePrefix = documentType === "pedido" ? "pedido" : "cotacao";
  const fileName = `${filePrefix}-${quoteNumber}.pdf`;
  const title =
    documentType === "pedido"
      ? `Pedido ${quoteNumber}`
      : `Proposta ${quoteNumber}`;

  const handleClose = useCallback(() => {
    router.push(backHref);
  }, [router, backHref]);

  const handleDownload = useCallback(async () => {
    setDownloading(true);
    try {
      const response = await fetch(downloadUrl);
      if (!response.ok) {
        throw new Error("Falha ao baixar PDF.");
      }

      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = blobUrl;
      anchor.download = fileName;
      anchor.rel = "noopener";
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();

      window.setTimeout(() => URL.revokeObjectURL(blobUrl), 15_000);
    } catch {
      window.open(downloadUrl, "_blank", "noopener,noreferrer");
    } finally {
      setDownloading(false);
    }
  }, [downloadUrl, fileName]);

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-white lg:static lg:z-auto lg:-mx-6 lg:-mb-6 lg:min-h-[calc(100dvh-5rem)]">
      <div className="flex shrink-0 flex-col gap-2 border-b border-slate-200 bg-white px-3 py-2.5 shadow-sm sm:px-4 sm:py-3">
        <div className="flex items-start justify-between gap-2">
          <p className="min-w-0 flex-1 truncate pt-1 text-sm font-semibold text-slate-900">
            {title}
          </p>
          <button
            type="button"
            onClick={handleClose}
            className={`${btnOutline} shrink-0 px-2.5`}
            aria-label="Fechar"
          >
            <X className="h-4 w-4" />
            <span className="hidden sm:inline">Fechar</span>
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleDownload}
            disabled={downloading}
            className={btnOutline}
          >
            {downloading ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Download className="h-3.5 w-3.5" />
            )}
            Salvar PDF
          </button>
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
        title={title}
        className="min-h-0 flex-1 w-full border-0 bg-slate-100"
      />
    </div>
  );
}
