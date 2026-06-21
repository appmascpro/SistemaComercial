import type { ImportFieldKey, ImportProfile } from "./types";
import { normalizeHeader } from "./normalize";

export function isIgnoredHeader(
  header: string,
  patterns: RegExp[] = []
): boolean {
  const normalized = normalizeHeader(header);
  if (!normalized) return true;
  return patterns.some((pattern) => pattern.test(header) || pattern.test(normalized));
}

export function buildHeaderMap(
  headers: string[],
  profile: ImportProfile
): {
  mappedFields: Partial<Record<ImportFieldKey, string>>;
  ignoredHeaders: string[];
  unmappedHeaders: string[];
} {
  const aliasToField = new Map<string, ImportFieldKey>();
  const ignorePatterns = profile.ignoreHeaderPatterns ?? [];

  for (const column of profile.columns) {
    for (const alias of column.aliases) {
      aliasToField.set(normalizeHeader(alias), column.field);
    }
  }

  const mappedFields: Partial<Record<ImportFieldKey, string>> = {};
  const ignoredHeaders: string[] = [];
  const unmappedHeaders: string[] = [];

  for (const header of headers) {
    const normalized = normalizeHeader(header);
    if (!normalized) continue;

    if (isIgnoredHeader(header, ignorePatterns)) {
      ignoredHeaders.push(header);
      continue;
    }

    // Colunas dinâmicas de embalagem: EMBALAGEM_25, EMBALAGEM_200
    if (/^embalagem_\d+$/i.test(normalized)) {
      mappedFields.package_name = mappedFields.package_name ?? header;
      continue;
    }

    const field = aliasToField.get(normalized);
    if (field) {
      if (!mappedFields[field]) {
        mappedFields[field] = header;
      }
    } else if (!/^coluna_\d+$/i.test(header)) {
      unmappedHeaders.push(header);
    }
  }

  return { mappedFields, ignoredHeaders, unmappedHeaders };
}

export {
  normalizeHeader,
  parseNumeric,
  parseString,
  slugifyCode,
  parsePackageSize,
  parseStockOrStatus,
  mergeTechnicalNotes,
} from "./normalize";
