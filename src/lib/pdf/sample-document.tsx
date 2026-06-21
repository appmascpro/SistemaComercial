import {
  Document,
  Font,
  Page,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { CompanyProfile, PaymentAccountProfile } from "@/lib/company/get-company";
import {
  formatCustomerAddress,
  formatDocumentLabel,
} from "@/lib/pdf/format-address";
import type { SampleDetail } from "@/types/sample";
import { formatDate, formatQuantity } from "@/lib/utils";

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
  brandBlock: { maxWidth: "58%" },
  brandName: {
    fontSize: 18,
    fontWeight: 700,
    color: "#0070c4",
    marginBottom: 4,
  },
  brandSub: { fontSize: 8, color: "#475569", lineHeight: 1.4 },
  metaBlock: { alignItems: "flex-end", maxWidth: "38%" },
  docTitle: {
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
  infoGrid: { flexDirection: "row", gap: 10 },
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
  addressBox: {
    backgroundColor: "#eff6ff",
    borderRadius: 4,
    padding: 10,
    borderWidth: 1,
    borderColor: "#bfdbfe",
  },
  addressTitle: {
    fontSize: 8,
    fontWeight: 700,
    color: "#1d4ed8",
    marginBottom: 4,
    textTransform: "uppercase",
  },
  addressText: { fontSize: 10, color: "#0f172a", lineHeight: 1.5 },
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
  tableRowAlt: { backgroundColor: "#f8fafc" },
  colCode: { width: "14%" },
  colProduct: { width: "38%" },
  colPackage: { width: "22%" },
  colQty: { width: "12%", textAlign: "right" },
  colStatus: { width: "14%", textAlign: "right" },
  notes: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#fffbeb",
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#fde68a",
    fontSize: 8,
    color: "#92400e",
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
  disclaimer: {
    marginTop: 10,
    fontSize: 7,
    color: "#94a3b8",
    lineHeight: 1.4,
  },
});

const STATUS_LABELS: Record<string, string> = {
  pendente: "Pendente",
  enviada: "Enviada",
  entregue: "Entregue",
  feedback_recebido: "Feedback recebido",
  cancelada: "Cancelada",
};

interface SamplePdfDocumentProps {
  sample: SampleDetail;
  company: CompanyProfile | null;
  payment: PaymentAccountProfile | null;
}

function companyLine(company: CompanyProfile | null): string {
  if (!company) return "";
  return [
    company.address_line,
    company.neighborhood,
    [company.city, company.state].filter(Boolean).join("/"),
    company.zip_code ? `CEP ${company.zip_code}` : null,
  ]
    .filter(Boolean)
    .join(" — ");
}

export function SamplePdfDocument({
  sample,
  company,
  payment,
}: SamplePdfDocumentProps) {
  const tradeName =
    company?.trade_name ?? "tcQUÍMICA - Tavares Companhia Química";
  const shippingAddress = formatCustomerAddress(sample.customer);
  const documentLine = formatDocumentLabel(
    sample.customer.document,
    sample.customer.document_type
  );

  return (
    <Document title={`Amostra ${sample.sample_number ?? sample.id}`}>
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

          <View style={styles.metaBlock}>
            <Text style={styles.docTitle}>ENVIO DE AMOSTRA</Text>
            <Text style={styles.metaLine}>
              Nº {sample.sample_number ?? "—"}
            </Text>
            <Text style={styles.metaLine}>
              Emissão: {formatDate(sample.created_at)}
            </Text>
            {sample.sent_at ? (
              <Text style={styles.metaLine}>
                Envio: {formatDate(sample.sent_at)}
              </Text>
            ) : null}
            {sample.follow_up_date ? (
              <Text style={styles.metaLine}>
                Follow-up: {formatDate(sample.follow_up_date)}
              </Text>
            ) : null}
            <Text style={styles.metaLine}>
              Status: {STATUS_LABELS[sample.status] ?? sample.status}
            </Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dados cadastrais do cliente</Text>
          <View style={styles.infoGrid}>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Razão social</Text>
              <Text style={styles.infoValue}>{sample.customer.company_name}</Text>
              {sample.customer.trade_name ? (
                <Text style={[styles.infoValue, { marginTop: 2, color: "#64748b" }]}>
                  Fantasia: {sample.customer.trade_name}
                </Text>
              ) : null}
              {documentLine ? (
                <Text style={[styles.infoValue, { marginTop: 2 }]}>
                  {documentLine}
                </Text>
              ) : null}
            </View>
            <View style={styles.infoBox}>
              <Text style={styles.infoLabel}>Contato</Text>
              <Text style={styles.infoValue}>
                {[sample.customer.email, sample.customer.phone]
                  .filter(Boolean)
                  .join(" | ") || "—"}
              </Text>
              {sample.customer.segment ? (
                <Text style={[styles.infoValue, { marginTop: 2 }]}>
                  Segmento: {sample.customer.segment}
                </Text>
              ) : null}
            </View>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.addressBox}>
            <Text style={styles.addressTitle}>Endereço de entrega</Text>
            <Text style={styles.addressText}>{shippingAddress}</Text>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Produtos da amostra</Text>
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.colCode}>Código</Text>
              <Text style={styles.colProduct}>Produto</Text>
              <Text style={styles.colPackage}>Embalagem</Text>
              <Text style={styles.colQty}>Qtd</Text>
              <Text style={styles.colStatus}>Status</Text>
            </View>
            {sample.items.map((item, index) => (
              <View
                key={item.id}
                style={[styles.tableRow, index % 2 === 1 ? styles.tableRowAlt : {}]}
              >
                <Text style={styles.colCode}>{item.product_code}</Text>
                <Text style={styles.colProduct}>{item.product_name}</Text>
                <Text style={styles.colPackage}>{item.package_name ?? "Padrão"}</Text>
                <Text style={styles.colQty}>{formatQuantity(item.quantity)}</Text>
                <Text style={styles.colStatus}>{item.status}</Text>
              </View>
            ))}
          </View>
        </View>

        {sample.notes ? (
          <View style={styles.notes}>
            <Text>Observações: {sample.notes}</Text>
          </View>
        ) : null}

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Remetente: {company?.legal_name ?? "TAVARES CHEMICAL LTDA"} —{" "}
            {companyLine(company)}
          </Text>
          {payment ? (
            <Text style={styles.footerText}>
              Contato comercial: {company?.email ?? "vendas@tcquimica.com.br"} |{" "}
              {company?.phone ?? "(11) 2923-1111"}
            </Text>
          ) : null}
          <Text style={styles.disclaimer}>
            Documento gerado pelo FARO. Amostras enviadas sem ônus
            comercial, sujeitas à disponibilidade de estoque. Confirmar recebimento
            e informar feedback até{" "}
            {sample.follow_up_date
              ? formatDate(sample.follow_up_date)
              : "a data combinada"}
            .
          </Text>
        </View>
      </Page>
    </Document>
  );
}
