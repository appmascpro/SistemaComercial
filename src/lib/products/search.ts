const SEARCH_FIELDS = [
  "commercial_name",
  "internal_code",
  "inci_name",
  "description",
  "technical_notes",
] as const;

/** Remove caracteres que quebram o filtro `.or()` do PostgREST. */
export function sanitizeSearchToken(token: string): string {
  return token.replace(/[,()]/g, " ").trim();
}

export function tokenizeSearchQuery(query: string): string[] {
  return query
    .trim()
    .split(/\s+/)
    .map(sanitizeSearchToken)
    .filter((token) => token.length > 0);
}

/** Filtro PostgREST: cada token em qualquer campo (match parcial). */
export function buildProductSearchOrFilter(tokens: string[]): string | null {
  if (tokens.length === 0) return null;

  const conditions = tokens.flatMap((token) => {
    const pattern = `%${token}%`;
    return SEARCH_FIELDS.map((field) => `${field}.ilike.${pattern}`);
  });

  return conditions.join(",");
}

export function productMatchesAllTokens(
  product: {
    commercial_name: string;
    internal_code: string;
    inci_name?: string | null;
    description?: string | null;
    technical_notes?: string | null;
  },
  tokens: string[]
): boolean {
  if (tokens.length === 0) return true;

  const haystack = [
    product.commercial_name,
    product.internal_code,
    product.inci_name,
    product.description,
    product.technical_notes,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

  return tokens.every((token) => haystack.includes(token.toLowerCase()));
}
