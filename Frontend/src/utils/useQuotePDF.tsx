import { QuoteRender } from "@/types/api";
import { convertQuotesState, convertQuotesTypes } from "./quotesConvert";

const generateQuoteHTML = (quote: QuoteRender): string => {
  const contact = quote.contact;
  const hasVariants = quote.items.some((item) => item.variant !== null);
  return `  
  <html>
    <body style="font-family: Arial; padding: 40px;">
      <h1>Cotización #${quote.quote_number}</h1>

      ${
        contact
          ? `
        <h3>Cliente</h3>
        <p><strong>Empresa:</strong> ${contact.company_name}</p>
        <p><strong>Contacto:</strong> ${contact.first_name} ${contact.last_name}</p>
        <p><strong>Email:</strong> ${contact.email}</p>
        <p><strong>Teléfono:</strong> ${contact.phone}</p>
      `
          : ""
      }

      <hr />

      <p><strong>Estado:</strong> ${convertQuotesState(quote.state)}</p>
      <p><strong>Tipo:</strong> ${convertQuotesTypes(quote.quote_type)}</p>
      <p><strong>Fecha de creación:</strong> ${quote.created_at}</p>
      <p><strong>Última modificación:</strong> ${quote.updated_at}</p>

      <h3>Ítems</h3>

      <table width="100%" border="1" cellspacing="0" cellpadding="8" style="border-collapse: collapse;">
        <thead style="background-color: #f2f2f2;">
          <tr>
            <th align="left">Producto</th>
             <th align="left">Código del producto</th>
            ${
              hasVariants
                ? `
              <th align="left">Variedad</th>
               <th align="left">Código de la variedad</th>
            `
                : ""
            }
            <th align="right">Cantidad</th>
            <th align="right">Precio unitario</th>
            <th align="right">Subtotal</th>
          </tr>
        </thead>
        <tbody>
        ${quote.items
          ?.map(
            (i) => `
              <tr>
                <td>${i.product.name}</td>
               <td>${i.product.product_code ?? "-"}</td>
                ${
                  hasVariants
                    ? `
                      <td>${i.variant?.name ?? "-"}</td>
                      <td>${i.variant?.code ?? "-"}</td>
                    `
                    : ""
                }
                <td align="right">${i.quantity}</td>
                <td align="right">$${i.unit_price}</td>
                <td align="right">$${
                  Number(i.quantity) * Number(i.unit_price)
                }</td>
              </tr>
            `
          )
          .join("")}
        </tbody>
      </table>

      <h2 style="text-align: right; margin-top: 20px;">
        Total: $${quote.total_amount}
      </h2>
    </body>
  </html>
  `;
};
export const generateQuotePdf = (quote: QuoteRender) => {
  const iframe = document.createElement("iframe");
  iframe.style.display = "none";
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(generateQuoteHTML(quote));
  doc.close();

  iframe.contentWindow?.focus();
  iframe.contentWindow?.print();

  setTimeout(() => document.body.removeChild(iframe), 100);
};
