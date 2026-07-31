import React from "react";

import { useEffect, useState } from "react";
import { Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ServiceTicket,
  TicketState,
  UpdateTicketPayload,
  UserData,
  TicketPriority,
} from "@/types/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { updateTicket } from "@/store/ticketsSlice";
import { formatDate, formatDateForInput } from "@/utils/formatDate";
import { CopyButton } from "@/components/atoms/CopyButton";
import { ticketsApi } from "@/lib/api/tickets";
import { Toggle } from "@/components/ui/toggle";

interface EditContactModalProps {
  ticket: ServiceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  states: TicketState[];
  users: UserData[];
  priorities: TicketPriority[];
  /**
   * Si es false, el modal queda en solo lectura: no se pueden disparar
   * acciones de workflow (assign/start/resolve/close). Default: true.
   */
  canRunTicketActions?: boolean;
}

export function EditTicketsService({
  ticket,
  open,
  onOpenChange,
  states,
  users = [],
  priorities,
  canRunTicketActions = true,
}: EditContactModalProps) {
  const [formData, setFormData] = useState<UpdateTicketPayload>({
    id: "",
    contact_id: "",
    product_name: "",
    assigned_at: "",
    started_at: "",
    resolved_at: "",
    closed_at: "",
    created_at: "",
    producto_laqq: false,
    product: "",
    description: "",
    state: "open",
    priority: null,
    assigned_user: null,
    resolution_notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);

  const [closed, setIsClosed] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();
  const MAX_CHARS = 200;
  const [expanded, setExpanded] = useState(false);
  const { list } = useAppSelector((state) => state.products);
  useEffect(() => {
    if (ticket && open) {
      setFormData({
        id: ticket.id,
        contact_id: ticket.contact.id,
        product: ticket.product,
        description: ticket.description,
        state: ticket.state,
        priority: ticket.priority,
        assigned_user: ticket.assigned_user?.id ?? null,
        resolution_notes: ticket.resolution_notes,
        product_name: ticket.product_name,
        created_at: formatDateForInput(ticket.created_at),
        assigned_at: formatDateForInput(ticket.assigned_at),
        started_at: formatDateForInput(ticket.started_at),
        resolved_at: formatDateForInput(ticket.resolved_at),
        closed_at: formatDateForInput(ticket.closed_at),
        producto_laqq: ticket.producto_laqq,
        marca: ticket.marca,
        modelo: ticket.modelo,
        numero_de_serie: ticket.numero_de_serie,
      });
    }
  }, [ticket, open]);

  if (!ticket) return null;

  let productRender: {
    name: string;
    product_code: string;
    category?: string;
    brand: string;
    numero_de_serie: string;
    modelo?: string;
  } = {
    product_code: "",
    name: "",
    category: "",
    brand: "",
    numero_de_serie: "",
    modelo: "",
  };

  if (ticket.producto_laqq) {
    const product = list.find((item) => item.id === ticket?.product);
    productRender = {
      ...product,
      numero_de_serie: ticket.numero_de_serie || "-",
    };
  } else {
    productRender = {
      name: ticket.product_name || "-",
      product_code: "No contiene",
      brand: ticket.marca || "-",
      numero_de_serie: ticket.numero_de_serie || "-",
      modelo: ticket.modelo,
    };
  }

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  if (!ticket) return null;
  const description = ticket.description || "-";
  const isLong = description.length > MAX_CHARS;
  const visibleText =
    !expanded && isLong ? description.slice(0, MAX_CHARS) : description;
  const timelineItems = [
    { key: "created_at", label: "Creación", value: ticket.created_at },
    { key: "started_at", label: "Iniciado", value: ticket.started_at },
    { key: "assigned_at", label: "Asignado", value: ticket.assigned_at },
    { key: "resolved_at", label: "Resuelto", value: ticket.resolved_at },
    { key: "closed_at", label: "Cerrado", value: ticket.closed_at },
    {
      key: "updated_at",
      label: "Última actualización",
      value: ticket.updated_at,
    },
  ];
  const RenderText = ({
    title,
    value,
    expand = false,
  }: {
    title: string;
    value: string | null;
    expand?: boolean;
  }) => {
    return (
      <div className="space-y-2 sm:col-span-2">
        <div className="grid gap-4 sm:grid-cols-3">
          <span className="text-muted-foreground">{title}:</span>
          <div className="sm:col-span-2 flex gap-2 min-w-0">
            <span
              className="
                font-mono
                w-full
                min-w-0
                break-words
                whitespace-pre-wrap
              "
            >
              {value ?? "-"}{" "}
              {expand && (
                <Button
                  variant="link"
                  type="button"
                  className="mb-[-10ox]"
                  onClick={() => setExpanded((v) => !v)}
                >
                  {expanded ? "Ver menos" : "Ver más"}
                </Button>
              )}
            </span>
            {value && <CopyButton value={value} />}
          </div>
        </div>
      </div>
    );
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsLoading(true);

    try {
      const newAssignedUserId = formData.assigned_user ?? null;
      const originalAssignedUserId = ticket.assigned_user?.id ?? null;
      // 2. Asignar siempre que cambie
      if (newAssignedUserId && newAssignedUserId !== originalAssignedUserId) {
        await ticketsApi.assign(ticket.id, {
          assigned_user: newAssignedUserId,
        });
        if (formData.started_at === null) {
          await ticketsApi.start(ticket.id);
        }
      }

      const newResolutionNotes = formData.resolution_notes ?? null;
      const originalResolutionNotes = ticket.resolution_notes ?? null;

      // 2. Cambió y ahora hay contenido → resolver
      if (
        newResolutionNotes &&
        newResolutionNotes.trim() !== "" &&
        newResolutionNotes !== originalResolutionNotes
      ) {
        await ticketsApi.resolve(ticket.id, {
          resolution_notes: newResolutionNotes,
        });

        setFormData({ ...formData, state: "in_progress" });
      }
      if (closed) {
        await ticketsApi.close(ticket.id);
        setFormData({ ...formData, state: "closed" });
      }

      await dispatch(
        updateTicket({
          id: ticket.id,
          data: formData,
        })
      ).unwrap();

      onOpenChange(false);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ticket</DialogTitle>
          <DialogDescription>
            Modificá la información del ticket de servicio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <RenderText
              title="Cliente"
              value={
                ticket.contact
                  ? `${ticket.contact.first_name} ${ticket.contact.last_name}`
                  : "-"
              }
            />
            <RenderText title="Email" value={ticket.contact.email} />
            <RenderText title="Teléfono" value={ticket.contact.phone} />
            <RenderText
              title="Descripción"
              value={`${visibleText}`}
              expand={isLong}
            />
            <div className="col-span-2">
              <Label className="text-lg font-semibold underline">
                Producto:
              </Label>
              <div className="grid gap-2 sm:grid-cols-2 mt-2">
                <p>Nombre: {productRender.name || "-"}</p>
                <p>Código: {productRender.product_code || "-"}</p>
                {productRender.category && (
                  <p>Categoría: {productRender.category || "-"}</p>
                )}
                <p>Marca: {productRender.brand || "-"}</p>
                <p>Número de serie: {productRender.numero_de_serie || "-"}</p>
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="assigned_user">Usuario asignado</Label>
              <Select
                value={formData.assigned_user || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    assigned_user: value || null,
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sin asignar" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.id}>
                      {user.first_name} {user.last_name} ({user.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">
                Prioridad <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.priority || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, priority: value }))
                }
              >
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Seleccionar prioridad" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin asignar</SelectItem>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.id} value={priority.id}>
                      {priority.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.priority && (
                <p className="text-xs text-destructive">{errors.priority}</p>
              )}
            </div>
            <div className="space-y-2 flex items-end">
              <Toggle
                pressed={closed}
                onPressedChange={(pressed) => setIsClosed(pressed)}
                disabled={!canRunTicketActions}
              >
                {!closed ? "Cerrar ticket" : "Abrir ticket"}
              </Toggle>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4" />
                Historial{" "}
              </h4>
              <div className="space-y-2">
                {timelineItems.map((item) => (
                  <div
                    key={item.key}
                    className="flex items-center justify-between text-sm"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <span className="font-mono text-xs">
                      {formatDate(item.value) ?? "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="resolution_notes">Notas de resolución</Label>
              <textarea
                id="resolution_notes"
                name="resolution_notes"
                rows={3}
                value={formData.resolution_notes || ""}
                onChange={handleChange}
                className="flex w-full rounded-md border px-3 py-2 text-sm"
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !canRunTicketActions}
              title={
                canRunTicketActions
                  ? undefined
                  : "Solo el administrador puede modificar el estado del ticket"
              }
            >
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
