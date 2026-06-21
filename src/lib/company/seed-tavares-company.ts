import { createAdminClient } from "@/lib/supabase/admin";
import { tavaresCompanyData } from "./tavares-company";

export async function seedTavaresCompany(tenantId: string) {
  const admin = createAdminClient();
  const { tenant, company, payment } = tavaresCompanyData;

  await admin
    .from("tenants")
    .update({
      name: tenant.name,
      settings: {
        brand: "tcQUÍMICA",
        quotation_defaults: tavaresCompanyData.quotationDefaults,
        partners: company.partners,
        finance_email: company.finance_email,
        phone_secondary: company.phone_secondary,
        company_type: company.company_type,
      },
    })
    .eq("id", tenantId);

  const { data: existingCompany } = await admin
    .from("companies")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .maybeSingle();

  const companyPayload = {
    tenant_id: tenantId,
    legal_name: company.legal_name,
    trade_name: company.trade_name,
    cnpj: company.cnpj,
    state_registration: company.state_registration,
    municipal_registration: company.municipal_registration,
    email: company.email,
    phone: company.phone,
    website: company.website,
    address_line: company.address_line,
    neighborhood: company.neighborhood,
    city: company.city,
    state: company.state,
    zip_code: company.zip_code,
    country: company.country,
    is_default: true,
    status: "ativo",
  };

  if (existingCompany?.id) {
    await admin.from("companies").update(companyPayload).eq("id", existingCompany.id);
  } else {
    await admin.from("companies").insert(companyPayload);
  }

  const { data: existingPayment } = await admin
    .from("payment_accounts")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("is_default", true)
    .maybeSingle();

  const paymentPayload = {
    tenant_id: tenantId,
    name: payment.name,
    account_type: payment.account_type,
    bank_code: payment.bank_code,
    bank_name: payment.bank_name,
    agency: payment.agency,
    account_number: payment.account_number,
    pix_key: payment.pix_key,
    holder_name: payment.holder_name,
    holder_document: payment.holder_document,
    is_default: true,
    status: "ativo",
    notes: `Gerente: ${payment.manager_name} — ${payment.manager_phone}`,
  };

  if (existingPayment?.id) {
    await admin.from("payment_accounts").update(paymentPayload).eq("id", existingPayment.id);
  } else {
    await admin.from("payment_accounts").insert(paymentPayload);
  }

  const today = new Date().toISOString().slice(0, 10);
  const { data: existingRate } = await admin
    .from("exchange_rates")
    .select("id")
    .eq("tenant_id", tenantId)
    .eq("from_currency", "USD")
    .eq("to_currency", "BRL")
    .eq("status", "ativo")
    .maybeSingle();

  const ptaxPayload = {
    tenant_id: tenantId,
    from_currency: "USD",
    to_currency: "BRL",
    rate: tavaresCompanyData.quotationDefaults.ptax,
    valid_from: today,
    valid_until: null,
    status: "ativo",
  };

  if (existingRate?.id) {
    await admin.from("exchange_rates").update(ptaxPayload).eq("id", existingRate.id);
  } else {
    await admin.from("exchange_rates").insert(ptaxPayload);
  }
}
