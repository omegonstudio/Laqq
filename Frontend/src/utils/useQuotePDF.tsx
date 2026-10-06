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

/**
 * Convierte la descripción HTML (TipTap) a texto plano usable en react-pdf.
 * Omite tablas (no se renderizan bien) y preserva párrafos/listas vía \n.
 * También parte viñetas/títulos escritos en un solo <p> (caso frecuente).
 */
export const stripHtmlForPdf = (html: string): string => {
  if (!html) return "";
  return (
    html
      // Tablas: omitir por completo (mismo criterio que ProductCard en listados)
      .replace(/<table[\s\S]*?<\/table>/gi, "")
      // Abrir bloques con salto (TipTap anida <p> dentro de <li>, etc.)
      .replace(/<li[^>]*>/gi, "\n• ")
      .replace(/<(p|div|h[1-6]|tr|blockquote)(\s[^>]*)?>/gi, "\n")
      .replace(/<br\s*\/?>/gi, "\n")
      .replace(/<\/(p|div|h[1-6]|li|tr|blockquote|ul|ol)>/gi, "\n")
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/gi, " ")
      .replace(/&bull;/gi, "•")
      .replace(/&amp;/gi, "&")
      .replace(/&lt;/gi, "<")
      .replace(/&gt;/gi, ">")
      .replace(/&quot;/gi, '"')
      .replace(/&#39;/g, "'")
      // Viñetas pegadas en el mismo párrafo (• / ● / ▪)
      .replace(/\s*[•●▪‣]\s*/g, "\n• ")
      // Títulos tipo "Sectores:" / "Principio de Funcionamiento:" tras un punto
      .replace(
        /([.!?…])\s+([A-ZÁÉÍÓÚÑÜ][^.\n:]{0,60}:)/g,
        "$1\n\n$2"
      )
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n[ \t]+/g, "\n")
      // Evitar "• • " si ya venía de <li> + carácter bullet
      .replace(/(•\s*){2,}/g, "• ")
      // Viñetas consecutivas sin línea en blanco entremedio
      .replace(/\n{2,}(• )/g, "\n$1")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim()
  );
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
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 4,
    padding: "8 10",
    marginTop: 8,
    backgroundColor: "#fafafa",
  },
  itemDesc: {
    fontSize: 9,
    color: GRAY_TEXT,
    lineHeight: 1.45,
    marginBottom: 2,
  },
  itemDescWrap: { marginBottom: 6 },
  itemDescBullet: { marginLeft: 6, marginBottom: 3 },
  itemDescSpacer: { fontSize: 4, marginBottom: 4 },
  itemImage: { width: 120, height: 90, objectFit: "contain", marginLeft: 12 },

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
            <Text>Tel: (5411) 5277-7200</Text>
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
          // Con variante: modelo (variant.code). Sin variante: código de producto.
          const itemCode = item.variant?.code?.trim()
            ? item.variant.code.trim()
            : item.product.product_code?.trim() || "";
          return (
            <View key={item.id ?? index} style={s.itemWrap} wrap={false}>
              <View style={s.itemHeader}>
                <Text style={s.itemTitle}>
                  Ítem {index + 1} · {item.product.name}
                </Text>
                {(itemCode || item.product.brand) && (
                  <Text style={s.itemCode}>
                    {itemCode ? `Cód: ${itemCode}` : ""}
                    {itemCode && item.product.brand ? " " : ""}
                    {item.product.brand ? `Marca: ${item.product.brand}` : ""}
                  </Text>
                )}
              </View>
              <View style={s.itemBody}>
                <View style={{ flexDirection: "row" }}>
                  <View style={{ flex: 1 }}>
                    {item.product.description &&
                      (() => {
                        const desc = stripHtmlForPdf(item.product.description);
                        if (!desc) return null;
                        return (
                          <View style={s.itemDescWrap}>
                            {desc.split("\n").map((line, lineIndex) => {
                              const trimmed = line.trim();
                              if (!trimmed) {
                                return (
                                  <Text key={lineIndex} style={s.itemDescSpacer}>
                                    {" "}
                                  </Text>
                                );
                              }
                              const isBullet = trimmed.startsWith("•");
                              return (
                                <Text
                                  key={lineIndex}
                                  style={
                                    isBullet
                                      ? [s.itemDesc, s.itemDescBullet]
                                      : s.itemDesc
                                  }
                                >
                                  {trimmed}
                                </Text>
                              );
                            })}
                          </View>
                        );
                      })()}
                    {item.variant?.technical_specs &&
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
                                <Text style={{ fontFamily: "Helvetica-Bold" }}>
                                  {spec.key}:{" "}
                                </Text>
                                {spec.value}
                              </Text>
                            )
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
  const link = document.createElement("a");
  link.href = url;
  link.download = `${quote.quote_number}.pdf`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 10000);
};
