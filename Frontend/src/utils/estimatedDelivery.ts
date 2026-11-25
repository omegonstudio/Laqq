/**
 * T14: comparación de plazos de entrega por ítem.
 * Normalización: 1 semana = 7 días; 1 mes = 4 semanas = 28 días.
 *
 * Solo interpreta textos con cantidad + unidad (día/semana/mes).
 * Si algún valor no vacío no se puede interpretar, no se calcula máximo
 * (evita mostrar un plazo incorrecto).
 */

type ParsedDelivery = {
  days: number;
  label: string;
};

const UNIT_TO_DAYS: Record<string, number> = {
  dia: 1,
  dias: 1,
  semana: 7,
  semanas: 7,
  mes: 28,
  meses: 28,
};

const normalize = (raw: string) =>
  raw
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "");

/**
 * Acepta solo la entrada completa, p.ej.:
 * "2 días", "2 semanas", "1 mes", "15-20 días", "15-20 días hábiles", "2 semanas corridos".
 * Rechaza compuestos o residuales: "2 semanas o 1 mes", "aprox 2 semanas", etc.
 */
export const parseEstimatedDelivery = (
  raw: string
): ParsedDelivery | null => {
  const label = raw.trim();
  if (!label) return null;

  const text = normalize(label);
  const match = text.match(
    /^(\d+)\s*(?:[-–]\s*(\d+)\s*)?(dias?|semanas?|meses|mes)(?:\s+(habiles|corridos))?$/
  );
  if (!match) return null;

  const first = Number(match[1]);
  const second = match[2] ? Number(match[2]) : first;
  if (!Number.isFinite(first) || !Number.isFinite(second)) return null;

  const unitKey = match[3];
  const unitDays = UNIT_TO_DAYS[unitKey];
  if (!unitDays) return null;

  const quantity = Math.max(first, second);
  return { days: quantity * unitDays, label };
};

/**
 * Devuelve el texto original del plazo con mayor demora normalizada,
 * o null si no hay plazos / hay valores no interpretables.
 */
export const getMaxEstimatedDeliveryLabel = (
  values: Array<string | null | undefined>
): string | null => {
  const parsed: ParsedDelivery[] = [];

  for (const value of values) {
    const trimmed = (value ?? "").trim();
    if (!trimmed) continue;

    const result = parseEstimatedDelivery(trimmed);
    if (!result) {
      // Valor libre no comparable → no inventar un máximo.
      return null;
    }
    parsed.push(result);
  }

  if (parsed.length === 0) return null;

  let max = parsed[0];
  for (let i = 1; i < parsed.length; i += 1) {
    if (parsed[i].days > max.days) {
      max = parsed[i];
    }
  }
  return max.label;
};
