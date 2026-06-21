import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React, { type ReactElement } from "react";
import { QuotePdfDocument } from "@/lib/pdf/quote-document";
import { getQuoteForPdf } from "@/lib/quotes/queries";

export async function renderQuotePdfBuffer(quoteId: string): Promise<Buffer> {
  const data = await getQuoteForPdf(quoteId);

  if (!data) {
    throw new Error("Cotação não encontrada.");
  }

  const buffer = await renderToBuffer(
    React.createElement(QuotePdfDocument, {
      quote: data.quote,
      company: data.company,
      payment: data.payment,
    }) as ReactElement<DocumentProps>
  );

  return Buffer.from(buffer);
}
