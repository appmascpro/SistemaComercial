import Link from "next/link";
import { PageHeader } from "@/components/layout/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PtaxForm } from "@/components/settings/ptax-form";
import { CommissionRatesForm } from "@/components/settings/commission-rates-form";
import { getCompanyProfile } from "@/lib/company/get-company";
import { getCommissionRatesConfig } from "@/lib/commissions/category-rates";
import { seedTavaresCompany } from "@/lib/company/seed-tavares-company";
import { getCurrentProfile } from "@/lib/auth/session";
import { getRequiredTenantId } from "@/lib/auth/tenant";
import { getActivePtaxRate, getPtaxHistory } from "@/lib/pricing/ptax";

export const dynamic = "force-dynamic";

export default async function ConfiguracoesPage() {
  const profile = await getCurrentProfile();
  const isAdmin = profile?.role === "admin";

  let companyData = await getCompanyProfile();

  if (!companyData.company) {
    const tenantId = await getRequiredTenantId();
    await seedTavaresCompany(tenantId);
    companyData = await getCompanyProfile();
  }

  const [ptax, ptaxHistory, commissionRates] = await Promise.all([
    getActivePtaxRate(),
    getPtaxHistory(),
    getCommissionRatesConfig(),
  ]);

  const { company, payment } = companyData;

  return (
    <div>
      <PageHeader
        title="Configurações"
        description="Dados da empresa, PTAX venda e informações para cotações."
        action={
          isAdmin ? (
            <Link
              href="/usuarios"
              className="inline-flex h-8 items-center rounded-lg border border-slate-300 bg-white px-3 text-xs font-medium text-slate-700 hover:bg-slate-50"
            >
              Gerenciar usuários
            </Link>
          ) : undefined
        }
      />

      <Card className="mb-6" id="comissoes">
        <CardHeader>
          <CardTitle>Comissões por tipo de produto</CardTitle>
        </CardHeader>
        <CardContent>
          <CommissionRatesForm
            config={commissionRates}
            isAdmin={Boolean(isAdmin)}
          />
        </CardContent>
      </Card>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Cotação PTAX venda (USD → BRL)</CardTitle>
        </CardHeader>
        <CardContent>
          <PtaxForm current={ptax} history={ptaxHistory} />
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Ficha cadastral — Empresa</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {company ? (
              <>
                <InfoRow label="Razão social" value={company.legal_name} />
                <InfoRow label="Nome fantasia" value={company.trade_name} />
                <InfoRow label="CNPJ" value={company.cnpj} />
                <InfoRow label="Inscrição estadual" value={company.state_registration} />
                <InfoRow
                  label="Inscrição municipal"
                  value={company.municipal_registration}
                />
                <InfoRow label="E-mail comercial" value={company.email} />
                <InfoRow label="Telefone" value={company.phone} />
                <InfoRow label="Site" value={company.website} />
                <InfoRow
                  label="Endereço"
                  value={[
                    company.address_line,
                    company.neighborhood,
                    company.city && company.state
                      ? `${company.city}/${company.state}`
                      : null,
                    company.zip_code ? `CEP ${company.zip_code}` : null,
                  ]
                    .filter(Boolean)
                    .join(" — ")}
                />
              </>
            ) : (
              <p className="text-slate-500">Empresa não cadastrada.</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Dados bancários e PIX</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            {payment ? (
              <>
                <InfoRow label="Banco" value={payment.bank_name} />
                <InfoRow label="Agência" value={payment.agency} />
                <InfoRow label="Conta corrente" value={payment.account_number} />
                <InfoRow label="Titular" value={payment.holder_name} />
                <InfoRow label="CNPJ" value={payment.holder_document} />
                <InfoRow
                  label="Chave PIX"
                  value={payment.pix_key}
                  highlight
                />
                <p className="rounded-lg border border-brand-100 bg-brand-50 px-3 py-2 text-xs text-brand-800">
                  Estes dados aparecerão no rodapé das cotações em PDF (próxima
                  etapa).
                </p>
              </>
            ) : (
              <p className="text-slate-500">Conta de pagamento não cadastrada.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function InfoRow({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | null | undefined;
  highlight?: boolean;
}) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
        {label}
      </p>
      <p
        className={
          highlight
            ? "mt-0.5 font-semibold text-brand-700"
            : "mt-0.5 text-slate-800"
        }
      >
        {value}
      </p>
    </div>
  );
}
