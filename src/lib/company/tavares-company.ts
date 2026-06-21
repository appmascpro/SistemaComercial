/** Dados cadastrais Tavares Chemical — usados em configurações, PDF e ficha cadastral */
export const tavaresCompanyData = {
  tenant: {
    name: "TC Química - Tavares Chemical",
    slug: "empresa-principal",
    logo_url: null as string | null,
  },
  company: {
    legal_name: "TAVARES CHEMICAL LTDA",
    trade_name: "tcQUÍMICA - Tavares Companhia Química",
    cnpj: "29.873.894/0001-06",
    state_registration: "712133025110",
    municipal_registration: "1052320",
    company_type: "Sociedade por cotas limitada",
    email: "vendas@tcquimica.com.br",
    finance_email: "financeiro@tcquimica.com.br",
    phone: "(11) 2923-1111",
    phone_secondary: "(11) 4606-1864",
    website: "https://www.tcquimica.com.br",
    address_line: "Rua Dorival Sponchiado, 295, Lote 7",
    neighborhood: "Loteamento Olaria Parque Empresarial",
    city: "Várzea Paulista",
    state: "SP",
    zip_code: "13225-340",
    country: "BR",
    partners: [
      "Guaraci Tavares de Farias Filho",
      "Diogo Tavares de Farias",
      "Guaraci Tavares de Farias",
      "Rafael Tavares de Farias",
    ],
  },
  payment: {
    name: "Conta corrente Itaú - TC Química",
    account_type: "banco",
    bank_code: "341",
    bank_name: "Itaú",
    agency: "0796",
    account_number: "93192-1",
    pix_key: "29.873.894/0001-06",
    holder_name: "TAVARES CHEMICAL LTDA",
    holder_document: "29.873.894/0001-06",
    manager_name: "Felipe Fortes",
    manager_phone: "(11) 99652-6714",
  },
  quotationDefaults: {
    ptax: 5.078,
    default_freight: "FOB",
    default_payment_terms: "A DEFINIR",
  },
} as const;

export type TavaresCompanyData = typeof tavaresCompanyData;
