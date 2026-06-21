export interface CustomerAddressFields {
  address_line: string | null;
  address_number: string | null;
  address_complement: string | null;
  neighborhood: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
}

export function formatCustomerAddress(
  customer: CustomerAddressFields
): string {
  const street = [customer.address_line, customer.address_number]
    .filter(Boolean)
    .join(", ");

  const parts = [
    street || null,
    customer.address_complement,
    customer.neighborhood,
    [customer.city, customer.state].filter(Boolean).join("/") || null,
    customer.zip_code ? `CEP ${customer.zip_code}` : null,
  ].filter(Boolean);

  return parts.length > 0 ? parts.join(" — ") : "—";
}

export function formatDocumentLabel(
  document: string | null,
  documentType: string | null
): string | null {
  if (!document) return null;
  const label =
    documentType === "cnpj"
      ? "CNPJ"
      : documentType === "cpf"
        ? "CPF"
        : "Documento";
  return `${label}: ${document}`;
}
