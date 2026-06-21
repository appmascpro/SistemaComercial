import {
  Document,
  Font,
  Image,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CompanyProfile, PaymentAccountProfile } from "@/lib/company/get-company";
import { QUOTE_ICMS_RATE, lineTotalUsd } from "@/lib/quotes/quote-pricing-core";
import type { QuoteDetail } from "@/types/quote";
import { formatCurrency, formatDate, formatQuantity } from "@/lib/utils";

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
    fontSize: 8,
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
  brandBlock: { maxWidth: "58%" },
  logo: {
    height: 56,
    width: 240,
    marginBottom: 8,
    objectFit: "contain",
    objectPosition: "left",
  },
  brandSub: { fontSize: 8, color: "#475569", lineHeight: 1.4 },
  quoteMeta: { alignItems: "flex-end", maxWidth: "38%" },
  quoteTitle: {
    fontSize: 14,
    fontWeight: 700,
    color: "#0f172a",
    marginBottom: 6,
  },
  metaLine: { fontSize: 8, color: "#475569", marginBottom: 2 },
  section: { marginBottom: 14 },
  sectionTitle: {
    fontSize: 10,
    fontWeight: 700,
    color: "#0070c4",
    marginBottom: 6,
    textTransform: "uppercase",
  },
  infoGrid: { flexDirection: "row", gap: 12 },
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
  infoValue: { fontSize: 9, color: "#0f172a" },
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
    fontSize: 6,
    paddingVertical: 6,
    paddingHorizontal: 3,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
    paddingVertical: 5,
    paddingHorizontal: 3,
    fontSize: 6,
  },
  tableRowAlt: { backgroundColor: "#f8fafc" },
  colProduct: { width: "28%" },
  colPackage: { width: "12%" },
  colQty: { width: "10%", textAlign: "right" },
  colUnitUsd: { width: "14%", textAlign: "right" },
  colUnitBrl: { width: "14%", textAlign: "right" },
  colTotalUsd: { width: "11%", textAlign: "right" },
  colTotalBrl: { width: "11%", textAlign: "right" },
  totalsBox: {
    marginTop: 10,
    alignSelf: "flex-end",
    width: "48%",
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
  logoSrc: string;
  documentTitle?: string;
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
  logoSrc,
  documentTitle = "PROPOSTA COMERCIAL",
}: QuotePdfDocumentProps) {
  const ptax = quote.metadata.ptax;
  const totalUsd = quote.items.reduce((sum, item) => {
    if (item.unit_price_usd == null) return sum;
    return sum + lineTotalUsd(item.unit_price_usd, item.quantity);
  }, 0);
  const hasUsdItems = quote.items.some((item) => item.unit_price_usd != null);

  return (
    <Document title={`Cotação ${quote.quote_number}`}>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.brandBlock}>
            <Image src={logoSrc} style={styles.logo} />
            <Text style={styles.brandSub}>
              {company?.legal_name ?? "TAVARES CHEMICAL LTDA"}
            </Text>
            <Text style={styles.brandSub}>{companyLine(company)}</Text>
            <Text style={styles.brandSub}>
              {[company?.phone, company?.email, company?.website]
                .filter(Boolean)
                .join(" | ")}
            </Text>
          </View>

          <View style={styles.quoteMeta}>
            <Text style={styles.quoteTitle}>{documentTitle}</Text>
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
              PTAX: {formatCurrency(ptax, "BRL")}/USD
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Cliente</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Razão social</Text>
              <Text style={styles.infoValue}>{quote.customer.company_name}</Text>
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Localidade</Text>
              <Text style={styles.infoValue}>
                {[quote.customer.city, quote.customer.state]
                  .filter(Boolean)
                  .join(" / ") || "—"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Itens cotados — preços/kg com ICMS {QUOTE_ICMS_RATE}%
          </Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colProduct}>Produto</Text>
              <Text style={styles.colPackage}>Emb.</Text>
              <Text style={styles.colQty}>Qtd kg</Text>
              <Text style={styles.colUnitUsd}>USD/kg</Text>
              <Text style={styles.colUnitBrl}>BRL/kg</Text>
              <Text style={styles.colTotalUsd}>Total USD</Text>
              <Text style={styles.colTotalBrl}>Total BRL</Text>
            </View>

            {quote.items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <View style={styles.colProduct}>
                  <Text>{item.product_name}</Text>
                  <Text style={{ color: "#64748b", fontSize: 5, marginTop: 1 }}>
                    {item.product_code}
                  </Text>
                </View>
                <Text style={styles.colPackage}>{item.package_name ?? "—"}</Text>
                <Text style={styles.colQty}>{formatQuantity(item.quantity)}</Text>
                <Text style={styles.colUnitUsd}>
                  {item.unit_price_usd != null
                    ? formatCurrency(item.unit_price_usd, "USD")
                    : "—"}
                </Text>
                <Text style={styles.colUnitBrl}>
                  {formatCurrency(item.unit_price, "BRL")}
                </Text>
                <Text style={styles.colTotalUsd}>
                  {item.unit_price_usd != null
                    ? formatCurrency(
                        lineTotalUsd(item.unit_price_usd, item.quantity),
                        "USD"
                      )
                    : "—"}
                </Text>
                <Text style={styles.colTotalBrl}>
                  {formatCurrency(item.line_total, "BRL")}
                </Text>
              </View>
            ))}
          </View>

          <View style={styles.totalsBox}>
            {hasUsdItems ? (
              <View style={styles.totalRow}>
                <Text>Total USD</Text>
                <Text>{formatCurrency(Math.round(totalUsd * 100) / 100, "USD")}</Text>
              </View>
            ) : null}
            <View style={styles.totalRowFinal}>
              <Text>TOTAL BRL</Text>
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
                {formatCurrency(ptax, "BRL")}/USD
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
          {payment?.pix_key ? (
            <Text style={styles.footerText}>PIX: {payment.pix_key}</Text>
          ) : null}
          <Text style={styles.footerText}>
            Valores por kg com ICMS {QUOTE_ICMS_RATE}% incluso. Conversão BRL pela
            PTAX de referência ({formatCurrency(ptax, "BRL")}/USD). Produtos em
            dólar: referência comercial em USD.
          </Text>
        </View>
      </Page>
    </Document>
  );
}
