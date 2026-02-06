import React, { useEffect } from "react";

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

import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import TicketForm from "../molecules/TicketForm";
import { ServiceTicket, TicketPriority } from "@/types/api";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchTicketPriorities, fetchTicketStates } from "@/store/ticketsSlice";
import { RootState } from "@/store";
import { TicketCard } from "../molecules/CardTicketClient";
import { TicketDetailModal } from "../molecules/Modals/CardTicketDetailClient";

interface ServiceTicketGridProps {
  tickets: ServiceTicket[];
}

// Función auxiliar para obtener clase de color según nivel

// Crear configuración dinámica de prioridad

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
  const dispatch = useAppDispatch();
  const { priorities, states } = useAppSelector(
    (state: RootState) => state.ticketsService
  );
  const [selectedTicket, setSelectedTicket] = useState<ServiceTicket | null>(
    null
  );
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [stateFilter, setStateFilter] = useState<string>("all");
  const [priorityFilter, setPriorityFilter] = useState<string>("all");

  // Cargar prioridades una sola vez al montar el componente
  useEffect(() => {
    dispatch(fetchTicketPriorities({}));
    dispatch(fetchTicketStates({}));
  }, [dispatch]);

  const filteredTickets = tickets.filter((ticket) => {
    // Filtro de búsqueda
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      const matchesSearch =
        ticket.ticket_number.toLowerCase().includes(query) ||
        ticket.contact.first_name.toLowerCase().includes(query) ||
        ticket.product_name.toLowerCase().includes(query) ||
        ticket.description.toLowerCase().includes(query) ||
        (ticket.assigned_user?.first_name.toLowerCase().includes(query) ??
          false);
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
                {states.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id}>
                    {priority.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="Prioridad" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas las prioridades</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority.id} value={priority.id}>
                    {priority.name}
                  </SelectItem>
                ))}
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
        <div className="flex flex-col items-center justify-center py-12 text-center">
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
              priorities={priorities}
              states={states}
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
        states={states}
        open={modalOpen}
        onOpenChange={setModalOpen}
        priorities={priorities}
      />
    </>
  );
}
