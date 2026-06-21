export type IcmsRegion = "icms_4" | "icms_7" | "icms_12" | "icms_18";

const ICMS_18_STATES = new Set(["SP"]);
const ICMS_12_STATES = new Set(["PR", "SC", "RS", "MG", "RJ", "ES"]);

/** Mapeia UF do cliente para a faixa ICMS gravada em tax_rules.region */
export function resolveIcmsRegion(customerState: string | null | undefined): IcmsRegion {
  const uf = (customerState ?? "SP").toUpperCase().trim();
  if (ICMS_18_STATES.has(uf)) return "icms_18";
  if (ICMS_12_STATES.has(uf)) return "icms_12";
  return "icms_7";
}
