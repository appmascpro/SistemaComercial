import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CompanyProfile, PaymentAccountProfile } from "@/lib/company/get-company";
import type { QuoteDetail } from "@/types/quote";
import { formatCurrency, formatDate, formatPercent, formatQuantity } from "@/lib/utils";

Font.register({
  family: "Roboto",
  fonts: [
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-regular-webfont.ttf",
      fontWeight: 400,
    },
    {
      src: "https://cdnjs.cloudflare.com/ajax/libs/ink/3.1.10/fonts/Roboto/roboto-bold-webfont.ttf",
      fontWeight: 700,
    },
  ],
});

const styles = StyleSheet.create({
  page: {
    fontFamily: "Roboto",
    fontSize: 9,
    color: "#1e293b",
    padding: 32,
    paddingBottom: 48,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 18,
    borderBottomWidth: 2,
    borderBottomColor: "#0070c4",
    paddingBottom: 12,
  },
  brandBlock: {
    maxWidth: "58%",
  },
  brandName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0070c4",
    marginBottom: 4,
  },
  brandSub: {
    fontSize: 8,
    color: "#475569",
    lineHeight: 1.4,
  },
  quoteMeta: {
    alignItems: "flex-end",
    maxWidth: "38%",
  },
  quoteTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 6,
  },
  metaLine: {
    fontSize: 8,
    color: "#475569",
    marginBottom: 2,
  },
  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0070c4",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  infoGrid: {
    flexDirection: "row",
    gap: 12,
  },
  infoBox: {
    flex: 1,
    backgroundColor: "#f8fafc",
    borderRadius: 4,
    padding: 8,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  infoLabel: {
    fontSize: 7,
    color: "#64748b",
    marginBottom: 2,
    textTransform: "uppercase",
  },
  infoValue: {
    fontSize: 9,
    color: "#0f172a",
  },
  table: {
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#0070c4",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 7,
    paddingVertical: 6,
    paddingHorizontal: 4,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 4,
    fontSize: 7,
  },
  tableRowAlt: {
    backgroundColor: "#f8fafc",
  },
  colProduct: { width: "28%" },
  colPackage: { width: "12%" },
  colQty: { width: "8%", textAlign: "right" },
  colUnit: { width: "12%", textAlign: "right" },
  colDisc: { width: "8%", textAlign: "right" },
  colIcms: { width: "8%", textAlign: "right" },
  colIpi: { width: "8%", textAlign: "right" },
  colTotal: { width: "16%", textAlign: "right" },
  totalsBox: {
    marginTop: 10,
    alignSelf: "flex-end",
    width: "42%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 4,
    overflow: "hidden",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    fontSize: 8,
  },
  totalRowFinal: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: "#0070c4",
    color: "#ffffff",
    fontWeight: 700,
    fontSize: 10,
  },
  footer: {
    marginTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#e2e8f0",
    paddingTop: 10,
  },
  footerText: {
    fontSize: 7,
    color: "#64748b",
    lineHeight: 1.5,
    marginBottom: 2,
  },
  notes: {
    marginTop: 10,
    padding: 8,
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fde68a",
    fontSize: 8,
    color: "#92400e",
  },
});

interface QuotePdfDocumentProps {
  quote: QuoteDetail;
  company: CompanyProfile | null;
  payment: PaymentAccountProfile | null;
}

function companyLine(company: CompanyProfile | null): string {
  if (!company) return "";
  const parts = [
    company.address_line,
    company.neighborhood,
    [company.city, company.state].filter(Boolean).join("/"),
    company.zip_code ? `CEP ${company.zip_code}` : null,
  ].filter(Boolean);
  return parts.join(" — ");
}

