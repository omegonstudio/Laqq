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
import { closeTicket, fetchTickets, updateTicket } from "@/store/ticketsSlice";
import { formatDate, formatDateForInput } from "@/utils/formatDate";
import { CopyButton } from "@/components/atoms/CopyButton";
import { ticketsApi } from "@/lib/api/tickets";
import { convertStateTicket } from "@/utils/quotesConvert";
import { useIsAdmin } from "@/hooks/usePermissions";

interface EditContactModalProps {
  ticket: ServiceTicket | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  states: TicketState[];
  users: UserData[];
  priorities: TicketPriority[];
  canRunTicketActions?: boolean;
}

export function EditTicketsService({
  ticket,
  open,
  onOpenChange,
  states: _states,
  users = [],
  priorities: _priorities,
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
    state: "received",
    priority: null,
    assigned_user: null,
    resolution_notes: "",
    internal_notes: "",
  });

  const [isLoading, setIsLoading] = useState(false);
  const [closed, setIsClosed] = useState(false);
  const [classifyTarget, setClassifyTarget] = useState<
    "received" | "diagnosed" | "quoted" | "closed"
  >("received");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const dispatch = useAppDispatch();
  const isAdmin = useIsAdmin();
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
        priority: ticket.priority ?? null,
        assigned_user: ticket.assigned_user?.id ?? null,
        resolution_notes: ticket.resolution_notes,
        internal_notes: ticket.internal_notes ?? "",
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
      setIsClosed(ticket.state === "closed");
      setClassifyTarget("received");
      setErrors({});
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

  const description = ticket.description || "-";
  const isLong = description.length > MAX_CHARS;
  const visibleText =
    !expanded && isLong ? description.slice(0, MAX_CHARS) : description;
  const timelineItems = [
    { key: "created_at", label: "Creación", value: ticket.created_at },
    { key: "assigned_at", label: "Asignado", value: ticket.assigned_at },
    { key: "diagnosed_at", label: "Diagnosticado", value: ticket.diagnosed_at },
    { key: "quoted_at", label: "Presupuestado", value: ticket.quoted_at },
    { key: "started_at", label: "Iniciado (legado)", value: ticket.started_at },
    { key: "resolved_at", label: "Resuelto (legado)", value: ticket.resolved_at },
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
            <span className="font-mono w-full min-w-0 break-words whitespace-pre-wrap">
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

  const currentState =
    typeof ticket.state === "string" ? ticket.state : String(ticket.state);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData) return;

    setIsLoading(true);
    setErrors({});

    try {
      const newAssignedUserId =
        formData.assigned_user === "none" || formData.assigned_user === ""
          ? null
          : formData.assigned_user ?? null;
      const originalAssignedUserId = ticket.assigned_user?.id ?? null;

      if (newAssignedUserId !== originalAssignedUserId) {
        await ticketsApi.assign(ticket.id, {
          assigned_user: newAssignedUserId,
        });
      }

      // Workflow: acciones explícitas (no PUT de state)
      if (canRunTicketActions && currentState === "received") {
        // Si el usuario marcó cierre desde received, close directo
        if (!closed) {
          // sin diagnose automático al guardar
        }
      }

      const newResolutionNotes = formData.resolution_notes ?? null;
      const originalResolutionNotes = ticket.resolution_notes ?? null;
      if (
        canRunTicketActions &&
        currentState === "diagnosed" &&
        newResolutionNotes &&
        newResolutionNotes.trim() !== "" &&
        newResolutionNotes !== originalResolutionNotes
      ) {
        await ticketsApi.resolve(ticket.id, {
          resolution_notes: newResolutionNotes,
        });
      }

      if (canRunTicketActions && closed && currentState !== "closed") {
        await dispatch(closeTicket(ticket.id)).unwrap();
      }

      // PUT sin state ni priority: solo campos editables (notas internas, etc.)
      const dataToUpdate: Partial<UpdateTicketPayload> = {
        id: formData.id,
        contact_id: formData.contact_id,
        description: formData.description,
        product_name: formData.product_name,
        producto_laqq: formData.producto_laqq,
        product: formData.product,
        marca: formData.marca,
        modelo: formData.modelo,
        numero_de_serie: formData.numero_de_serie,
        resolution_notes: formData.resolution_notes,
        internal_notes: formData.internal_notes,
        assigned_user: newAssignedUserId,
      };

      await dispatch(
        updateTicket({
          id: ticket.id,
          data: dataToUpdate,
        })
      ).unwrap();

      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "No se pudo guardar el ticket";
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  const runWorkflow = async (action: "diagnose" | "quote" | "reopen" | "classify") => {
    if (!ticket) return;
    setIsLoading(true);
    setErrors({});
    try {
      if (action === "diagnose") {
        await ticketsApi.diagnose(ticket.id);
      } else if (action === "quote") {
        await ticketsApi.quote(ticket.id, {
          resolution_notes: formData.resolution_notes || undefined,
        });
      } else if (action === "reopen") {
        await ticketsApi.reopen(ticket.id);
      } else if (action === "classify") {
        await ticketsApi.classify(ticket.id, { state: classifyTarget });
      }
      if (formData.internal_notes !== (ticket.internal_notes ?? "")) {
        await dispatch(
          updateTicket({
            id: ticket.id,
            data: {
              contact_id: ticket.contact.id,
              description: ticket.description,
              internal_notes: formData.internal_notes,
            },
          })
        ).unwrap();
      }
      await dispatch(fetchTickets({ page: 1, page_size: 10 }));
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err && typeof err === "object" && "message" in err
          ? String((err as { message: string }).message)
          : "Acción de workflow fallida";
      setErrors({ form: message });
    } finally {
      setIsLoading(false);
    }
  };

  const isLegacy = [
    "new",
    "open",
    "in_progress",
    "waiting_parts",
    "resolved",
  ].includes(currentState);

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
            <RenderText title="Empresa" value={ticket.contact.company_name} />
            <RenderText title="Teléfono" value={ticket.contact.phone} />
            <RenderText
              title="Estado"
              value={convertStateTicket(currentState)}
            />
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
                value={formData.assigned_user || "none"}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    assigned_user: value === "none" ? null : value,
                  }))
                }
                disabled={!canRunTicketActions}
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

            {canRunTicketActions && (
              <div className="space-y-2 sm:col-span-2 flex flex-wrap gap-2">
                {currentState === "received" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isLoading}
                    onClick={() => runWorkflow("diagnose")}
                  >
                    Diagnosticar
                  </Button>
                )}
                {currentState === "diagnosed" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isLoading}
                    onClick={() => runWorkflow("quote")}
                  >
                    Presupuestar
                  </Button>
                )}
                {currentState !== "closed" &&
                  ["received", "diagnosed", "quoted"].includes(currentState) && (
                    <Button
                      type="button"
                      variant={closed ? "default" : "outline"}
                      disabled={isLoading}
                      onClick={() => setIsClosed((v) => !v)}
                    >
                      {closed ? "Cierre marcado — guardar" : "Marcar cierre"}
                    </Button>
                  )}
                {isAdmin && currentState === "closed" && (
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={isLoading}
                    onClick={() => runWorkflow("reopen")}
                  >
                    Reabrir
                  </Button>
                )}
                {isAdmin && isLegacy && (
                  <div className="flex flex-wrap items-center gap-2 w-full">
                    <Select
                      value={classifyTarget}
                      onValueChange={(value) =>
                        setClassifyTarget(
                          value as
                            | "received"
                            | "diagnosed"
                            | "quoted"
                            | "closed"
                        )
                      }
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-[220px]">
                        <SelectValue placeholder="Estado destino" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="received">Recibido</SelectItem>
                        <SelectItem value="diagnosed">Diagnosticado</SelectItem>
                        <SelectItem value="quoted">Presupuestado</SelectItem>
                        <SelectItem value="closed">Cerrado</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      type="button"
                      variant="secondary"
                      disabled={isLoading}
                      onClick={() => runWorkflow("classify")}
                    >
                      Clasificar
                    </Button>
                  </div>
                )}
              </div>
            )}

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
                disabled={!canRunTicketActions}
              />
              <p className="text-xs text-muted-foreground">
                Visibles para el cliente en el portal / correos de estado.
              </p>
            </div>

            {canRunTicketActions && (
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="internal_notes">Notas internas</Label>
                <textarea
                  id="internal_notes"
                  name="internal_notes"
                  rows={3}
                  value={formData.internal_notes || ""}
                  onChange={handleChange}
                  className="flex w-full rounded-md border border-amber-600/40 bg-amber-50/40 px-3 py-2 text-sm"
                />
                <p className="text-xs text-muted-foreground">
                  Solo backoffice (admin / servicio técnico). No se envían al
                  cliente.
                </p>
              </div>
            )}

            {errors.form && (
              <p className="text-sm text-destructive sm:col-span-2">
                {errors.form}
              </p>
            )}
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
                  : "Sin permiso para modificar el ticket"
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
