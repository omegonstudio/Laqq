import { CopyButton } from "@/components/atoms/CopyButton";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useAppSelector } from "@/store/hooks";
import { ServiceTicket } from "@/types/api";
import { formatDate } from "@/utils/formatDate";
import {
  convertPrioritiesTicket,
  convertStateTicket,
} from "@/utils/quotesConvert";
import { File } from "lucide-react";
import { useState } from "react";

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
  const MAX_CHARS = 200;
  const [expanded, setExpanded] = useState(false);

  const { list } = useAppSelector((state) => state.products);
  const product = list.find((item) => item.id === ticket?.product);
  console.log(product, "PRODUCTTT");
  if (!ticket) return null;

  const description = ticket.description || "-";
  const isLong = description.length > MAX_CHARS;
  const visibleText =
    !expanded && isLong ? description.slice(0, MAX_CHARS) : description;
  const { contact } = ticket;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden">
        <DialogHeader>
          <DialogTitle>Detalle del Ticket</DialogTitle>
          <DialogDescription>
            Información completa del ticket de servicio
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm w-full">
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
                <p>{convertStateTicket(ticket.state)}</p>
              </div>

              <div>
                <Label>Prioridad</Label>
                <p className="capitalize">
                  {convertPrioritiesTicket(ticket.priority)}
                </p>
              </div>

              <div className="col-span-2">
                <Label className="text-lg font-semibold underline">
                  Producto:
                </Label>
                <div className="flex items-center gap-2 mt-2">
                  <p>Nombre: {product.name || ticket.product || "-"}</p>
                  <p>Código: {product.product_code || ticket.product || "-"}</p>
                  <p>Categoría: {product.category || ticket.product || "-"}</p>
                  <p>Categoría: {product.brand || ticket.product || "-"}</p>
                </div>
              </div>
            </div>
          </section>

          {/* Descripción */}
          <section className="space-y-2">
            <Label>Descripción</Label>
            <p className="whitespace-pre-wrap break-all rounded-md border p-3 w-full">
              {visibleText}
              {!expanded && isLong && "…"}
            </p>

            {isLong && (
              <Button
                variant="link"
                type="button"
                onClick={() => setExpanded((v) => !v)}
              >
                {expanded ? "Ver menos" : "Ver más..."}
              </Button>
            )}
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
          {contact ? (
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
          ) : (
            <p>Sin contacto</p>
          )}

          {/* Asignación */}
          <section className="space-y-2">
            <div>
              <Label>Usuario asignado</Label>
              <p>
                {ticket.assigned_user
                  ? `${ticket.assigned_user.first_name} ${ticket.assigned_user.last_name} (${ticket.assigned_user.email})`
                  : "Sin asignar"}
              </p>
            </div>
          </section>
          <section className="space-y-2">
            <div>
              <Label>
                <File className="inline-block mr-1" size={16} />
                Archivos
              </Label>
              <p>
                {ticket.attachments && ticket.attachments.length > 0
                  ? ticket.attachments.map((file) => (
                      <a
                        key={file.id}
                        href={file.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block text-blue-600 hover:underline"
                      >
                        {file.file_name}
                      </a>
                    ))
                  : "Sin archivos"}
              </p>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
