import { NextResponse } from "next/server";
import { renderSamplePdfBuffer } from "@/lib/pdf/render-sample-pdf";
import { getSampleById } from "@/lib/samples/queries";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const sample = await getSampleById(id);
    const buffer = await renderSamplePdfBuffer(id);
    const fileName = sample?.sample_number
      ? `amostra-${sample.sample_number}.pdf`
      : `amostra-${id}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${fileName}"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar PDF.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
