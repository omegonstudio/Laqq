"use client";

import React, { useEffect } from "react";

import { useState } from "react";
import {
  Copy,
  Check,
  Building2,
  User,
  Mail,
  Phone,
  Globe,
  MessageSquare,
  Calendar,
  Tag,
  UserCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Contact, UserData } from "@/types/api";
import { convertStateContact, stateEnum } from "@/utils/quotesConvert";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { RootState } from "@/store";
import { fetchUser, fetchUsers } from "@/store/usersSlice";
import { formatDate } from "@/utils/formatDate";

interface ViewContactModalProps {
  contact: Contact | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  users: UserData[];
}

interface CopyableFieldProps {
  label: string;
  value: string | null;
  icon: React.ReactNode;
}

function CopyableField({ label, value, icon }: CopyableFieldProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!value) return;

    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Error al copiar:", err);
    }
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-border last:border-b-0">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="text-muted-foreground shrink-0">{icon}</div>
        <div className="min-w-0 flex-1">
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-medium truncate">
            {value || (
              <span className="text-muted-foreground italic">
                No especificado
              </span>
            )}
          </p>
        </div>
      </div>
      {value && (
        <Button
          variant="ghost"
          onClick={handleCopy}
          className="shrink-0 ml-2"
          title={`Copiar ${label.toLowerCase()}`}
        >
          {copied ? (
            <Check className="size-4 text-green-500" />
          ) : (
            <Copy className="size-4" />
          )}
        </Button>
      )}
    </div>
  );
}

export function ViewContactModal({
  contact,
  open,
  onOpenChange,
}: ViewContactModalProps) {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchUsers({ page: 1, page_size: 1000 }));
  }, [dispatch]);
  const { list: users } = useAppSelector((state: RootState) => state.users);
  if (!contact) return null;

  const getUserName = () => {
    const filter = users.filter((user) => user.id === contact.assigned_user);
    return filter.length > 0
      ? `${filter[0].first_name} ${filter[0].last_name}`
      : null;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="size-5" />
            {contact.company_name}
          </DialogTitle>
          <DialogDescription>
            Información detallada del contacto
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-1">
          <CopyableField
            label="Empresa"
            value={contact.company_name}
            icon={<Building2 className="size-4" />}
          />
          <CopyableField
            label="Nombre y apellido"
            value={`${contact.first_name} ${contact.last_name}`}
            icon={<User className="size-4" />}
          />
          {/* <CopyableField
            label="Apellido"
            value={contact.last_name}
            icon={<User className="size-4" />}
          /> */}
          <CopyableField
            label="Email"
            value={contact.email}
            icon={<Mail className="size-4" />}
          />
          <CopyableField
            label="Teléfono"
            value={contact.phone}
            icon={<Phone className="size-4" />}
          />
          <CopyableField
            label="País"
            value={contact.country}
            icon={<Globe className="size-4" />}
          />

          {contact.message && (
            <div className="py-3 border-b border-border">
              <div className="flex items-start gap-3">
                <div className="text-muted-foreground shrink-0 mt-0.5">
                  <MessageSquare className="size-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-muted-foreground">Mensaje</p>
                  <p className="text-sm whitespace-pre-wrap">
                    {contact.message}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground shrink-0">
                <Tag className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Estado</p>
                <p className="text-sm font-medium">
                  {convertStateContact(contact.state as stateEnum)}
                </p>
              </div>
            </div>
          </div>

          <div className="py-3 border-b border-border">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground shrink-0">
                <UserCircle className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Usuario asignado
                </p>
                <p className="text-sm font-medium">
                  {contact.assigned_user ? (
                    getUserName ? (
                      getUserName()
                    ) : (
                      contact.assigned_user
                    )
                  ) : (
                    <span className="text-muted-foreground italic">
                      Sin asignar
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="py-3">
            <div className="flex items-center gap-3">
              <div className="text-muted-foreground shrink-0">
                <Calendar className="size-4" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">
                  Fecha de creación
                </p>
                <p className="text-sm font-medium">
                  {formatDate(contact.created_at)}
                </p>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
