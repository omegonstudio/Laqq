import {
  User,
  Package,
  CheckCircle2,
  Paperclip,
  Calendar,
  FileText,
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
import { ServiceTicket, TicketPriority } from "@/types/api";
import { getPriorityConfig, stateConfig } from "../CardTicketClient";

export function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
  priorities,
}: {
  ticket: ServiceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  priorities: TicketPriority[];
}) {
  if (!ticket) return null;

  const state = stateConfig[ticket.state] || stateConfig.open;
  const ticketPriority = priorities.find((p) => p.id === ticket.priority);
  const priority = getPriorityConfig(ticketPriority);
  const StateIcon = state.icon;

  const timelineItems = [
    { label: "Creado", date: ticket.created_at },
    { label: "Asignado", date: ticket.assigned_at },
    { label: "Iniciado", date: ticket.started_at },
    { label: "Resuelto", date: ticket.resolved_at },
    { label: "Cerrado", date: ticket.closed_at },
  ].filter((item) => item.date);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <div className="flex items-start justify-between gap-4">
            <div>
              <DialogTitle className="text-xl">
                Ticket #{ticket.ticket_number}
              </DialogTitle>
              <DialogDescription className="mt-1">
                {ticket.product_name}
              </DialogDescription>
            </div>
            <div className="flex gap-2 shrink-0">
              <Badge variant={state.variant}>
                <StateIcon className="size-3" />
                {state.label}
              </Badge>
              <Badge
                variant="outline"
                className={priority.className}
                style={
                  priority.color
                    ? {
                        backgroundColor: `${priority.color}15`,
                        color: priority.color,
                        borderColor: priority.color,
                      }
                    : undefined
                }
              >
                {priority.label}
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
                    {ticket.assigned_user}
                  </p>
                </div>
              )}

              {ticket.attachment && (
                <div className="space-y-2">
                  <h4 className="text-sm font-medium flex items-center gap-2">
                    <Paperclip className="size-4" />
                    Adjunto
                  </h4>
                  <Button variant="outline" size="sm" asChild>
                    <a
                      href={ticket.attachment}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Ver archivo adjunto
                    </a>
                  </Button>
                </div>
              )}
            </div>

            <Separator />

            {/* Timeline */}
            <div className="space-y-3">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4" />
                Historial de tiempos
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
