import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(
  value: number,
  currency: "BRL" | "USD" = "BRL"
): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency,
  }).format(value);
}

export function formatDate(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  return date.toLocaleDateString("pt-BR");
}

export function formatPercent(value: number): string {
  return `${value.toFixed(2).replace(".", ",")}%`;
}

export function formatQuantity(value: number): string {
  return new Intl.NumberFormat("pt-BR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 4,
  }).format(value);
}

/** Aceita "18,30", "18.30", "1.234,56" etc. */
export function parseDecimalInput(value: string): number | null {
  const trimmed = value.trim();
  if (!trimmed) return null;

  let normalized = trimmed.replace(/\s/g, "");

  if (normalized.includes(",") && normalized.includes(".")) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if (normalized.includes(",")) {
    normalized = normalized.replace(",", ".");
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

export function formatDecimalInput(value: number): string {
  if (!Number.isFinite(value)) return "";
  return String(value).replace(".", ",");
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function dateDaysFromNow(days: number): string {
  return addDays(new Date(), days).toISOString().slice(0, 10);
}
