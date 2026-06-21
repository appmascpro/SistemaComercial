import { renderToBuffer, type DocumentProps } from "@react-pdf/renderer";
import React, { type ReactElement } from "react";
import { SamplePdfDocument } from "@/lib/pdf/sample-document";
import { getSampleForPdf } from "@/lib/samples/queries";

export async function renderSamplePdfBuffer(sampleId: string): Promise<Buffer> {
  const data = await getSampleForPdf(sampleId);

  if (!data) {
    throw new Error("Amostra não encontrada.");
  }

  const buffer = await renderToBuffer(
    React.createElement(SamplePdfDocument, {
      sample: data.sample,
      company: data.company,
      payment: data.payment,
    }) as ReactElement<DocumentProps>
  );

  return Buffer.from(buffer);
}
