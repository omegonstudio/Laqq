import { QuoteItemRender, QuoteRender } from "@/types/api";
import { convertQuotesState, convertQuotesTypes } from "./quotesConvert";
import {
  Document,
  Page,
  Text,
  View,
  Image,
  StyleSheet,
  pdf,
  Font,
} from "@react-pdf/renderer";

const formatCurrency = (value: string | number | null): string => {
  if (value === null || value === undefined) return "$0,00";
  return `$${Number(value).toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const formatDate = (dateStr: string): string => {
  return new Date(dateStr).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
};
const getLogoBase64 = async (): Promise<string> => {
  const response = await fetch("/logo-laqq.png"); // ← png real ahora
  if (!response.ok) {
    console.error("No se pudo cargar el logo:", response.status);
    return "";
  }
  const blob = await response.blob();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

const ORANGE = "#FF6B1A";
const GRAY_TEXT = "#444";
const LIGHT_BG = "#f0f4fa";

const s = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#222",
    padding: "40 48",
  },

  // Header
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    borderBottomWidth: 2,
    borderBottomColor: ORANGE,
    paddingBottom: 10,
    marginBottom: 16,
  },
  logoBg: { padding: "5 8", borderRadius: 4 },
  logo: { width: 90, height: 30, objectFit: "contain" },
  tagline: { fontSize: 7.5, color: "#555", marginTop: 3, letterSpacing: 1 },
  headerRight: {
    fontSize: 8.5,
    color: "#444",
    lineHeight: 1.7,
    textAlign: "right",
  },

  // Destinatario
  recipientRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  recipientText: { fontSize: 10, lineHeight: 1.7 },
  company: { fontSize: 12, fontFamily: "Helvetica-Bold" },
  quoteLabel: { fontSize: 8.5, color: "#888" },
  quoteNumber: { fontSize: 20, fontFamily: "Helvetica-Bold", color: ORANGE },

  // Intro
  intro: {
    fontSize: 9.5,
    color: GRAY_TEXT,
    borderLeftWidth: 3,
    borderLeftColor: "#ddd",
    paddingLeft: 8,
    marginBottom: 16,
  },

  // Section title
  sectionTitle: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    color: "#888",
    letterSpacing: 1.5,
    borderLeftWidth: 3,
    borderLeftColor: ORANGE,
    paddingLeft: 8,
    marginBottom: 10,
    textTransform: "uppercase",
  },

  // Item block
  itemWrap: { marginBottom: 14 },
  itemHeader: {
    backgroundColor: LIGHT_BG,
    padding: "6 10",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  itemTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: ORANGE },
  itemCode: { fontSize: 8.5, color: "#666" },
  itemBody: { padding: "8 10" },
  itemRow: {
    flexDirection: "row",
    gap: 20,
    borderTopWidth: 0.5,
    borderTopColor: "#eee",
    paddingTop: 6,
    marginTop: 4,
  },
  itemDesc: { fontSize: 9, color: GRAY_TEXT, lineHeight: 1.6, marginBottom: 6 },
  itemVariant: { fontSize: 8.5, color: "#555", marginBottom: 6 },
  itemImage: { width: 120, height: 90, objectFit: "contain", marginLeft: 12 },

  // Tabla resumen
  tableHeader: { flexDirection: "row", backgroundColor: ORANGE },
  tableHeaderCell: {
    padding: "5 8",
    color: "white",
    fontFamily: "Helvetica-Bold",
    fontSize: 9,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e8e8e8",
  },
  tableCell: { padding: "5 8", fontSize: 9 },
  tableCellRight: { padding: "5 8", fontSize: 9, textAlign: "right" },

  // Total
  totalRow: { flexDirection: "row", justifyContent: "flex-end", marginTop: 10 },
  totalBadge: {
    backgroundColor: ORANGE,
    color: "white",
    padding: "8 16",
    borderRadius: 4,
    fontSize: 13,
    fontFamily: "Helvetica-Bold",
  },

  // Condiciones
  conditionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 4,
  },
  conditionItem: { width: "47%", marginBottom: 6 },
  conditionLabel: {
    fontFamily: "Helvetica-Bold",
    color: "#222",
    fontSize: 9,
    marginBottom: 2,
  },
  conditionValue: { color: GRAY_TEXT, fontSize: 9 },

  // Footer
  footer: {
    marginTop: 24,
    borderTopWidth: 2,
    borderTopColor: ORANGE,
    paddingTop: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8.5,
    color: "#666",
  },
});

// ─── Componente PDF ───────────────────────────────────────────────────────────

const QuotePDF = ({
  quote,
  logoBase64,
}: {
  quote: QuoteRender;
  logoBase64: string;
}) => {
  const { contact, specs, items } = quote;
  const hasVariants = items.some((item) => item.variant !== null);
  const stripHtml = (html: string) =>
    html
      .replace(/<[^>]*>/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  // Anchos de columnas de la tabla
  const colWidths = hasVariants
    ? {
        name: "22%",
        code: "12%",
        varName: "18%",
        varCode: "11%",
        qty: "8%",
        price: "13%",
        sub: "13%",
      }
    : { name: "30%", code: "18%", qty: "12%", price: "18%", sub: "18%" };

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* HEADER */}
        <View style={s.headerRow}>
          <View>
            <View style={s.logoBg}>
              {logoBase64 ? (
                <Image src={logoBase64} style={s.logo} />
              ) : (
                <Text
                  style={{
                    color: "white",
                    fontSize: 14,
                    fontFamily: "Helvetica-Bold",
                  }}
                >
                  LAQQ
                </Text>
              )}
            </View>
            <Text style={s.tagline}>EQUIPAMIENTO INTEGRAL DE LABORATORIOS</Text>
          </View>
          <View style={s.headerRight}>
            <Text>Saavedra 247 C1083ACE · Buenos Aires, Argentina</Text>
            <Text>Tel: (5411) 5277-7200 · Interno: 222</Text>
            <Text>info@laqq.com.ar · www.laqq.com</Text>
          </View>
        </View>

        {/* DESTINATARIO + NRO */}
        <View style={s.recipientRow}>
          <View style={s.recipientText}>
            <Text>Buenos Aires, {formatDate(quote.updated_at)}</Text>
            <Text> </Text>
            <Text>Señores:</Text>
            <Text style={s.company}>{contact?.company_name ?? "—"}</Text>
            {contact && (
              <Text>
                Atención: {contact.first_name} {contact.last_name}
              </Text>
            )}
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={s.quoteLabel}>Cotización</Text>
            <Text style={s.quoteNumber}>#{quote.quote_number}</Text>
          </View>
        </View>

        {/* INTRO */}
        <View style={s.intro}>
          <Text>
            De nuestra mayor consideración: Tenemos el agrado de dirigirnos a
            Uds. a fin de poner a vuestra disposición el presente presupuesto.
            {quote.message ? `\n${quote.message}` : ""}
          </Text>
        </View>

        {/* ÍTEMS */}
        <Text style={s.sectionTitle}>Ítems</Text>

        {items.map((item, index) => {
          const subtotal = Number(item.quantity) * Number(item.unit_price);
          return (
            <View key={item.id ?? index} style={s.itemWrap} wrap={false}>
              <View style={s.itemHeader}>
                <Text style={s.itemTitle}>
                  Ítem {index + 1} · {item.product.name}
                </Text>
                {item.product.product_code && (
                  <Text style={s.itemCode}>
                    Cód: {item.product.product_code} Marca: {item.product.brand}
                  </Text>
                )}
              </View>
              <View style={s.itemBody}>
                <View style={{ flexDirection: "row" }}>
                  <View style={{ flex: 1 }}>
                    {item.product.description && (
                      <Text style={s.itemDesc}>
                        {stripHtml(item.product.description)}
                      </Text>
                    )}
                    {item.variant && (
                      <Text style={s.itemVariant}>
                        <Text style={{ fontFamily: "Helvetica-Bold" }}>
                          Variedad:{" "}
                        </Text>

                        {item.variant.code ? ` · ${item.variant.code}` : ""}
                      </Text>
                    )}
                  </View>
                  {item.product.image_url && (
                    <Image src={item.product.image_url} style={s.itemImage} />
                  )}
                </View>
                <View style={s.itemRow}>
                  <Text>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>
                      Cantidad:{" "}
                    </Text>
                    {item.quantity}
                  </Text>
                  <Text>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>
                      Precio unitario:{" "}
                    </Text>
                    {formatCurrency(item.unit_price)}
                  </Text>
                  <Text>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>
                      Subtotal:{" "}
                    </Text>
                    {formatCurrency(subtotal)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* TABLA RESUMEN */}
        <View style={s.tableHeader}>
          <Text
            style={[
              s.tableHeaderCell,
              { width: hasVariants ? colWidths.name : colWidths.name },
            ]}
          >
            Producto
          </Text>
          <Text style={[s.tableHeaderCell, { width: colWidths.code }]}>
            Código
          </Text>
          {hasVariants && (
            <>
              <Text
                style={[
                  s.tableHeaderCell,
                  {
                    width: (colWidths as typeof colWidths & { varName: string })
                      .varCode,
                  },
                ]}
              >
                Cód. variedad
              </Text>
            </>
          )}
          <Text
            style={[
              s.tableHeaderCell,
              { width: colWidths.qty, textAlign: "right" },
            ]}
          >
            Cantidad
          </Text>
          <Text
            style={[
              s.tableHeaderCell,
              { width: colWidths.price, textAlign: "right" },
            ]}
          >
            Precio unit.
          </Text>
          <Text
            style={[
              s.tableHeaderCell,
              { width: colWidths.sub, textAlign: "right" },
            ]}
          >
            Subtotal
          </Text>
        </View>

        {items.map((item, index) => {
          const subtotal = Number(item.quantity) * Number(item.unit_price);
          return (
            <View key={index} style={s.tableRow}>
              <Text style={[s.tableCell, { width: colWidths.name }]}>
                {item.product.name ?? "—"}
              </Text>
              <Text style={[s.tableCell, { width: colWidths.code }]}>
                {item.product.product_code ?? "—"}
              </Text>
              {hasVariants && (
                <>
                  <Text
                    style={[
                      s.tableCell,
                      {
                        width: (
                          colWidths as typeof colWidths & { varCode: string }
                        ).varCode,
                      },
                    ]}
                  >
                    {item.variant?.code ?? "—"}
                  </Text>
                </>
              )}
              <Text style={[s.tableCellRight, { width: colWidths.qty }]}>
                {item.quantity}
              </Text>
              <Text style={[s.tableCellRight, { width: colWidths.price }]}>
                {formatCurrency(item.unit_price)}
              </Text>
              <Text style={[s.tableCellRight, { width: colWidths.sub }]}>
                {formatCurrency(subtotal)}
              </Text>
            </View>
          );
        })}

        {/* TOTAL */}
        <View style={s.totalRow}>
          <Text style={s.totalBadge}>
            Total: {formatCurrency(quote.total_amount)}
          </Text>
        </View>

        {/* CONDICIONES GENERALES */}
        <View
          style={{
            marginTop: 24,
            borderTopWidth: 1,
            borderTopColor: "#ddd",
            paddingTop: 14,
          }}
        >
          <Text style={s.sectionTitle}>Condiciones generales</Text>
          <View style={s.conditionsGrid}>
            {(
              [
                ["Precios", specs.precios],
                ["Forma de pago", specs.forma_pago],
                ["Cláusula de pago", specs.clausula_pago],
                ["Validez de oferta", specs.validez_oferta],
                ["Garantía", specs.garantia],
                ["Orden de compra", specs.orden_compra],
              ] as [string, string][]
            ).map(([label, value]) => (
              <View key={label} style={s.conditionItem}>
                <Text style={s.conditionLabel}>{label}</Text>
                <Text style={s.conditionValue}>{value || "—"}</Text>
              </View>
            ))}
          </View>
          {(specs.observaciones || quote.observaciones) && (
            <View style={{ marginTop: 10 }}>
              <Text style={{ fontSize: 9, color: GRAY_TEXT }}>
                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                  Observaciones:{" "}
                </Text>
                {specs.observaciones || quote.observaciones || "—"}
              </Text>
            </View>
          )}
        </View>

        {/* FOOTER */}
        <View style={s.footer}>
          <Text>
            {contact
              ? `${contact.first_name} ${contact.last_name} · ${contact.email}`
              : ""}
          </Text>
          <Text>
            Cotización #{quote.quote_number} · Última modificación:{" "}
            {formatDate(quote.updated_at)}
          </Text>
        </View>
      </Page>
    </Document>
  );
};

// ─── Exports ──────────────────────────────────────────────────────────────────

export const generateQuotePdfBlob = async (
  quote: QuoteRender
): Promise<Blob> => {
  const logoBase64 = await getLogoBase64();
  const blob = await pdf(
    <QuotePDF quote={quote} logoBase64={logoBase64} />
  ).toBlob();
  return blob;
};
export const generateQuotePdf = async (quote: QuoteRender): Promise<void> => {
  const logoBase64 = await getLogoBase64();
  const blob = await pdf(
    <QuotePDF quote={quote} logoBase64={logoBase64} />
  ).toBlob();
  const url = URL.createObjectURL(blob);
  window.open(url, "_blank");
  // El navegador abre el PDF en su visor nativo, que incluye el botón de imprimir
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
