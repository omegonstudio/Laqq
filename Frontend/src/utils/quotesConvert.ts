import { QuoteCurrency, QuoteStateType, QuoteTypeEnum } from "@/types/api";

export const QUOTE_CURRENCIES: { value: QuoteCurrency; label: string }[] = [
  { value: "ARS", label: "Pesos" },
  { value: "USD", label: "Dólares" },
  { value: "EUR", label: "Euros" },
];

export const currencySymbol = (
  currency?: QuoteCurrency | string | null
): string => {
  switch (currency) {
    case "USD":
      return "US$";
    case "EUR":
      return "€";
    default:
      return "$";
  }
};

export const convertQuoteCurrency = (
  currency?: QuoteCurrency | string | null
): string => {
  return (
    QUOTE_CURRENCIES.find((item) => item.value === currency)?.label ?? "Pesos"
  );
};

export const formatQuoteAmount = (
  value: string | number | null | undefined,
  currency?: QuoteCurrency | string | null
): string => {
  const symbol = currencySymbol(currency);
  if (value === null || value === undefined || value === "") {
    return `${symbol}0,00`;
  }
  const amount = Number(value);
  if (Number.isNaN(amount)) {
    return `${symbol}0,00`;
  }
  return `${symbol}${amount.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const convertQuotesState = (state: QuoteStateType): string => {
  switch (state.toLowerCase()) {
    case "confirmed":
      return "Confirmada";
    case "expired":
      return "Expirada";
    case "pending":
      return "Pendiente";
    case "assigned":
      return "Asignada";
    case "rejected":
      return "Rechazada";
    case "sent":
      return "Enviada";
    default:
      return "Desconocido";
  }
};

/** Transiciones de estado permitidas (alineado con Backend/quotes/tracing.py). */
export const QUOTE_STATE_TRANSITIONS: Record<string, string[]> = {
  pending: ["assigned", "sent", "rejected", "expired"],
  assigned: ["sent", "rejected", "expired", "pending"],
  sent: ["confirmed", "rejected", "expired", "assigned"],
  confirmed: ["rejected", "expired"],
  rejected: [],
  expired: [],
};

export const allowedNextQuoteStates = (current: string): string[] => {
  const key = (current || "").toLowerCase();
  const next = QUOTE_STATE_TRANSITIONS[key] ?? [];
  return [key, ...next.filter((s) => s !== key)];
};

export const convertQuoteTraceReason = (reason: string): string => {
  switch (reason) {
    case "created":
      return "Alta (pedido web)";
    case "updated":
      return "Edición";
    case "assignee_changed":
      return "Cambio de responsable";
    case "state_changed":
      return "Cambio de estado";
    case "sent":
      return "Enviada al cliente";
    case "backfill":
      return "Histórico (sin detalle)";
    default:
      return reason;
  }
};

export const convertQuoteVersionReason = (reason: string): string => {
  switch (reason) {
    case "saved":
      return "Guardada";
    case "sent":
      return "Enviada al cliente";
    case "state_changed":
      return "Cambio de estado";
    case "assignee_changed":
      return "Cambio de responsable";
    default:
      return reason;
  }
};

/** Eventos que aportan info al usuario (ocultamos "updated"/ediciones genéricas). */
export const QUOTE_TRACE_VISIBLE_REASONS = new Set([
  "created",
  "assignee_changed",
  "state_changed",
  "sent",
  "backfill",
]);

export const convertQuotesTypes = (type: QuoteTypeEnum): string => {
  switch (type.toLowerCase()) {
    case "equipment":
      return "Equipo";
    case "furniture":
      return "Mobiliario";
    case "processed":
      return "Procesados";
    case "supplies":
      return "Consumibles";
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
    case "Asignada":
      return "assigned";
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
