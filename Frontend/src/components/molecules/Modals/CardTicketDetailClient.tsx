import {
  User,
  Package,
  CheckCircle2,
  Paperclip,
  Calendar,
  FileText,
  AlertCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { ServiceTicket, TicketPriority, TicketState } from "@/types/api";
import { formatDate } from "@/utils/formatDate";
import { convertStateTicket } from "@/utils/quotesConvert";
import { useEffect } from "react";

export function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
  priorities,
  states,
}: {
  ticket: ServiceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priorities: TicketPriority[];
  states: TicketState[];
}) {
  if (!ticket) return null;
  const ticketPriority = priorities.find((p) => p.id === ticket.priority);

  const timelineItems = [
    { label: "Creado", date: formatDate(ticket.created_at) },
    { label: "Asignado", date: formatDate(ticket.assigned_at) },
    {
      label: "Iniciado",
      date: formatDate(ticket.started_at),
    },
    { label: "Resuelto", date: formatDate(ticket.resolved_at) },
    { label: "Cerrado", date: formatDate(ticket.closed_at) },
  ].filter((item) => item.date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] ">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4 pr-5">
            <div>
              <DialogTitle className="text-xl">
                Ticket #{ticket.ticket_number}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {ticket.product_name}
              </DialogDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge variant="outline" className="font-mono text-xs">
                <AlertCircle className="size-3 mr-3" />
                {convertStateTicket(ticket.state)}
              </Badge>
              <Badge
                variant="outline"
                style={
                  ticketPriority.color !== null
                    ? {
                        backgroundColor: `${ticketPriority.color}15`,
                        color: ticketPriority.color,
                        borderColor: ticketPriority.color,
                      }
                    : undefined
                }
              >
                {ticketPriority.name}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Descripción */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <FileText className="size-4" />
                Descripcion
              </h4>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                {ticket.description}
              </p>
            </div>

            <Separator />

            {/* Información del contacto */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <User className="size-4" />
                  Contacto
                </h4>
                <p className="text-sm text-muted-foreground">
                  {ticket.contact.first_name}
                </p>
              </div>

              <div className="space-y-2">
                <h4 className="text-sm font-medium flex items-center gap-2">
                  <Package className="size-4" />
                  Producto
                </h4>
                <p className="text-sm text-muted-foreground">
                  {ticket.product_name}
                  {ticket.product && (
                    <span className="text-xs ml-1">({ticket.product})</span>
                  )}
                </p>
              </div>

              {ticket.assigned_user && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium">Usuario Asignado</h4>
                  <p className="text-sm text-muted-foreground">
                    {ticket.assigned_user.first_name} {""}
                    {ticket.assigned_user.last_name}
                    {""} {""}({ticket.assigned_user.email}){""}
                  </p>
                </div>
              )}

              {ticket.attachments.map((attachment) => (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="size-4" />
                    Adjunto
                  </h4>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={attachment.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver archivo adjunto
                    </a>
                  </Button>
                </div>
              ))}
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4" />
                Historial{" "}
              </h4>
              <div className="space-y-2">
                {timelineItems.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono text-xs">{item.date}</span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Ultima actualizacion
                  </span>
                  <span className="font-mono text-xs">{ticket.updated_at}</span>
                </div>
              </div>
            </div>

            {/* Notas de resolución */}
            {ticket.resolution_notes && (
              <>
                <Separator />
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <CheckCircle2 className="size-4" />
                    Notas de resolucion
                  </h4>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md bg-muted p-3">
                    {ticket.resolution_notes}
                  </p>
                </div>
              </>
            )}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
