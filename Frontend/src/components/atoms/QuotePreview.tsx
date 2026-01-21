// components/quotes/QuotePreviewDialog.tsx
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Quote, QuoteWithContact } from "@/types/api";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  quote: QuoteWithContact | null;
}

const QuotePreviewDialog = ({ open, onOpenChange, quote }: Props) => {
  if (!quote) return null;

  const contact = quote.contactInfo;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Cotización #{quote.quote_number}</DialogTitle>
        </DialogHeader>

        {contact && (
          <div className="border rounded p-3">
            <p className="font-medium">Cliente</p>
            <p>{contact.company_name}</p>
            <p>
              {contact.first_name} {contact.last_name}
            </p>
            <p>{contact.email}</p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="font-medium">Estado</p>
            <p>{quote.state}</p>
          </div>

          <div>
            <p className="font-medium">Tipo</p>
            <p>{quote.quote_type}</p>
          </div>

          <div>
            <p className="font-medium">Fecha</p>
            <p>{new Date(quote.created_at).toLocaleDateString()}</p>
          </div>
        </div>

        {quote.items?.length && (
          <table className="w-full text-xs border mt-4">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Cant.</th>
                <th>Precio</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {quote.items.map((i) => (
                <tr key={i.id}>
                  <td className="p-2">{i.productName}</td>
                  <td>{i.quantity}</td>
                  <td>${i.unit_price}</td>
                  <td>${i.subtotal}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <div className="text-right font-semibold mt-4">
          Total: ${quote.total_amount}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuotePreviewDialog;
