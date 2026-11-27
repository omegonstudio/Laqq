import { QuoteLifecycle, SpecificationsForm } from "@/types/api";

/**
 * Se usan solo como opciones de los dropdowns; no se precargan al crear.
 */
export const QUOTE_CONDITION_DEFAULTS = {
  precios: "Precio neto + IVA",
  forma_pago: "Contado",
  clausula_pago:
    "Para la conversión de las monedas extranjeras a fin de efectivizar el pago, se utilizará el tipo de cambio “vendedor-transferencia” o el que lo reemplace, del Banco de la Nación Argentina vigente al cierre del día anterior al de la fecha de efectivo pago.",
  validez_oferta: "30 días",
  orden_compra: "A nombre de LA QUIMICA QUIRURGICA S.A.C.I. (PLAZA)",
  garantia:
    "Los equipos cotizados están cubiertos por una garantía de 1 año. Esta garantía cubre las partes defectuosas y la mano de obra relacionada con la reparación. No cubre los gastos de traslado y estadía del Personal Técnico que se incurran, fuera del área metropolitana, los cuales estarán a cargo del Cliente.\n\nIMPORTANTE - Posibles causales de pérdida de la Garantía\n\n• Por operación del instrumento fuera de especificaciones.\n• Si el equipo es intentado reparar o reparado por personal no autorizado por La Química Quirúrgica SACI.\n• Por cualquier fenómeno externo y fuera del control de La Química Quirúrgica que pudiere dejar inoperante al equipo (por ej: golpe de tensión, incendio, derrumbe de mampostería, gotera, etc).",
} as const;

/** Opciones de selector: value = texto completo a persistir en Quote.specs. */
export const PRECIOS_OPTIONS = [
  {
    value: QUOTE_CONDITION_DEFAULTS.precios,
    label: QUOTE_CONDITION_DEFAULTS.precios,
  },
  { value: "IVA incluido", label: "IVA incluido" },
];

export const FORMA_PAGO_OPTIONS = [
  {
    value: QUOTE_CONDITION_DEFAULTS.forma_pago,
    label: QUOTE_CONDITION_DEFAULTS.forma_pago,
  },
  { value: "30 días", label: "30 días" },
];

export const CLAUSULA_PAGO_OPTIONS = [
  {
    value: QUOTE_CONDITION_DEFAULTS.clausula_pago,
    label: QUOTE_CONDITION_DEFAULTS.clausula_pago,
  },
];

export const VALIDEZ_OFERTA_OPTIONS = [
  {
    value: QUOTE_CONDITION_DEFAULTS.validez_oferta,
    label: QUOTE_CONDITION_DEFAULTS.validez_oferta,
  },
];

export const ORDEN_COMPRA_OPTIONS = [
  {
    value: QUOTE_CONDITION_DEFAULTS.orden_compra,
    label: QUOTE_CONDITION_DEFAULTS.orden_compra,
  },
];

export const GARANTIA_OPTIONS = [
  {
    value: QUOTE_CONDITION_DEFAULTS.garantia,
    label: QUOTE_CONDITION_DEFAULTS.garantia,
  },
];

type SpecsLike = Partial<SpecificationsForm> & Record<string, unknown>;

function readField(raw: SpecsLike | null | undefined, key: string): string {
  const value = raw?.[key];
  return typeof value === "string" ? value : "";
}

function normalizeSpecs(
  raw: SpecsLike | null | undefined
): SpecificationsForm {
  return {
    precios: readField(raw, "precios"),
    forma_pago: readField(raw, "forma_pago"),
    clausula_pago: readField(raw, "clausula_pago"),
    validez_oferta: readField(raw, "validez_oferta"),
    garantia: readField(raw, "garantia"),
    orden_compra: readField(raw, "orden_compra"),
    observaciones: readField(raw, "observaciones"),
  };
}

/**
 * Resuelve specs para QuotePreview.
 * Conserva los valores persistidos tal cual; campos ausentes quedan vacíos
 * (sin precargar condiciones preestablecidas).
 * lifecycle/managedAt se mantienen por compatibilidad de firma.
 */
export function resolveQuoteSpecsForPreview(
  raw: SpecsLike | null | undefined,
  _lifecycle?: QuoteLifecycle | null,
  _managedAt?: string | null
): SpecificationsForm {
  return normalizeSpecs(raw);
}
