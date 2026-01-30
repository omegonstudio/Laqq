"use client";

import React from "react";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Clock,
  User,
  Package,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Loader2,
  Paperclip,
  Calendar,
  FileText,
  Plus,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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
import TicketForm from "../molecules/TicketForm";
import { ServiceTicket } from "@/types/api";

interface ServiceTicketGridProps {
  tickets: ServiceTicket[];
}

const stateConfig: Record<
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

const priorityConfig: Record<string, { label: string; className: string }> = {
  low: {
    label: "Baja",
    className:
      "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  },
  medium: {
    label: "Media",
    className:
      "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  },
  high: {
    label: "Alta",
    className:
      "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
  },
  critical: {
    label: "Critica",
    className: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  },
};

function formatDate(dateString: string | null): string {
  if (!dateString) return "—";
  return format(new Date(dateString), "dd MMM yyyy, HH:mm", { locale: es });
}

function TicketCard({
  ticket,
  onClick,
}: {
  ticket: ServiceTicket;
  onClick: () => void;
}) {
  const state = stateConfig[ticket.state] || stateConfig.open;
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
  const StateIcon = state.icon;

  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50"
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base font-semibold">
              #{ticket.ticket_number}
            </CardTitle>
            <CardDescription className="line-clamp-1">
              {ticket.product_name}
            </CardDescription>
          </div>
          <Badge variant={state.variant} className="shrink-0">
            <StateIcon className="size-3" />
            {state.label}
          </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {ticket.description}
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="outline" className={priority.className}>
            {priority.label}
          </Badge>
          {ticket.attachment && (
            <Badge variant="outline" className="gap-1">
              <Paperclip className="size-3" />
              Adjunto
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <User className="size-3" />
          <span className="truncate">{ticket.contact}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="size-3" />
          <span>{formatDate(ticket.created_at)}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function TicketDetailModal({
  ticket,
  open,
  onOpenChange,
}: {
  ticket: ServiceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  if (!ticket) return null;

  const state = stateConfig[ticket.state] || stateConfig.open;
  const priority = priorityConfig[ticket.priority] || priorityConfig.medium;
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
              <Badge variant="outline" className={priority.className}>
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
                  {ticket.contact}
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
                    <span className="font-mono text-xs">
                      {formatDate(item.date)}
                    </span>
                  </div>
                ))}
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">
                    Ultima actualizacion
                  </span>
                  <span className="font-mono text-xs">
                    {formatDate(ticket.updated_at)}
                  </span>
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

function CreateTicketCard({ onClick }: { onClick: () => void }) {
  return (
    <Card
      className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 border-dashed flex items-center justify-center min-h-[200px]"
      onClick={onClick}
    >
      <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
        <div className="rounded-full bg-primary/10 p-4">
          <Plus className="size-8 text-primary" />
        </div>
        <div className="text-center">
          <p className="font-medium">Crear Nuevo Ticket</p>
          <p className="text-sm text-muted-foreground">
            Agregar un ticket de servicio
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

export function ServiceTicketGrid({ tickets }: ServiceTicketGridProps) {
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(
    null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);

  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  const filteredTickets = tickets.filter((ticket) => {
    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.contact.toLowerCase().includes(query) ||
        ticket.product_name.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        (ticket.assigned_user?.toLowerCase().includes(query) ?? false);
      if (!matchesSearch) return false;
    }

    // Filtro por estado
    if (stateFilter !== "all" && ticket.state !== stateFilter) {
      return false;
    }

    // Filtro por prioridad
    if (priorityFilter !== "all" && ticket.priority !== priorityFilter) {
      return false;
    }

    return true;
  });

  const handleTicketClick = (ticket: ServiceTicket) => {
    setSelectedTicket(ticket);
    setModalOpen(true);
  };

  const hasFilters =
    searchQuery || stateFilter !== "all" || priorityFilter !== "all";

  const clearFilters = () => {
    setSearchQuery("");
    setStateFilter("all");
    setPriorityFilter("all");
  };

  if (tickets.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <AlertCircle className="size-12 text-muted-foreground mb-4" />
        <h3 className="text-lg font-medium">No hay tickets</h3>
        <p className="text-sm text-muted-foreground">
          No se encontraron tickets de servicio.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="mb-6 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Buscar por numero, contacto, producto..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="open">Abierto</SelectItem>
                <SelectItem value="in_progress">En Progreso</SelectItem>
                <SelectItem value="resolved">Resuelto</SelectItem>
                <SelectItem value="closed">Cerrado</SelectItem>
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                <SelectItem value="low">Baja</SelectItem>
                <SelectItem value="medium">Media</SelectItem>
                <SelectItem value="high">Alta</SelectItem>
                <SelectItem value="critical">Critica</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {hasFilters && (
          <p className="text-sm text-muted-foreground">
            {filteredTickets.length} resultado
            {filteredTickets.length !== 1 ? "s" : ""} encontrado
            {filteredTickets.length !== 1 ? "s" : ""}
          </p>
        )}
      </div>

      {filteredTickets.length === 0 && hasFilters ? (
        <div className="flex flex-col items-center justify-center py-12 text-centerq">
          <Search className="size-10 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">Sin resultados</h3>
          <p className="text-sm text-muted-foreground">
            No se encontraron tickets que coincidan con los filtros aplicados.
          </p>
          <Button
            variant="outline"
            className="mt-4 bg-transparent"
            onClick={clearFilters}
          >
            Limpiar filtros
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          <CreateTicketCard onClick={() => setCreateModalOpen(true)} />
          {filteredTickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              onClick={() => handleTicketClick(ticket)}
            />
          ))}
        </div>
      )}
      <Dialog open={createModalOpen} onOpenChange={setCreateModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Crear Ticket de Soporte</DialogTitle>
          </DialogHeader>
          <TicketForm onClose={() => setCreateModalOpen(false)} />
        </DialogContent>
      </Dialog>

      <TicketDetailModal
        ticket={selectedTicket}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </>
  );
}