export function QuotePdfDocument({
  quote,
  company,
  payment,
}: QuotePdfDocumentProps) {
  const tradeName = company?.trade_name ?? "tcQUÍMICA - Tavares Companhia Química";

  return (
    <Document title={`Cotação ${quote.quote_number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Text style={styles.brandName}>tcQUÍMICA</Text>
            <Text style={styles.brandSub}>{tradeName}</Text>
            <Text style={styles.brandSub}>
              {company?.legal_name ?? "TAVARES CHEMICAL LTDA"}
            </Text>
            <Text style={styles.brandSub}>{companyLine(company)}</Text>
            <Text style={styles.brandSub}>
              {[company?.phone, company?.email, company?.website]
                .filter(Boolean)
                .join(" | ")}
            </Text>
            {company?.cnpj ? (
              <Text style={styles.brandSub}>
                CNPJ {company.cnpj}
                {company.state_registration
                  ? ` | IE ${company.state_registration}`
                  : ""}
              </Text>
            ) : null}
          </View>

          <View style={styles.quoteMeta}>
            <Text style={styles.quoteTitle}>PROPOSTA COMERCIAL</Text>
            <Text style={styles.metaLine}>Nº {quote.quote_number}</Text>
            <Text style={styles.metaLine}>
              Emissão: {formatDate(quote.created_at)}
            </Text>
            {quote.valid_until ? (
              <Text style={styles.metaLine}>
                Validade: {formatDate(quote.valid_until)}
              </Text>
            ) : null}
            <Text style={styles.metaLine}>
              PTAX: {formatCurrency(quote.metadata.ptax, "BRL")}/USD
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Razão social</Text>
              <Text style={styles.infoValue}>{quote.customer.company_name}</Text>
              {quote.customer.trade_name ? (
                <Text style={[styles.infoValue, { marginTop: 2, color: "#64748b" }]}>
                  {quote.customer.trade_name}
                </Text>
              ) : null}
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Localidade</Text>
              <Text style={styles.infoValue}>
                {[quote.customer.city, quote.customer.state]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </Text>
              {quote.customer.document ? (
                <Text style={[styles.infoValue, { marginTop: 2 }]}>
                  Doc: {quote.customer.document}
                </Text>
              ) : null}
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Contato</Text>
              <Text style={styles.infoValue}>
                {[quote.customer.email, quote.customer.phone]
                  .filter(Boolean)
                  .join(" | ") || "—"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Itens cotados</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colProduct}>Produto</Text>
              <Text style={styles.colPackage}>Embalagem</Text>
              <Text style={styles.colQty}>Qtd</Text>
              <Text style={styles.colUnit}>Unit. BRL</Text>
              <Text style={styles.colDisc}>Desc.</Text>
              <Text style={styles.colIcms}>ICMS</Text>
              <Text style={styles.colIpi}>IPI</Text>
              <Text style={styles.colTotal}>Total BRL</Text>
            </View>

            {quote.items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <View style={styles.colProduct}>
                  <Text>{item.product_name}</Text>
                  <Text style={{ color: "#64748b", fontSize: 6, marginTop: 1 }}>
                    {item.product_code}
                  </Text>
                </View>
                <Text style={styles.colPackage}>{item.package_name ?? "—"}</Text>
                <Text style={styles.colQty}>{formatQuantity(item.quantity)}</Text>
                <Text style={styles.colUnit}>
                  {formatCurrency(item.unit_price, "BRL")}
                </Text>
                <Text style={styles.colDisc}>
                  {formatPercent(item.discount_percent)}
                </Text>
                <Text style={styles.colIcms}>
                  {formatPercent(item.icms_rate)}
                </Text>
                <Text style={styles.colIpi}>{formatPercent(item.ipi_rate)}</Text>
                <Text style={styles.colTotal}>
                  {formatCurrency(item.line_total, "BRL")}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBox}>
            <View style={styles.totalRow}>
              <Text>Subtotal (sem impostos)</Text>
              <Text>{formatCurrency(quote.subtotal, "BRL")}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>IPI</Text>
              <Text>{formatCurrency(quote.ipi_total, "BRL")}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text>ICMS</Text>
              <Text>{formatCurrency(quote.icms_total, "BRL")}</Text>
            </View>
            {quote.discount_total > 0 ? (
              <View style={styles.totalRow}>
                <Text>Descontos</Text>
                <Text>{formatCurrency(quote.discount_total, "BRL")}</Text>
              </View>
            ) : null}
            <View style={styles.totalRowFinal}>
              <Text>TOTAL</Text>
              <Text>{formatCurrency(quote.total, "BRL")}</Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Condições comerciais</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Frete</Text>
              <Text style={styles.infoValue}>{quote.metadata.freight}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Pagamento</Text>
              <Text style={styles.infoValue}>{quote.metadata.payment_terms}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>PTAX referência</Text>
              <Text style={styles.infoValue}>
                {formatCurrency(quote.metadata.ptax, "BRL")}/USD
              </Text>
            </View>
          </View>
        </View>

        {quote.notes ? (
          <View style={styles.notes}>
            <Text>{quote.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          {payment ? (
            <>
              <Text style={styles.footerText}>
                Dados bancários: {payment.bank_name ?? "Banco"} — Ag.{" "}
                {payment.agency ?? "—"} — CC {payment.account_number ?? "—"}
              </Text>
              {payment.pix_key ? (
                <Text style={styles.footerText}>PIX: {payment.pix_key}</Text>
              ) : null}
              {payment.holder_name ? (
                <Text style={styles.footerText}>
                  Titular: {payment.holder_name}
                  {payment.holder_document
                    ? ` — ${payment.holder_document}`
                    : ""}
                </Text>
              ) : null}
            </>
          ) : null}
          <Text style={styles.footerText}>
            Preços em reais calculados com PTAX de referência. Impostos conforme
            legislação vigente e UF do cliente ({quote.customer_state ?? quote.customer.state ?? "—"}).
          </Text>
          <Text style={[styles.footerText, { marginTop: 4 }]}>
            Documento gerado pelo ConectaInsumos — {tradeName}
          </Text>
        </View>
      </Page>
    </Document>
  );
}
