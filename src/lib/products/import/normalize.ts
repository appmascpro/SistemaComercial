export function normalizeHeader(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[_-]+/g, " ");
}

export function parseNumeric(value: unknown): number | null {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  const raw = String(value).trim();
  if (!raw) return null;

  const cleaned = raw
    .replace(/[R$%]/gi, "")
    .replace(/\s/g, "")
    .replace(/\.(?=\d{3}(\D|$))/g, "")
    .replace(",", ".");

  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : null;
}

export function parseString(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export function slugifyCode(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

export function parsePackageSize(packageName: string): {
  size_value: number | null;
  size_unit: string | null;
} {
  const match = packageName.match(/(\d+(?:[.,]\d+)?)\s*([a-zA-Z%]+)?/);
  if (!match) {
    return { size_value: null, size_unit: null };
  }

  const size_value = parseNumeric(match[1]);
  const size_unit = match[2]?.toLowerCase() ?? null;
  return { size_value, size_unit };
}

export function parseStockOrStatus(value: string | null): {
  stock_quantity: number | null;
  status: string | null;
} {
  if (!value) return { stock_quantity: null, status: null };

  const numeric = parseNumeric(value);
  if (numeric !== null && /^\d/.test(value.trim())) {
    return { stock_quantity: numeric, status: null };
  }

  return { stock_quantity: null, status: value };
}

export function mergeTechnicalNotes(
  base: string | null,
  extras: Record<string, string>
): string | null {
  const extraLines = Object.entries(extras)
    .filter(([, v]) => v.trim().length > 0)
    .map(([k, v]) => `${k}: ${v}`);

  if (extraLines.length === 0) return base;

  const extraBlock = extraLines.join("\n");
  return base ? `${base}\n\n${extraBlock}` : extraBlock;
}
