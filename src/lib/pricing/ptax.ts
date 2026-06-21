import "server-only";

import { fetchBcbPtaxSale } from "@/lib/pricing/bcb-ptax";
import { createAdminClient } from "@/lib/supabase/admin";
import { createTenantClient } from "@/lib/supabase/tenant-db";

export type PtaxSource =
  | "exchange_rates"
  | "tenant_settings"
  | "default"
  | "bcb"
  | "manual";

export interface PtaxRate {
  rate: number;
  validFrom: string;
  source: PtaxSource;
  bcbReferenceDate?: string | null;
}

export interface SyncPtaxResult {
  updated: boolean;
  rate: number;
  previousRate: number | null;
  referenceDate: string;
  quotedAt: string;
  message: string;
}

export function calculateBrlFromUsd(priceUsd: number, ptax: number): number {
  return Math.round(priceUsd * ptax * 100) / 100;
}

export async function getActivePtaxRate(): Promise<PtaxRate> {
  const { supabase, tenantId } = await createTenantClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: rateRow } = await supabase
    .from("exchange_rates")
    .select("rate, valid_from, source, bcb_reference_date")
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .eq("status", "ativo")
    .lte("valid_from", today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rateRow?.rate != null) {
    const dbSource = rateRow.source;
    const source: PtaxSource =
      dbSource === "bcb"
        ? "bcb"
        : dbSource === "manual"
          ? "manual"
          : "exchange_rates";

    return {
      rate: Number(rateRow.rate),
      validFrom: rateRow.valid_from,
      source,
      bcbReferenceDate: rateRow.bcb_reference_date,
    };
  }

  const { data: tenant } = await supabase
    .from("tenants")
    .select("settings")
    .eq("id", tenantId)
    .maybeSingle();

  const settingsPtax = (
    tenant?.settings as { quotation_defaults?: { ptax?: number } } | null
  )?.quotation_defaults?.ptax;

  if (settingsPtax != null && Number.isFinite(settingsPtax)) {
    return {
      rate: Number(settingsPtax),
      validFrom: today,
      source: "tenant_settings",
    };
  }

  const { tavaresCompanyData } = await import("@/lib/company/tavares-company");
  return {
    rate: tavaresCompanyData.quotationDefaults.ptax,
    validFrom: today,
    source: "default",
  };
}

export interface PtaxHistoryItem {
  rate: number;
  valid_from: string;
  status: string;
  source: string | null;
  bcb_reference_date: string | null;
}

export async function getPtaxHistory(limit = 8): Promise<PtaxHistoryItem[]> {
  const { supabase } = await createTenantClient();

  const { data } = await supabase
    .from("exchange_rates")
    .select("rate, valid_from, status, source, bcb_reference_date")
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .order("valid_from", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    rate: Number(row.rate),
    valid_from: row.valid_from,
    status: row.status,
    source: row.source ?? null,
    bcb_reference_date: row.bcb_reference_date ?? null,
  }));
}

export async function updateActivePtaxRate(
  rate: number,
  validFrom?: string,
  options?: { source?: string; bcbReferenceDate?: string }
): Promise<void> {
  if (!Number.isFinite(rate) || rate <= 0) {
    throw new Error("Informe uma PTAX válida (maior que zero).");
  }

  const { supabase, tenantId } = await createTenantClient();
  const valid_from = validFrom ?? new Date().toISOString().slice(0, 10);

  const { error: deactivateError } = await supabase
    .from("exchange_rates")
    .update({ status: "inativo" })
    .eq("tenant_id", tenantId)
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .eq("status", "ativo");

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error: insertError } = await supabase.from("exchange_rates").insert({
    tenant_id: tenantId,
    from_currency: "USD",
    to_currency: "BRL",
    rate,
    valid_from,
    valid_until: null,
    status: "ativo",
    source: options?.source ?? "manual",
    bcb_reference_date: options?.bcbReferenceDate ?? null,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}

async function getActivePtaxRateForTenant(
  tenantId: string
): Promise<{ rate: number | null; validFrom: string | null }> {
  const admin = createAdminClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: rateRow } = await admin
    .from("exchange_rates")
    .select("rate, valid_from")
    .eq("tenant_id", tenantId)
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .eq("status", "ativo")
    .lte("valid_from", today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  return {
    rate: rateRow?.rate != null ? Number(rateRow.rate) : null,
    validFrom: rateRow?.valid_from ?? null,
  };
}

async function applyPtaxForTenant(
  tenantId: string,
  quote: Awaited<ReturnType<typeof fetchBcbPtaxSale>>,
  options?: { force?: boolean }
): Promise<SyncPtaxResult> {
  const admin = createAdminClient();
  const current = await getActivePtaxRateForTenant(tenantId);
  const sameRate =
    current.rate != null &&
    Math.abs(current.rate - quote.rate) < 0.00005 &&
    current.validFrom === quote.referenceDate;

  if (sameRate && !options?.force) {
    return {
      updated: false,
      rate: quote.rate,
      previousRate: current.rate,
      referenceDate: quote.referenceDate,
      quotedAt: quote.quotedAt,
      message: `PTAX já está em R$ ${quote.rate.toFixed(4)}/USD (${quote.referenceDate}).`,
    };
  }

  const { error: deactivateError } = await admin
    .from("exchange_rates")
    .update({ status: "inativo" })
    .eq("tenant_id", tenantId)
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .eq("status", "ativo");

  if (deactivateError) {
    throw new Error(deactivateError.message);
  }

  const { error: insertError } = await admin.from("exchange_rates").insert({
    tenant_id: tenantId,
    from_currency: "USD",
    to_currency: "BRL",
    rate: quote.rate,
    valid_from: quote.referenceDate,
    valid_until: null,
    status: "ativo",
    source: "bcb",
    bcb_reference_date: quote.referenceDate,
  });

  if (insertError) {
    throw new Error(insertError.message);
  }

  return {
    updated: true,
    rate: quote.rate,
    previousRate: current.rate,
    referenceDate: quote.referenceDate,
    quotedAt: quote.quotedAt,
    message: `PTAX BCB atualizada para R$ ${quote.rate.toFixed(4)}/USD (${quote.referenceDate}).`,
  };
}

/** Sincroniza PTAX venda do BCB para o tenant da sessão. */
export async function syncPtaxFromBcbForCurrentTenant(options?: {
  force?: boolean;
}): Promise<SyncPtaxResult> {
  const { tenantId } = await createTenantClient();
  const quote = await fetchBcbPtaxSale();
  return applyPtaxForTenant(tenantId, quote, options);
}

/** Sincroniza PTAX BCB para todos os tenants (cron / service role). */
export async function syncPtaxFromBcbForAllTenants(options?: {
  force?: boolean;
}): Promise<Array<{ tenantId: string; result: SyncPtaxResult }>> {
  const admin = createAdminClient();
  const quote = await fetchBcbPtaxSale();

  const { data: tenants, error } = await admin.from("tenants").select("id");
  if (error) throw new Error(error.message);
  if (!tenants?.length) return [];

  const results: Array<{ tenantId: string; result: SyncPtaxResult }> = [];

  for (const tenant of tenants) {
    const result = await applyPtaxForTenant(tenant.id, quote, options);
    results.push({ tenantId: tenant.id, result });
  }

  return results;
}
