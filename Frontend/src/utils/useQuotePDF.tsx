import { QuoteWithContact } from "@/types/api";

const generateQuoteHTML = (quote: QuoteWithContact): string => {
  const contact = quote.contactInfo;

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
      `
          : ""
      }

      <hr />

      <p><strong>Estado:</strong> ${quote.state}</p>
      <p><strong>Tipo:</strong> ${quote.quote_type}</p>
      <p><strong>Fecha:</strong> ${new Date(
        quote.created_at
      ).toLocaleDateString()}</p>

      <h3>Ítems</h3>
      <ul>
        ${quote.items
          ?.map(
            (i) => `<li>${i.product} - ${i.quantity} x $${i.unit_price}</li>`
          )
          .join("")}
      </ul>

      <h2>Total: $${quote.total_amount}</h2>
    </body>
  </html>
  `;
};

export const generateQuotePdf = (quote: QuoteWithContact) => {
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
