-- Dados cadastrais Tavares Chemical LTDA
-- Tenant: empresa-principal (ajuste o id se necessário)

UPDATE public.tenants
SET
  name = 'TC Química - Tavares Chemical',
  settings = jsonb_build_object(
    'brand', 'tcQUÍMICA',
    'finance_email', 'financeiro@tcquimica.com.br',
    'phone_secondary', '(11) 4606-1864',
    'company_type', 'Sociedade por cotas limitada',
    'quotation_defaults', jsonb_build_object(
      'ptax', 5.078,
      'default_freight', 'FOB',
      'default_payment_terms', 'A DEFINIR'
    )
  )
WHERE slug = 'empresa-principal';

INSERT INTO public.companies (
  tenant_id, legal_name, trade_name, cnpj,
  state_registration, municipal_registration,
  email, phone, website,
  address_line, neighborhood, city, state, zip_code,
  is_default, status
)
SELECT
  t.id,
  'TAVARES CHEMICAL LTDA',
  'tcQUÍMICA - Tavares Companhia Química',
  '29.873.894/0001-06',
  '712133025110',
  '1052320',
  'vendas@tcquimica.com.br',
  '(11) 2923-1111',
  'https://www.tcquimica.com.br',
  'Rua Dorival Sponchiado, 295, Lote 7',
  'Loteamento Olaria Parque Empresarial',
  'Várzea Paulista',
  'SP',
  '13225-340',
  true,
  'ativo'
FROM public.tenants t
WHERE t.slug = 'empresa-principal'
  AND NOT EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.tenant_id = t.id AND c.is_default = true
  );

INSERT INTO public.payment_accounts (
  tenant_id, name, account_type, bank_code, bank_name,
  agency, account_number, pix_key,
  holder_name, holder_document, is_default, status,
  notes
)
SELECT
  t.id,
  'Conta corrente Itaú - TC Química',
  'banco',
  '341',
  'Itaú',
  '0796',
  '93192-1',
  '29.873.894/0001-06',
  'TAVARES CHEMICAL LTDA',
  '29.873.894/0001-06',
  true,
  'ativo',
  'Gerente: Felipe Fortes — (11) 99652-6714'
FROM public.tenants t
WHERE t.slug = 'empresa-principal'
  AND NOT EXISTS (
    SELECT 1 FROM public.payment_accounts p
    WHERE p.tenant_id = t.id AND p.is_default = true
  );
