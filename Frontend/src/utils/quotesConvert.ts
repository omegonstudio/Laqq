export const convertQuotesState = (
  state: "CONFIRMED" | "EXPIRED" | "PENDING" | "REJECTED" | "SENT"
): string => {
  switch (state) {
    case "CONFIRMED":
      return "Confirmada";
    case "EXPIRED":
      return "Expirada";
    case "PENDING":
      return "Pendiente";
    case "REJECTED":
      return "Rechazada";
    case "SENT":
      return "Enviada";
    default:
      return "Desconocido";
  }
};

export const convertQuotesTypes = (
  type: "EQUIPMENT" | "FURNITURE" | "PROCESSED" | "SUPPLIES"
): string => {
  switch (type) {
    case "EQUIPMENT":
      return "Equipo";
    case "FURNITURE":
      return "Mobiliario";
    case "PROCESSED":
      return "Procesados";
    case "SUPPLIES":
      return "Suministros";
    default:
      return "Desconocido";
  }
};
// Primero, agrega estas funciones inversas (puedes ponerlas en el mismo archivo de utilidades)
export const revertQuotesState = (
  state: string
): "CONFIRMED" | "EXPIRED" | "PENDING" | "REJECTED" | "SENT" => {
  switch (state) {
    case "Confirmada":
      return "CONFIRMED";
    case "Expirada":
      return "EXPIRED";
    case "Pendiente":
      return "PENDING";
    case "Rechazada":
      return "REJECTED";
    case "Enviada":
      return "SENT";
    default:
      return "PENDING";
  }
};

export const revertQuotesTypes = (
  type: string
): "EQUIPMENT" | "FURNITURE" | "PROCESSED" | "SUPPLIES" => {
  switch (type) {
    case "Equipo":
      return "EQUIPMENT";
    case "Mobiliario":
      return "FURNITURE";
    case "Procesados":
      return "PROCESSED";
    case "Suministros":
      return "SUPPLIES";
    default:
      return "SUPPLIES";
  }
};
export type stateEnum = "CLOSED" | "IN_PROGRESS" | "NEW" | "RESPONDED";

export const convertStateContact = (state: stateEnum): string => {
  switch (state) {
    case "CLOSED":
      return "cerrado";
    case "IN_PROGRESS":
      return "En progreso";
    case "NEW":
      return "Nuevo";
    case "RESPONDED":
      return "Respondido";
    default:
      return "Desconocido";
  }
};

export const convertStateTicket = (state: stateEnum | string): string => {
  switch (state.toUpperCase()) {
    case "CLOSED":
      return "Cerrado";
    case "IN_PROGRESS":
      return "En progreso";
    case "NEW":
      return "Nuevo";
    default:
      return "Desconocido";
  }
};
