import { NextResponse } from "next/server";
import { syncPtaxFromBcbForAllTenants } from "@/lib/pricing/ptax";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isAuthorized(request: Request): boolean {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;

  const auth = request.headers.get("authorization") ?? "";
  if (auth === `Bearer ${secret}`) return true;

  return request.headers.get("x-cron-secret") === secret;
}

export async function POST(request: Request) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      slot?: string;
      force?: boolean;
    };

    const results = await syncPtaxFromBcbForAllTenants({
      force: body.force === true,
    });

    const updated = results.filter((item) => item.result.updated).length;

    return NextResponse.json({
      ok: true,
      slot: body.slot ?? "manual",
      tenants: results.length,
      updated,
      results: results.map((item) => ({
        tenantId: item.tenantId,
        updated: item.result.updated,
        rate: item.result.rate,
        referenceDate: item.result.referenceDate,
        message: item.result.message,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        error:
          error instanceof Error
            ? error.message
            : "Falha ao sincronizar PTAX BCB.",
      },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  return POST(request);
}
