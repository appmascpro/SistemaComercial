"use server";

import { persistProductImport } from "@/lib/products/import/persist-import";
import type {
  ImportPersistPayload,
  ImportPersistResult,
} from "@/lib/products/import/types";

export async function importProductsAction(
  payload: ImportPersistPayload
): Promise<ImportPersistResult> {
  if (!payload.rows.length) {
    return {
      success: false,
      totalRows: 0,
      successRows: 0,
      errorRows: 0,
      errors: [{ rowNumber: 0, message: "Nenhuma linha válida para importar." }],
      message: "Nenhuma linha válida para importar.",
    };
  }

  return persistProductImport(payload);
}
