import type { LeadStatus } from "@/types/customer";

export interface CustomerScoreInput {
  lead_status: LeadStatus | null;
  orders_faturado_count: number;
  days_since_last_order: number | null;
  open_quotes_count: number;
  visits_last_30d: number;
  days_since_last_visit: number | null;
  next_visit_overdue: boolean;
}

export function calculateCustomerScore(input: CustomerScoreInput): number {
  let score = 0;

  switch (input.lead_status) {
    case "cliente":
      score += 40;
      break;
    case "quente":
      score += 30;
      break;
    case "morno":
      score += 15;
      break;
    case "frio":
      score += 5;
      break;
    default:
      score += 10;
  }

  if (input.orders_faturado_count > 0) {
    score += 20;
    if (
      input.days_since_last_order != null &&
      input.days_since_last_order <= 90
    ) {
      score += 5;
    }
  }

  if (input.open_quotes_count > 0) score += 10;
  if (input.visits_last_30d > 0) score += 10;

  if (input.days_since_last_visit != null && input.days_since_last_visit > 60) {
    score -= 20;
  }
  if (input.next_visit_overdue) score -= 10;

  return Math.max(0, Math.min(100, score));
}

export function scoreGrade(score: number): "A" | "B" | "C" | "D" {
  if (score >= 75) return "A";
  if (score >= 50) return "B";
  if (score >= 30) return "C";
  return "D";
}
