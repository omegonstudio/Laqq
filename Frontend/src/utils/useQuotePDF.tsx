import { QuoteItemRender, QuoteRender } from "@/types/api";
import { convertQuotesState, convertQuotesTypes } from "./quotesConvert";
import html2pdf from "html2pdf.js";

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
const generateItemBlock = (item: QuoteItemRender, index: number): string => {
  const product = item.product;
  const subtotal = Number(item.quantity) * Number(item.unit_price);
  return `
    <div style=" margin-bottom: 16px; overflow: hidden; page-break-inside: avoid;">
      
      <!-- Header del ítem -->
      <div style="background: #f0f4fa; padding: 8px 12px; display: flex; justify-content: space-between; align-items: center;">
        <span style="font-weight: bold; font-size: 12px; color: #FF6B1A;">
          Ítem ${index + 1} · ${product.name}
        </span>
        ${
          product.product_code
            ? `<span style="font-size: 10px; color: #666; font-family: monospace;">Cód: ${product.product_code} Marca: ${product.brand} </span>`
            : ""
        }
      </div>

      <!-- Cuerpo: imagen flotante + descripción -->
      <div style="padding: 12px; overflow: hidden;">
        
        ${
          item.product.image_url
            ? `<img
                src="${item.product.image_url}"
                alt="${product.name}"
                style="float: right; max-width: 200px; max-height: 160px; object-fit: contain; margin: 0 0 12px 20px; border-radius: 4px;"
              />`
            : ""
        }

        ${
          product.description
            ? `<p style="color: #444; line-height: 1.7; margin: 0 0 10px; font-size: 10.5px;">
                ${product.description}
              </p>`
            : ""
        }

        <!-- Clearfix para que el contenedor envuelva el float -->
        <div style="clear: both;"></div>

        ${
          item.variant
            ? `<p style="font-size: 10px; color: #555; margin: 0 0 8px;">
                <strong>Variedad:</strong> ${item.variant.name}
                ${
                  item.variant.code
                    ? `· <span style="font-family: monospace;">${item.variant.code}</span>`
                    : ""
                }
              </p>`
            : ""
        }

        <!-- Totales del ítem -->
        <div style="display: flex; gap: 24px; font-size: 10px; color: #555; border-top: 0.5px solid #eee; padding-top: 8px; margin-top: 4px;">
          <span><strong style="color: #222;">Cantidad:</strong> ${
            item.quantity
          }</span>
          <span><strong style="color: #222;">Precio unitario:</strong> ${formatCurrency(
            item.unit_price
          )}</span>
          <span><strong style="color: #222;">Subtotal:</strong> ${formatCurrency(
            subtotal
          )}</span>
        </div>

      </div>
    </div>
  `;
};

const generateTableRows = (
  items: QuoteItemRender[],
  hasVariants: boolean
): string => {
  return items
    .map((item) => {
      const subtotal = Number(item.quantity) * Number(item.unit_price);
      return `
        <tr>
          <td style="padding: 6px 10px; border-bottom: 0.5px solid #e8e8e8;">${
            item.product.name
          }</td>
          <td style="padding: 6px 10px; border-bottom: 0.5px solid #e8e8e8; font-family: monospace; font-size: 10px;">${
            item.product.product_code ?? "—"
          }</td>
          ${
            hasVariants
              ? `
            <td style="padding: 6px 10px; border-bottom: 0.5px solid #e8e8e8;">${
              item.variant?.name ?? "—"
            }</td>
            <td style="padding: 6px 10px; border-bottom: 0.5px solid #e8e8e8; font-family: monospace; font-size: 10px;">${
              item.variant?.code ?? "—"
            }</td>
          `
              : ""
          }
          <td style="padding: 6px 10px; border-bottom: 0.5px solid #e8e8e8; text-align: right;">${
            item.quantity
          }</td>
          <td style="padding: 6px 10px; border-bottom: 0.5px solid #e8e8e8; text-align: right;">${formatCurrency(
            item.unit_price
          )}</td>
          <td style="padding: 6px 10px; border-bottom: 0.5px solid #e8e8e8; text-align: right;">${formatCurrency(
            subtotal
          )}</td>
        </tr>
      `;
    })
    .join("");
};

