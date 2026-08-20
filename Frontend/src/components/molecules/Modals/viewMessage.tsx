"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Building2, User, Globe, Calendar, MessageSquare, Mail, Phone } from "lucide-react";
import { Message } from "@/types/api";

interface MessageDetailModalProps {
  message: Message | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MessageDetailModal({
  message,
  open,
  onOpenChange,
}: MessageDetailModalProps) {
  if (!message) return null;

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const fullName = [message.first_name, message.last_name]
    .filter(Boolean)
    .join(" ");

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between gap-4 pr-6">
            <DialogTitle className="text-xl">Detalles del Mensaje</DialogTitle>
            <Badge
              variant={message.state === "Nuevo" ? "default" : "secondary"}
            >
              {message.state}
            </Badge>
          </div>
          <DialogDescription>
            Información completa del mensaje recibido
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Company */}
          {message.company_name && (
            <div className="flex items-start gap-3">
              <Building2 className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Empresa
                </p>
                <p className="text-foreground">{message.company_name}</p>
              </div>
            </div>
          )}

          {/* Full Name */}
          {fullName && (
            <div className="flex items-start gap-3">
              <User className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Nombre completo
                </p>
                <p className="text-foreground">{fullName}</p>
              </div>
            </div>
          )}

          {/* Email */}
          <div className="flex items-start gap-3">
            <Mail className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Email
              </p>
              <p className="text-foreground">{message.email}</p>
            </div>
          </div>

          {/* Phone */}
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-5 text-muted-foreground" />
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Teléfono
              </p>
              <p className="text-foreground">{message.phone}</p>
            </div>
          </div>

          {/* Country */}
          {message.country && (
            <div className="flex items-start gap-3">
              <Globe className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  País
                </p>
                <p className="text-foreground">{message.country}</p>
              </div>
            </div>
          )}

          {/* Message */}
          <div className="flex items-start gap-3">
            <MessageSquare className="mt-0.5 size-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Mensaje
              </p>
              <p className="whitespace-pre-wrap text-foreground">
                {message.message}
              </p>
            </div>
          </div>

          {/* Assigned User */}
          {message.assigned_user && (
            <div className="flex items-start gap-3">
              <User className="mt-0.5 size-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Usuario asignado
                </p>
                <p className="text-foreground">{message.assigned_user}</p>
              </div>
            </div>
          )}

          {/* Dates */}
          <div className="flex items-start gap-3">
            <Calendar className="mt-0.5 size-5 text-muted-foreground" />
            <div className="flex-1">
              <p className="text-sm font-medium text-muted-foreground">
                Fechas
              </p>
              <div className="grid gap-1 text-sm">
                <p className="text-foreground">
                  <span className="text-muted-foreground">Creado: </span>
                  {formatDate(message.created_at)}
                </p>
                <p className="text-foreground">
                  <span className="text-muted-foreground">Actualizado: </span>
                  {formatDate(message.updated_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
