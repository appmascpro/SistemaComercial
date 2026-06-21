const BCB_PTAX_BASE =
  "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata";

export interface BcbPtaxQuote {
  /** PTAX venda (R$/USD) */
  rate: number;
  /** Data da cotação no BCB (YYYY-MM-DD) */
  referenceDate: string;
  /** Horário publicado pelo BCB */
  quotedAt: string;
}

interface BcbDolarDiaRow {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
}

interface BcbODataResponse<T> {
  value: T[];
}

function formatBcbDate(date: Date): string {
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const year = date.getUTCFullYear();
  return `${month}-${day}-${year}`;
}

function parseReferenceDateFromBcbDateParam(bcbDate: string): string {
  const [month, day, year] = bcbDate.split("-");
  return `${year}-${month}-${day}`;
}

function isWeekend(date: Date): boolean {
  const day = date.getUTCDay();
  return day === 0 || day === 6;
}

function addUtcDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

/** Último dia útil (exclui sábado/domingo; feriados exigem fallback na API). */
export function getLastBusinessDay(from = new Date()): Date {
  let cursor = new Date(
    Date.UTC(from.getUTCFullYear(), from.getUTCMonth(), from.getUTCDate())
  );

  while (isWeekend(cursor)) {
    cursor = addUtcDays(cursor, -1);
  }

  return cursor;
}

async function fetchBcbPtaxForDate(date: Date): Promise<BcbPtaxQuote | null> {
  const bcbDate = formatBcbDate(date);
  const url =
    `${BCB_PTAX_BASE}/CotacaoDolarDia(dataCotacao=@dataCotacao)` +
    `?@dataCotacao='${bcbDate}'&$format=json&$top=1&$orderby=dataHoraCotacao desc`;

  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    next: { revalidate: 0 },
  });

  if (!response.ok) {
    throw new Error(`BCB PTAX indisponível (HTTP ${response.status}).`);
  }

  const payload = (await response.json()) as BcbODataResponse<BcbDolarDiaRow>;
  const row = payload.value?.[0];
  if (!row?.cotacaoVenda) return null;

  return {
    rate: Number(row.cotacaoVenda),
    referenceDate: parseReferenceDateFromBcbDateParam(bcbDate),
    quotedAt: row.dataHoraCotacao,
  };
}

/**
 * Busca PTAX venda do BCB (Olinda).
 * Tenta a data informada e retrocede até 10 dias úteis se ainda não houver fechamento.
 */
export async function fetchBcbPtaxSale(
  referenceDate = new Date()
): Promise<BcbPtaxQuote> {
  let cursor = new Date(
    Date.UTC(
      referenceDate.getUTCFullYear(),
      referenceDate.getUTCMonth(),
      referenceDate.getUTCDate()
    )
  );

  for (let attempt = 0; attempt < 10; attempt += 1) {
    while (isWeekend(cursor)) {
      cursor = addUtcDays(cursor, -1);
    }

    const quote = await fetchBcbPtaxForDate(cursor);
    if (quote) return quote;

    cursor = addUtcDays(cursor, -1);
  }

  throw new Error(
    "Não foi possível obter a PTAX venda do BCB nos últimos dias úteis."
  );
}
