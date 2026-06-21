/** Extrai a descrição comercial das observações técnicas (formato Tavares). */
export function extractDescriptionFromNotes(
  technicalNotes: string | null | undefined
): string | null {
  if (!technicalNotes) return null;

  for (const line of technicalNotes.split("\n")) {
    const match = line.match(/^descri[çc][ãa]o:\s*(.+)$/i);
    if (match?.[1]?.trim()) {
      return match[1].trim();
    }
  }

  return null;
}

export function resolveProductDescription(
  description: string | null | undefined,
  technicalNotes: string | null | undefined
): string | null {
  if (description?.trim()) return description.trim();
  return extractDescriptionFromNotes(technicalNotes);
}
