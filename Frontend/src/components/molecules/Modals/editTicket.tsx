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
import { useAppDispatch } from "@/store/hooks";
import { updateTicket } from "@/store/ticketsSlice";
import { formatDate, formatDateForInput } from "@/utils/formatDate";
import { Input } from "@/components/ui/input";

interface EditContactModalProps {
  ticket: ServiceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  states: TicketState[];
  users: UserData[];
  priorities: TicketPriority[];
}

export function EditTicketsService({
  ticket,
  open,
  onOpenChange,
  states,
  users = [],
  priorities,
}: EditContactModalProps) {
  const [formData, setFormData] = useState<UpdateTicketPayload>({
    contact_id: "",
    product_name: "",
    assigned_at: "",
    started_at: "",
    resolved_at: "",
    closed_at: "",
    created_at: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();
  useEffect(() => {
    if (ticket && open) {
      setFormData({
        contact_id: ticket.contact.id,
        product: ticket.product,
        description: ticket.description,
        attachment: ticket.attachment,
        state: ticket.state,
        priority: ticket.priority,
        assigned_user: ticket.assigned_user.id,
        resolution_notes: ticket.resolution_notes,
        product_name: ticket.product_name,
        created_at: formatDateForInput(ticket.created_at),
        assigned_at: formatDateForInput(ticket.assigned_at),
        started_at: formatDateForInput(ticket.started_at),
        resolved_at: formatDateForInput(ticket.resolved_at),
        closed_at: formatDateForInput(ticket.closed_at),
      });
    }
  }, [ticket, open]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };
  console.log(ticket, "ticket");
  if (!ticket) return null;

  const timelineItems = [
    { key: "assigned_at", label: "Asignado", value: ticket.assigned_at },
    { key: "started_at", label: "Iniciado", value: ticket.started_at },
    { key: "resolved_at", label: "Resuelto", value: ticket.resolved_at },
    { key: "closed_at", label: "Cerrado", value: ticket.closed_at },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ticket) return;

    setIsLoading(true);
    try {
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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar Ticket</DialogTitle>
          <DialogDescription>
            Modificá la información del ticket de servicio
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="description">
                Descripción <span className="text-destructive">*</span>
              </Label>
              <textarea
                id="description"
                name="description"
                rows={4}
                value={formData.description || ""}
                onChange={handleChange}
                className="flex w-full rounded-md border px-3 py-2 text-sm"
                aria-invalid={!!errors.description}
              />
              {errors.description && (
                <p className="text-xs text-destructive">{errors.description}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="state">
                Estado <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.state || ""}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, state: value }))
                }
              >
                <SelectTrigger id="state" aria-invalid={!!errors.state}>
                  <SelectValue placeholder="Seleccionar estado" />
                </SelectTrigger>
                <SelectContent>
                  {states.map((state) => (
                    <SelectItem key={state.id} value={state.id}>
                      {state.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.state && (
                <p className="text-xs text-destructive">{errors.state}</p>
              )}
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
            <div className="space-y-2 sm:col-span-2">
              <h4 className="text-sm font-medium flex items-center gap-2">
                <Calendar className="size-4" />
                Historial{" "}
              </h4>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Creación</span>
                  <span className="font-mono text-xs">
                    {formatDate(ticket.updated_at)}
                  </span>
                </div>
                {timelineItems.map((item) => (
                  <div
                    key={item.key}
                    className="grid gap-4 sm:grid-cols-2 items-center text-sm"
                  >
                    <span className="text-muted-foreground">{item.label}</span>
                    <Input
                      type="date"
                      name={item.key}
                      value={formData[item.key] ?? ""}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          [item.key]: e.target.value,
                        }))
                      }
                    />
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
            <Button type="submit" disabled={isLoading}>
              {isLoading && <Loader2 className="animate-spin mr-2" />}
              {isLoading ? "Guardando..." : "Guardar cambios"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
