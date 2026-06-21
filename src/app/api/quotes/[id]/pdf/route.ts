import { NextResponse } from "next/server";
import { renderQuotePdfBuffer } from "@/lib/pdf/render-quote-pdf";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { searchParams } = new URL(request.url);
    const isOrder = searchParams.get("tipo") === "pedido";
    const buffer = await renderQuotePdfBuffer(id, {
      documentTitle: isOrder ? "PEDIDO CONFIRMADO" : "PROPOSTA COMERCIAL",
    });
    const filePrefix = isOrder ? "pedido" : "cotacao";

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filePrefix}-${id}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Erro ao gerar PDF.";
    return NextResponse.json({ error: message }, { status: 404 });
  }
}
