import { AlertCircle, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceTicket, TicketPriority, TicketState } from "@/types/api";

export function TicketCard({
  ticket,
  onClick,
  priorities,
  states,
}: {
  ticket: ServiceTicket;
  onClick: () => void;
  priorities: TicketPriority[];
  states: TicketState[];
}) {
  // Buscar la prioridad del ticket en las prioridades de Redux
  const ticketPriority = priorities.find((p) => p.id === ticket.priority);
  const ticketState = states?.find((s) => s.id === ticket.state);
  console.log(ticketState, "ticketState");
  if (!ticketState) {
    return null;
  }
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <Badge variant="outline" className="font-mono text-xs">
                {ticket.ticket_number}
              </Badge>
              <Badge
                style={
                  ticketPriority.color
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
            <CardTitle className="text-base leading-tight truncate">
              {ticket.product_name}
            </CardTitle>
          </div>
          <Badge variant="outline" className="font-mono text-xs">
            <AlertCircle className="w-3 h-3 mr-1" />
            {ticketState.name}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <User className="size-4 shrink-0" />
            <span className="truncate">{ticket.contact.first_name}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Clock className="size-4 shrink-0" />
            <span className="truncate">{ticket.created_at}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
