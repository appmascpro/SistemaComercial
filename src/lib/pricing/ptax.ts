import { createTenantClient } from "@/lib/supabase/tenant-db";
import { tavaresCompanyData } from "@/lib/company/tavares-company";

export interface PtaxRate {
  rate: number;
  validFrom: string;
  source: "exchange_rates" | "tenant_settings" | "default";
}

export function calculateBrlFromUsd(priceUsd: number, ptax: number): number {
  return Math.round(priceUsd * ptax * 100) / 100;
}

export async function getActivePtaxRate(): Promise<PtaxRate> {
  const { supabase, tenantId } = await createTenantClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data: rateRow } = await supabase
    .from("exchange_rates")
    .select("rate, valid_from")
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .eq("status", "ativo")
    .lte("valid_from", today)
    .or(`valid_until.is.null,valid_until.gte.${today}`)
    .order("valid_from", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (rateRow?.rate != null) {
    return {
      rate: Number(rateRow.rate),
      validFrom: rateRow.valid_from,
      source: "exchange_rates",
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
}

export async function getPtaxHistory(limit = 8): Promise<PtaxHistoryItem[]> {
  const { supabase } = await createTenantClient();

  const { data } = await supabase
    .from("exchange_rates")
    .select("rate, valid_from, status")
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .order("valid_from", { ascending: false })
    .limit(limit);

  return (data ?? []).map((row) => ({
    rate: Number(row.rate),
    valid_from: row.valid_from,
    status: row.status,
  }));
}

export async function updateActivePtaxRate(
  rate: number,
  validFrom?: string
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
  });

  if (insertError) {
    throw new Error(insertError.message);
  }
}
