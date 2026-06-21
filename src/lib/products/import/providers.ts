import type { ParsedImportResult } from "./types";

/**
 * Contrato para provedores de importação.
 * Implementações futuras: Google Sheets, API externa, etc.
 */
export interface ProductImportProvider {
  readonly source: "file" | "google_sheets";
  read(): Promise<ParsedImportResult>;
}

export interface FileImportProviderOptions {
  file: File;
  profileId: ParsedImportResult["profileId"];
}

export class FileImportProvider implements ProductImportProvider {
  readonly source = "file" as const;

  constructor(private readonly options: FileImportProviderOptions) {}

  async read(): Promise<ParsedImportResult> {
    const { parseSpreadsheetFile } = await import("./parse-spreadsheet");
    return parseSpreadsheetFile(this.options.file, this.options.profileId);
  }
}

/** Placeholder para integração futura com Google Sheets */
export class GoogleSheetsImportProvider implements ProductImportProvider {
  readonly source = "google_sheets" as const;

  constructor(private readonly _spreadsheetId: string) {
    void this._spreadsheetId;
  }

  async read(): Promise<ParsedImportResult> {
    throw new Error(
      "Integração com Google Sheets ainda não implementada. Use upload de arquivo."
    );
  }
}

export function createFileImportProvider(
  options: FileImportProviderOptions
): FileImportProvider {
  return new FileImportProvider(options);
}
