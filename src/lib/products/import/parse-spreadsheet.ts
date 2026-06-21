import { getImportProfile } from "./profiles";
import { parseTavaresLayout } from "./parse-tavares-layout";
import { readWorkbookFromFile, sheetToMatrix } from "./spreadsheet-reader";
import { mapRowsFromSpreadsheet } from "./validate-rows";
import type { ImportProfileId, ParsedImportResult } from "./types";

function sheetToSimpleJson(workbook: import("xlsx").WorkBook): {
  headers: string[];
  rows: Record<string, unknown>[];
} {
  const matrix = sheetToMatrix(workbook);
  if (matrix.length === 0) return { headers: [], rows: [] };

  const headerRow = matrix[0] ?? [];
  const headers = headerRow.map((cell, index) => {
    const value =
      cell === null || cell === undefined ? "" : String(cell).trim();
    return value || `coluna_${index + 1}`;
  });

  const rows = matrix.slice(1).map((line) => {
    const record: Record<string, unknown> = {};
    headers.forEach((header, index) => {
      record[header] = line[index] ?? null;
    });
    return record;
  });

  return { headers, rows };
}

export async function parseSpreadsheetFile(
  file: File,
  profileId: ImportProfileId = "tavares"
): Promise<ParsedImportResult> {
  const profile = getImportProfile(profileId);
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (!extension || !["xlsx", "xls", "csv"].includes(extension)) {
    return {
      profileId,
      fileName: file.name,
      headers: [],
      mappedFields: {},
      ignoredHeaders: [],
      unmappedHeaders: [],
      rows: [],
      issues: [
        {
          rowNumber: 0,
          message: "Formato inválido. Envie arquivos .xlsx ou .csv.",
          severity: "error",
        },
      ],
      hasCriticalErrors: true,
      importableCount: 0,
      skippedCount: 0,
    };
  }

  const workbook = await readWorkbookFromFile(file);
  const matrix = sheetToMatrix(workbook);

  if (profile.id === "tavares") {
    return parseTavaresLayout(file.name, matrix, profile);
  }

  const { headers, rows } = sheetToSimpleJson(workbook);
  const result = mapRowsFromSpreadsheet(file.name, profile, headers, rows);
  const importableCount = result.rows.filter(
    (r) =>
      r.commercial_name && (r.price_brl !== null || r.price_usd !== null)
  ).length;

  return {
    ...result,
    importableCount,
    skippedCount: result.rows.length - importableCount,
    hasCriticalErrors: importableCount === 0,
  };
}
