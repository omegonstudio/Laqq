import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { ServiceTicket } from "@/types/api";
import { formatDate } from "@/utils/formatDate";
import { convertStateContact } from "@/utils/quotesConvert";
import { Copy } from "lucide-react";

interface ViewTicketModalProps {
  ticket: ServiceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewTicketModal({
  ticket,
  open,
  onOpenChange,
}: ViewTicketModalProps) {
  if (!ticket) return null;

  const { contact } = ticket;
  const copyToClipboard = async (value?: string | null) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
    } catch (e) {
      console.error("No se pudo copiar al portapapeles", e);
    }
  };
  const CopyButton = ({ value }: { value?: string | null }) => {
    if (!value) return null;

    return (
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-6 w-6"
        onClick={() => copyToClipboard(value)}
        title="Copiar"
      >
        <Copy size={14} />
      </Button>
    );
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detalle del Ticket</DialogTitle>
          <DialogDescription>
            Información completa del ticket de servicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          {/* Ticket */}
          <section className="space-y-2">
            <h4 className="font-semibold">Ticket</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>N° Ticket</Label>
                <p>{ticket.ticket_number}</p>
              </div>

              <div>
                <Label>Fecha</Label>
                <p>{formatDate(ticket.created_at)}</p>
              </div>

              <div>
                <Label>Estado</Label>
                <p>{ticket.state}</p>
              </div>

              <div>
                <Label>Prioridad</Label>
                <p className="capitalize">{ticket.priority}</p>
              </div>

              <div className="col-span-2">
                <Label>Producto</Label>
                <p>{ticket.product_name || ticket.product || "-"}</p>
              </div>
            </div>
          </section>

          {/* Descripción */}
          <section className="space-y-2">
            <Label>Descripción</Label>
            <p className="whitespace-pre-wrap rounded-md border p-3">
              {ticket.description || "-"}
            </p>
          </section>

          {/* Resolución */}
          {ticket.resolution_notes && (
            <section className="space-y-2">
              <Label>Notas de resolución</Label>
              <p className="whitespace-pre-wrap rounded-md border p-3">
                {ticket.resolution_notes}
              </p>
            </section>
          )}

          {/* Contacto */}
          <section className="space-y-2">
            <h4 className="font-semibold">Contacto</h4>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Empresa</Label>
                <p>{contact?.company_name || "-"}</p>
              </div>

              <div className="flex items-center gap-2">
                <Label>Email</Label>
                <p>{contact?.email || "-"}</p>
                <CopyButton value={contact?.email} />
              </div>

              <div>
                <Label>Nombre</Label>
                <p>
                  {contact?.first_name || "-"} {contact?.last_name || ""}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <Label>Teléfono</Label>
                <p>{contact?.phone || "-"}</p>
                <CopyButton value={contact?.phone} />
              </div>
            </div>
          </section>

          {/* Asignación */}
          <section className="space-y-2">
            <h4 className="font-semibold">Asignación</h4>

            <div>
              <Label>Usuario asignado</Label>
              <p>{ticket.assigned_user || "Sin asignar"}</p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
