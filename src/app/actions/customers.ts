"use server";

import { revalidatePath } from "next/cache";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { CustomerSearchResult } from "@/types/quote";

export interface CustomerActionState {
  error?: string;
  customer?: CustomerSearchResult;
}

export async function createCustomerQuickAction(input: {
  company_name: string;
  state?: string;
  city?: string;
  email?: string;
}): Promise<CustomerActionState> {
  const companyName = input.company_name.trim();

  if (!companyName) {
    return { error: "Informe o nome do cliente." };
  }

  try {
    const { supabase, tenantId } = await createTenantClient();

    const { data, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        company_name: companyName,
        state: input.state?.trim().toUpperCase() || null,
        city: input.city?.trim() || null,
        email: input.email?.trim() || null,
        status: "ativo",
      })
      .select("id, company_name, city, state, document")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Erro ao cadastrar cliente.");
    }

    revalidatePath("/clientes");
    revalidatePath("/cotacoes");

    return { customer: data };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível cadastrar o cliente.",
    };
  }
}

export async function searchCustomersAction(
  query: string
): Promise<CustomerSearchResult[]> {
  const { searchCustomers } = await import("@/lib/quotes/queries");
  return searchCustomers(query);
}

export async function searchProductsAction(query: string) {
  const { searchProducts } = await import("@/lib/quotes/queries");
  return searchProducts(query);
}