const generateQuoteHTML = (quote: QuoteRender, logoBase64: string): string => {
  const { contact, specs, items } = quote;
  const hasVariants = items.some((item) => item.variant !== null);

  return `
  <html>
    <head>
      <meta charset="UTF-8" />
      <style>
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body {
          font-family: Arial, Helvetica, sans-serif;
          font-size: 11px;
          color: #222;
          padding: 48px 56px;
        }
        @media print {
          body { padding: 32px 40px; }
          .no-print { display: none; }
        }
      </style>
    </head>
    <body>

      <!-- HEADER -->
      <div style="display: flex; justify-content: space-between; align-items: flex-start; padding-bottom: 16px; border-bottom: 2px solid #FF6B1A; margin-bottom: 20px;">
        <div>
          <div style="background: #FF6B1A; padding: 6px 10px; border-radius: 4px; display: inline-block;">
              <img
                src="${logoBase64}"
                alt="Logo"
                style="max-width: 100px; max-height: 36px; object-fit: contain; display: block;"
              />
            </div>  
          <p style="font-size: 9px; color: #555; margin-top: 4px; letter-spacing: 1px; text-transform: uppercase;">
            Equipamiento integral de laboratorios
          </p>
        </div>
        <div style="text-align: right; font-size: 10px; color: #444; line-height: 1.7;">
          Saavedra 247 C1083ACE · Buenos Aires, Argentina<br/>
          Tel: (5411) 5277-7200 · Interno: 222<br/>
          info@laqq.com.ar · www.laqq.com
        </div>
      </div>

      <!-- DESTINATARIO + NRO COTIZACIÓN -->
      <div style="display: flex; justify-content: space-between; margin-bottom: 20px;">
        <div style="font-size: 11px; line-height: 1.7;">
          Buenos Aires, ${formatDate(quote.updated_at)}<br/><br/>
          Señores:<br/>
          <strong style="font-size: 13px;">${
            contact?.company_name ?? "—"
          }</strong><br/>
          ${
            contact
              ? `Atención: ${contact.first_name} ${contact.last_name}`
              : ""
          }
        </div>
        <div style="text-align: right;">
          <div style="font-size: 10px; color: #888;">Cotización</div>
          <div style="font-size: 22px; font-weight: bold; color: #FF6B1A;">#${
            quote.quote_number
          }</div>
        
        </div>
      </div>

      <!-- MENSAJE INTRODUCTORIO -->
      <p style="font-size: 10.5px; color: #444; border-left: 3px solid #ddd; padding-left: 10px; margin-bottom: 20px;">
      De nuestra mayor consideración:
        Tenemos el agrado de dirigirnos a Uds. a fin de poner a vuestra disposición el presente presupuesto.
        ${quote.message ? `<br/><em>${quote.message}</em>` : ""}
      </p>

      <!-- ÍTEMS CON DESCRIPCIÓN -->
      <div style="font-size: 9px; font-weight: bold; color: #888; letter-spacing: 1.5px; text-transform: uppercase; border-left: 3px solid #FF6B1A; padding-left: 8px; margin-bottom: 12px;">
        Ítems
      </div>

      ${items.map((item, index) => generateItemBlock(item, index)).join("")}

      <!-- TABLA RESUMEN -->
      <table style="width: 100%; border-collapse: collapse; font-size: 10.5px; margin-top: 8px;">
        <thead>
          <tr style="background: #FF6B1A; color: white;">
            <th style="padding: 7px 10px; text-align: left;">Producto</th>
            <th style="padding: 7px 10px; text-align: left;">Código</th>
            ${
              hasVariants
                ? `
              <th style="padding: 7px 10px; text-align: left;">Variedad</th>
              <th style="padding: 7px 10px; text-align: left;">Cód. variedad</th>
            `
                : ""
            }
            <th style="padding: 7px 10px; text-align: right;">Cantidad</th>
            <th style="padding: 7px 10px; text-align: right;">Precio unit.</th>
            <th style="padding: 7px 10px; text-align: right;">Subtotal</th>
          </tr>
        </thead>
        <tbody>
          ${generateTableRows(items, hasVariants)}
        </tbody>
      </table>

      <!-- TOTAL -->
      <div style="display: flex; justify-content: flex-end; margin-top: 12px;">
        <div style="background: #FF6B1A; color: white; padding: 10px 20px; border-radius: 4px; font-size: 14px; font-weight: bold;">
          Total: ${formatCurrency(quote.total_amount)}
        </div>
      </div>

      <!-- CONDICIONES GENERALES -->
      <div style="margin-top: 28px; border-top: 1px solid #ddd; padding-top: 16px;">
        <div style="font-size: 9px; font-weight: bold; color: #888; letter-spacing: 1.5px; text-transform: uppercase; border-left: 3px solid #FF6B1A; padding-left: 8px; margin-bottom: 12px;">
          Condiciones generales
        </div>
        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px 32px; font-size: 10px;">
          ${[
            ["Precios", specs.precios],
            ["Forma de pago", specs.forma_pago],
            ["Cláusula de pago", specs.clausula_pago],
            ["Validez de oferta", specs.validez_oferta],
            ["Garantía", specs.garantia],
            ["Orden de compra", specs.orden_compra],
          ]
            .map(
              ([label, value]) => `
            <div>
              <span style="font-weight: bold; color: black; display: block; margin-bottom: 2px;">${label}</span>
              <span style="color: #444;">${value || "—"}</span>
            </div>
          `
            )
            .join("")}
        </div>

        ${
          specs.observaciones || quote.observaciones
            ? `
          <div style="margin-top: 12px; font-size: 10px; color: #444;">
            <strong>Observaciones:</strong> ${
              specs.observaciones || quote.observaciones || "—"
            }
          </div>
        `
            : ""
        }
      </div>

      <!-- FOOTER -->
      <div style="margin-top: 32px; border-top: 2px solid #FF6B1A; padding-top: 12px; display: flex; justify-content: space-between; font-size: 10px; color: #666;">
        <div>
          ${
            contact
              ? `${contact.first_name} ${contact.last_name} · ${contact.email}`
              : ""
          }
        </div>
        <div>
          Cotización #${quote.quote_number} · Última modificación: ${formatDate(
    quote.updated_at
  )}
        </div>
      </div>

    </body>
  </html>
  `;
};

export const generateQuotePdf = async (quote: QuoteRender) => {
  const logoBase64 = await getLogoBase64();

  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(generateQuoteHTML(quote, logoBase64)); // <-- pasás el base64
  doc.close();

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  setTimeout(() => document.body.removeChild(iframe), 1000);
};

export const generateQuotePdfBlob = async (
  quote: QuoteRender
): Promise<Blob> => {
  const logoBase64 = await getLogoBase64();

  const container = document.createElement("div");
  container.innerHTML = generateQuoteHTML(quote, logoBase64);

  const worker = html2pdf().from(container);

  const pdfBlob = await worker.outputPdf("blob");

  return pdfBlob;
};
