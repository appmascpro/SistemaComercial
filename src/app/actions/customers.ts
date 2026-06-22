"use server";

import { revalidatePath } from "next/cache";
import { requireProfile } from "@/lib/auth/session";
import { createTenantClient } from "@/lib/supabase/tenant-db";
import type { CustomerFormInput } from "@/types/customer";
import type { CustomerSearchResult } from "@/types/quote";

export interface CustomerActionState {
  error?: string;
  success?: string;
  customerId?: string;
  customer?: CustomerSearchResult;
}

function normalizeCustomerInput(input: CustomerFormInput) {
  const companyName = input.company_name.trim();
  if (!companyName) {
    throw new Error("Informe o nome ou razão social do cliente.");
  }

  return {
    company_name: companyName,
    trade_name: input.trade_name?.trim() || null,
    document: input.document?.trim() || null,
    document_type: input.document_type || null,
    segment: input.segment?.trim() || null,
    customer_type: input.customer_type || null,
    lead_status: input.lead_status || null,
    purchase_potential: input.purchase_potential?.trim() || null,
    potential_volume: input.potential_volume?.trim() || null,
    products_of_interest: input.products_of_interest?.trim() || null,
    current_supplier: input.current_supplier?.trim() || null,
    pain_point: input.pain_point?.trim() || null,
    buyer_name: input.buyer_name?.trim() || null,
    buyer_phone: input.buyer_phone?.trim() || null,
    email: input.email?.trim() || null,
    phone: input.phone?.trim() || null,
    address_line: input.address_line?.trim() || null,
    address_number: input.address_number?.trim() || null,
    address_complement: input.address_complement?.trim() || null,
    neighborhood: input.neighborhood?.trim() || null,
    city: input.city?.trim() || null,
    state: input.state?.trim().toUpperCase() || null,
    zip_code: input.zip_code?.trim() || null,
    notes: input.notes?.trim() || null,
    status: input.status ?? "ativo",
  };
}

export async function createCustomerAction(
  input: CustomerFormInput
): Promise<CustomerActionState> {
  try {
    const profile = await requireProfile();
    const { supabase, tenantId } = await createTenantClient();
    const payload = normalizeCustomerInput(input);

    const { data, error } = await supabase
      .from("customers")
      .insert({
        tenant_id: tenantId,
        seller_id: profile.id,
        ...payload,
      })
      .select("id")
      .single();

    if (error || !data) {
      throw new Error(error?.message ?? "Erro ao cadastrar cliente.");
    }

    revalidatePath("/");
    revalidatePath("/clientes");
    revalidatePath("/cotacoes");

    return {
      success: "Cliente cadastrado com sucesso.",
      customerId: data.id,
    };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível cadastrar o cliente.",
    };
  }
}

export async function updateCustomerAction(
  id: string,
  input: CustomerFormInput
): Promise<CustomerActionState> {
  try {
    const payload = normalizeCustomerInput(input);
    const { supabase } = await createTenantClient();

    const { error } = await supabase
      .from("customers")
      .update(payload)
      .eq("id", id);

    if (error) throw new Error(error.message);

    revalidatePath("/");
    revalidatePath("/clientes");
    revalidatePath(`/clientes/${id}`);
    revalidatePath("/cotacoes");

    return { success: "Cliente atualizado.", customerId: id };
  } catch (error) {
    return {
      error:
        error instanceof Error ? error.message : "Não foi possível atualizar o cliente.",
    };
  }
}

export async function createCustomerQuickAction(input: {
  company_name: string;
  state?: string;
  city?: string;
  email?: string;
  phone?: string;
}): Promise<CustomerActionState> {
  const result = await createCustomerAction({
    company_name: input.company_name,
    state: input.state,
    city: input.city,
    email: input.email,
    phone: input.phone,
  });

  if (result.error || !result.customerId) {
    return { error: result.error };
  }

  const { searchCustomers } = await import("@/lib/quotes/queries");
  const customers = await searchCustomers(input.company_name);
  const customer = customers.find((c) => c.id === result.customerId);

  return {
    customer: customer ?? {
      id: result.customerId,
      company_name: input.company_name.trim(),
      city: input.city?.trim() || null,
      state: input.state?.trim().toUpperCase() || null,
      document: null,
    },
  };
}

export async function getCustomerForQuoteAction(customerId: string) {
  const { getCustomerById } = await import("@/lib/customers/queries");
  const customer = await getCustomerById(customerId);
  if (!customer) return null;
  return {
    id: customer.id,
    company_name: customer.company_name,
    city: customer.city,
    state: customer.state,
    document: customer.document,
  };
}

export async function getCustomerVisitDefaultsAction(customerId: string) {
  const { getCustomerById } = await import("@/lib/customers/queries");
  const customer = await getCustomerById(customerId);
  if (!customer) return null;

  return {
    company_name: customer.company_name,
    city: customer.city,
    state: customer.state,
    segment: customer.segment,
    customer_type: customer.customer_type,
    buyer_name: customer.buyer_name,
    buyer_phone: customer.buyer_phone ?? customer.phone,
    products_of_interest: customer.products_of_interest,
    pain_point: customer.pain_point,
    current_supplier: customer.current_supplier,
    potential_volume: customer.potential_volume,
    lead_status: customer.lead_status,
    last_visit_at: customer.last_visit_at,
    next_visit_at: customer.next_visit_at,
  };
}

export async function searchCustomersAction(
  query: string,
  filters?: { city?: string; cities?: string[]; state?: string }
): Promise<CustomerSearchResult[]> {
  const { searchCustomers } = await import("@/lib/quotes/queries");
  return searchCustomers(query, filters);
}

export async function searchProductsAction(query: string) {
  const { searchProducts } = await import("@/lib/quotes/queries");
  return searchProducts(query);
}
