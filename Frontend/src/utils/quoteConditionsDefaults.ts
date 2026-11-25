import { QuoteLifecycle, SpecificationsForm } from "@/types/api";

/** Textos predeterminados Tito (literales; no resumir ni corregir). */
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

const CONDITION_KEYS = [
  "precios",
  "forma_pago",
  "clausula_pago",
  "validez_oferta",
  "orden_compra",
  "garantia",
] as const;

type SpecsLike = Partial<SpecificationsForm> & Record<string, unknown>;

function readField(raw: SpecsLike | null | undefined, key: string): string {
  const value = raw?.[key];
  return typeof value === "string" ? value : "";
}

/** Cotización nueva = recibida (aún no gestionada). */
export function isReceivedQuote(
  lifecycle?: QuoteLifecycle | null,
  managedAt?: string | null
): boolean {
  if (lifecycle === "managed") return false;
  if (lifecycle === "received") return true;
  return managedAt == null;
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
 * - received: aplica los 6 defaults Tito (sin tocar observaciones).
 * - managed: conserva valores tal cual; no rellena vacíos.
 */
export function resolveQuoteSpecsForPreview(
  raw: SpecsLike | null | undefined,
  lifecycle?: QuoteLifecycle | null,
  managedAt?: string | null
): SpecificationsForm {
  const base = normalizeSpecs(raw);

  if (!isReceivedQuote(lifecycle, managedAt)) {
    return base;
  }

  return {
    ...base,
    ...Object.fromEntries(
      CONDITION_KEYS.map((key) => [key, QUOTE_CONDITION_DEFAULTS[key]])
    ),
  } as SpecificationsForm;
}
