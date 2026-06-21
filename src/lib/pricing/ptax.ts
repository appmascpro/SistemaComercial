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
