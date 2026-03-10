import { QuoteStateType, QuoteTypeEnum } from "@/types/api";

export const convertQuotesState = (state: QuoteStateType): string => {
  switch (state.toLowerCase()) {
    case "confirmed":
      return "Confirmada";
    case "expired":
      return "Expirada";
    case "pending":
      return "Pendiente";
    case "rejected":
      return "Rechazada";
    case "sent":
      return "Enviada";
    default:
      return "Desconocido";
  }
};

export const convertQuotesTypes = (type: QuoteTypeEnum): string => {
  switch (type.toLowerCase()) {
    case "equipment":
      return "Equipo";
    case "furniture":
      return "Mobiliario";
    case "processed":
      return "Procesados";
    case "supplies":
      return "Suministros";
    case "standard":
      return "Estándar";
    case "express":
      return "Exprés";
    default:
      return "Desconocido";
  }
};
// Primero, agrega estas funciones inversas (puedes ponerlas en el mismo archivo de utilidades)
export const revertQuotesState = (state: string): QuoteStateType => {
  switch (state) {
    case "Confirmada":
      return "confirmed";
    case "Expirada":
      return "expired";
    case "Pendiente":
      return "pending";
    case "Rechazada":
      return "rejected";
    case "Enviada":
      return "sent";
    default:
      return "pending";
  }
};

export const revertQuotesTypes = (type: string): QuoteTypeEnum => {
  switch (type) {
    case "Equipo":
      return "equipment";
    case "Mobiliario":
      return "furniture";
    case "Procesados":
      return "processed";
    case "Suministros":
      return "supplies";
    default:
      return "supplies";
  }
};
export type stateEnum = "closed" | "in_progress" | "new" | "responded";

export const convertStateContact = (state: stateEnum): string => {
  switch (state) {
    case "closed":
      return "cerrado";
    case "in_progress":
      return "En progreso";
    case "new":
      return "Nuevo";
    case "responded":
      return "Respondido";
    default:
      return "Desconocido";
  }
};

export const convertStateTicket = (
  state:
    | "open"
    | "closed"
    | "in_progress"
    | "resolved"
    | "waiting_parts"
    | "new"
): string => {
  switch (state) {
    case "open":
      return "Abierto";
    case "closed":
      return "Cerrado";
    case "in_progress":
      return "En progreso";
    case "resolved":
      return "Resuelto";
    case "waiting_parts":
      return "Piezas en espera";
    case "new":
      return "Nuevo";
    default:
      return "Desconocido";
  }
};

export const convertPrioritiesTicket = (
  state: "urgent" | "high" | "medium" | "low"
): string => {
  switch (state) {
    case "urgent":
      return "Urgente";
    case "high":
      return "Alta";
    case "medium":
      return "Media";
    case "low":
      return "baja";
    default:
      return "Desconocido";
  }
};
