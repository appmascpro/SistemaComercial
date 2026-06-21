import { NextResponse } from "next/server";
import { getCurrentProfile } from "@/lib/auth/session";
import { persistProductImport } from "@/lib/products/import/persist-import";
import type { ImportPersistPayload } from "@/lib/products/import/types";

export const maxDuration = 300;

export async function POST(request: Request) {
  try {
    const profile = await getCurrentProfile();
    if (!profile) {
      return NextResponse.json(
        { success: false, message: "Não autenticado." },
        { status: 401 }
      );
    }

    const payload = (await request.json()) as ImportPersistPayload;

    if (!payload?.rows?.length) {
      return NextResponse.json(
        {
          success: false,
          message: "Nenhuma linha para importar.",
          totalRows: 0,
          successRows: 0,
          errorRows: 0,
          errors: [],
        },
        { status: 400 }
      );
    }

    const result = await persistProductImport(payload);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        message:
          error instanceof Error ? error.message : "Erro interno na importação.",
        totalRows: 0,
        successRows: 0,
        errorRows: 0,
        errors: [],
      },
      { status: 500 }
    );
  }
}
