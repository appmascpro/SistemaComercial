export function normalizeProductName(name: string): string {
  return name.trim().toUpperCase();
}

export function formatSequentialCode(
  prefix: string,
  sequence: number,
  pad = 3
): string {
  return `${prefix.toUpperCase()}-${String(sequence).padStart(pad, "0")}`;
}

export function parseSequentialCode(
  code: string,
  prefix: string
): number | null {
  const re = new RegExp(`^${prefix}-(\\d+)$`, "i");
  const match = code.match(re);
  return match ? Number.parseInt(match[1], 10) : null;
}

export function findMaxSequentialCode(codes: string[], prefix: string): number {
  return codes.reduce((max, code) => {
    const n = parseSequentialCode(code, prefix);
    return n !== null && n > max ? n : max;
  }, 0);
}

export function isSequentialCode(code: string, prefix: string): boolean {
  return parseSequentialCode(code, prefix) !== null;
}

interface ExistingProductRef {
  id: string;
  internal_code: string;
  commercial_name: string;
}

export function assignInternalCodes(
  rows: Array<{ commercial_name: string; internal_code: string }>,
  existingProducts: ExistingProductRef[],
  prefix: string
): string[] {
  const existingByName = new Map(
    existingProducts.map((p) => [
      normalizeProductName(p.commercial_name),
      p,
    ])
  );

  let nextSeq =
    findMaxSequentialCode(
      existingProducts.map((p) => p.internal_code),
      prefix
    ) + 1;

  return rows.map((row) => {
    const existing = existingByName.get(normalizeProductName(row.commercial_name));

    if (existing && isSequentialCode(existing.internal_code, prefix)) {
      return existing.internal_code;
    }

    if (row.internal_code.trim() && isSequentialCode(row.internal_code.trim(), prefix)) {
      return row.internal_code.trim();
    }

    const code = formatSequentialCode(prefix, nextSeq);
    nextSeq += 1;
    return code;
  });
}
