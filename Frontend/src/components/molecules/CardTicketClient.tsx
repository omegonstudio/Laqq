import {
  AlertCircle,
  CheckCircle2,
  Clock,
  Loader2,
  User,
  XCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ServiceTicket, TicketPriority } from "@/types/api";

export const stateConfig: Record<
  string,
  {
    label: string;
    variant: "default" | "secondary" | "destructive" | "outline";
    icon: React.ElementType;
  }
> = {
  open: { label: "Abierto", variant: "outline", icon: AlertCircle },
  in_progress: { label: "En Progreso", variant: "default", icon: Loader2 },
  resolved: { label: "Resuelto", variant: "secondary", icon: CheckCircle2 },
  closed: { label: "Cerrado", variant: "secondary", icon: XCircle },
};

const getLevelColorClass = (level: number): string => {
  if (level <= 1) {
    return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300";
  } else if (level === 2) {
    return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300";
  } else if (level === 3) {
    return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300";
  } else {
    return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300";
  }
};
export const getPriorityConfig = (priority: TicketPriority | undefined) => {
  if (!priority) {
    return {
      label: "Sin prioridad",
      className:
        "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
      color: null,
    };
  }

  return {
    label: priority.name,
    className: getLevelColorClass(priority.level),
    color: priority.color,
  };
};

export function TicketCard({
  ticket,
  onClick,
  priorities,
}: {
  ticket: ServiceTicket;
  onClick: () => void;
  priorities: TicketPriority[];
}) {
  // Buscar la prioridad del ticket en las prioridades de Redux
  const ticketPriority = priorities.find((p) => p.id === ticket.priority);
  const priority = getPriorityConfig(ticketPriority);
  const state = stateConfig[ticket.state] || stateConfig.open;
  const StateIcon = state.icon;

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
            <CardTitle className="text-base leading-tight truncate">
              {ticket.product_name}
            </CardTitle>
          </div>
          <Badge variant={state.variant}>
            <StateIcon className="w-3 h-3 mr-1" />
            {state.label}
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
