import * as XLSX from "xlsx";

export function sheetToMatrix(workbook: XLSX.WorkBook): unknown[][] {
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) return [];

  const sheet = workbook.Sheets[sheetName];
  return XLSX.utils.sheet_to_json<unknown[]>(sheet, {
    header: 1,
    defval: null,
    blankrows: false,
    raw: false,
  });
}

function readCsvTextFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  const asUtf8 = new TextDecoder("utf-8", { fatal: false }).decode(bytes);
  if (asUtf8.includes("\uFFFD")) {
    return new TextDecoder("latin1").decode(bytes);
  }
  return asUtf8;
}

export function readWorkbookFromFile(file: File): Promise<XLSX.WorkBook> {
  const extension = file.name.split(".").pop()?.toLowerCase();

  if (extension === "csv") {
    return file.arrayBuffer().then((buffer) => {
      const text = readCsvTextFromBuffer(buffer);
      return XLSX.read(text, {
        type: "string",
        raw: false,
        FS: text.includes(";") ? ";" : ",",
      });
    });
  }

  return file.arrayBuffer().then((buffer) =>
    XLSX.read(buffer, { type: "array", raw: false })
  );
}
