import { Product } from "@/types/types";

interface UnifiedSpec {
  specification: string;
  value: string;
  order: number;
}

// Mapeo de campos fixed_specs a nombres legibles
const FIXED_SPEC_LABELS: Record<string, string> = {
  code: "Código",
  volume: "Volumen",
  dimensions: "Dimensiones",
  cap: "Tapa",
  outlet: "Salida",
  accuracy: "Exactitud",
  precision: "Precisión",
};

// Orden de prioridad para las fixed_specs
const FIXED_SPEC_ORDER: Record<string, number> = {
  code: 1,
  volume: 2,
  dimensions: 3,
  cap: 4,
  outlet: 5,
  accuracy: 6,
  precision: 7,
};

/**
 * Unifica las especificaciones fijas y dinámicas en un solo array
 */
export const unifyProductSpecs = (product: Product): UnifiedSpec[] => {
  if (!product) return [];
  console.log(product, "AA");
  const unified: UnifiedSpec[] = [];

  // 1. Procesar fixed_specs (puede no existir o estar vacío)
  const fixedSpecs = product.fixed_specs;
  if (fixedSpecs && Array.isArray(fixedSpecs) && fixedSpecs.length > 0) {
    fixedSpecs.forEach((fixedSpec) => {
      if (!fixedSpec) return;

      Object.entries(fixedSpec).forEach(([key, value]) => {
        // Ignorar campos que no son especificaciones
        if (
          key === "id" ||
          key === "product" ||
          key === "created_at" ||
          key === "additional_specs" ||
          !value
        ) {
          return;
        }

        // Solo agregar si tiene un label definido y un valor
        if (FIXED_SPEC_LABELS[key]) {
          unified.push({
            specification: FIXED_SPEC_LABELS[key],
            value: String(value),
            order: FIXED_SPEC_ORDER[key] || 999,
          });
        }
      });

      // Procesar additional_specs si existe
      if (fixedSpec.additional_specs) {
        try {
          const additional =
            typeof fixedSpec.additional_specs === "string"
              ? JSON.parse(fixedSpec.additional_specs)
              : fixedSpec.additional_specs;

          if (additional && typeof additional === "object") {
            Object.entries(additional).forEach(([key, value]) => {
              if (value) {
                unified.push({
                  specification: key,
                  value: String(value),
                  order: 900, // Al final de las fixed pero antes de las dinámicas
                });
              }
            });
          }
        } catch (e) {
          console.error("Error parsing additional_specs:", e);
        }
      }
    });
  }
  // 2. Procesar specs dinámicas
  const dynamicSpecs = product.specs || product.specifications;
  if (dynamicSpecs && Array.isArray(dynamicSpecs) && dynamicSpecs.length > 0) {
    console.log(dynamicSpecs);
    dynamicSpecs.forEach((spec) => {
      if (!spec || !spec.key || !spec.value || spec.is_visible === false) {
        return;
      }

      let formattedValue = spec.value;
      if (spec.unit && spec.unit.trim()) {
        formattedValue = `${spec.value} (${spec.unit})`;
      }

      unified.push({
        specification: spec.key,
        value: formattedValue,
        order: spec.display_order || 1000,
      });
    });
  }

  // 3. Ordenar por el campo order
  return unified.sort((a, b) => a.order - b.order);
};
