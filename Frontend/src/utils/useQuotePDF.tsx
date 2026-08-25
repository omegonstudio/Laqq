import { QuoteItemRender, QuoteRender } from "@/types/api";
import {
  convertQuotesState,
  convertQuotesTypes,
  formatQuoteAmount,
} from "./quotesConvert";
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

// Permite que códigos/nombres largos sin espacios bajen de línea en vez de solaparse.
Font.registerHyphenationCallback((word) => {
  if (word.length <= 14) return [word];
  const parts: string[] = [];
  for (let i = 0; i < word.length; i += 8) {
    parts.push(word.slice(i, i + 8));
  }
  return parts;
});

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
    flexDirection: "column",
    alignItems: "flex-start",
  },
  itemTitle: { fontFamily: "Helvetica-Bold", fontSize: 10.5, color: ORANGE },
  itemCode: { fontSize: 8.5, color: "#666", marginTop: 2 },
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

  // Tabla resumen — el ancho va en el View, no en el Text, para que wrapee
  tableHeader: { flexDirection: "row", backgroundColor: ORANGE, alignItems: "stretch" },
  tableRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    borderBottomWidth: 0.5,
    borderBottomColor: "#e8e8e8",
  },
  tableCol: { padding: "5 6", overflow: "hidden" },
  tableHeaderText: {
    color: "white",
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
  },
  tableCellText: { fontSize: 8 },
  tableCellTextRight: { fontSize: 8, textAlign: "right" },

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

const PdfTableCell = ({
  width,
  children,
  header = false,
  right = false,
}: {
  width: string;
  children: string | number;
  header?: boolean;
  right?: boolean;
}) => (
  <View style={[s.tableCol, { width }]}>
    <Text
      style={
        header
          ? [s.tableHeaderText, right ? { textAlign: "right" } : {}]
          : right
            ? s.tableCellTextRight
            : s.tableCellText
      }
    >
      {children}
    </Text>
  </View>
);

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
  const colWidths = hasVariants
    ? {
        name: "26%",
        code: "14%",
        model: "14%",
        qty: "10%",
        price: "18%",
        sub: "18%",
      }
    : {
        name: "34%",
        code: "16%",
        model: "0%",
        qty: "12%",
        price: "19%",
        sub: "19%",
      };

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
            <Text>consultasweb@laqq.com.ar · www.laqq.com</Text>
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
                      <View>
                        <Text style={s.itemVariant}>
                          <Text style={{ fontFamily: "Helvetica-Bold" }}>
                            Variedad:{" "}
                          </Text>

                          {item.variant.code ? ` · ${item.variant.code}` : ""}
                        </Text>
                        {item.variant.technical_specs &&
                          item.variant.technical_specs.length > 0 && (
                            <View style={{ marginTop: 4 }}>
                              {item.variant.technical_specs.map(
                                (spec: { key: string; value: string }, i: number) => (
                                  <Text
                                    key={i}
                                    style={{
                                      fontSize: 8.5,
                                      color: "#555",
                                      lineHeight: 1.5,
                                    }}
                                  >
                                    <Text
                                      style={{ fontFamily: "Helvetica-Bold" }}
                                    >
                                      {spec.key}:{" "}
                                    </Text>
                                    {spec.value}
                                  </Text>
                                )
                              )}
                            </View>
                          )}
                      </View>
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
                    {formatQuoteAmount(item.unit_price, quote.currency)}
                  </Text>
                  <Text>
                    <Text style={{ fontFamily: "Helvetica-Bold" }}>
                      Subtotal:{" "}
                    </Text>
                    {formatQuoteAmount(subtotal, quote.currency)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

        {/* TABLA RESUMEN */}
        <View style={s.tableHeader}>
          <PdfTableCell width={colWidths.name} header>
            Producto
          </PdfTableCell>
          <PdfTableCell width={colWidths.code} header>
            Código
          </PdfTableCell>
          {hasVariants && (
            <PdfTableCell width={colWidths.model} header>
              Modelo
            </PdfTableCell>
          )}
          <PdfTableCell width={colWidths.qty} header right>
            Cantidad
          </PdfTableCell>
          <PdfTableCell width={colWidths.price} header right>
            Precio unit.
          </PdfTableCell>
          <PdfTableCell width={colWidths.sub} header right>
            Subtotal
          </PdfTableCell>
        </View>

        {items.map((item, index) => {
          const subtotal = Number(item.quantity) * Number(item.unit_price);
          return (
            <View key={index} style={s.tableRow} wrap={false}>
              <PdfTableCell width={colWidths.name}>
                {item.product.name ?? "—"}
              </PdfTableCell>
              <PdfTableCell width={colWidths.code}>
                {item.product.product_code ?? "—"}
              </PdfTableCell>
              {hasVariants && (
                <PdfTableCell width={colWidths.model}>
                  {item.variant?.code ?? "—"}
                </PdfTableCell>
              )}
              <PdfTableCell width={colWidths.qty} right>
                {item.quantity}
              </PdfTableCell>
              <PdfTableCell width={colWidths.price} right>
                {formatQuoteAmount(item.unit_price, quote.currency)}
              </PdfTableCell>
              <PdfTableCell width={colWidths.sub} right>
                {formatQuoteAmount(subtotal, quote.currency)}
              </PdfTableCell>
            </View>
          );
        })}

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
