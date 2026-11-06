import { describe, expect, it } from "vitest";
import {
  getMaxEstimatedDeliveryLabel,
  parseEstimatedDelivery,
} from "../estimatedDelivery";

describe("parseEstimatedDelivery", () => {
  it("acepta plazos simples con días, semanas y meses", () => {
    expect(parseEstimatedDelivery("2 semanas")?.days).toBe(14);
    expect(parseEstimatedDelivery("2 días")?.days).toBe(2);
    expect(parseEstimatedDelivery("1 mes")?.days).toBe(28);
  });

  it("acepta sufijos hábiles y corridos", () => {
    expect(parseEstimatedDelivery("2 semanas hábiles")?.days).toBe(14);
    expect(parseEstimatedDelivery("15-20 días hábiles")?.days).toBe(20);
    expect(parseEstimatedDelivery("10 días corridos")?.days).toBe(10);
  });

  it("acepta rangos y usa el valor mayor", () => {
    expect(parseEstimatedDelivery("15-20 días")?.days).toBe(20);
    expect(parseEstimatedDelivery("15–20 días")?.days).toBe(20);
  });

  it("rechaza textos compuestos o con residual no reconocido", () => {
    expect(parseEstimatedDelivery("2 semanas o 1 mes")).toBeNull();
    expect(parseEstimatedDelivery("aprox 2 semanas")).toBeNull();
    expect(parseEstimatedDelivery("2 semanas aproximadamente")).toBeNull();
    expect(parseEstimatedDelivery("1 mes y medio")).toBeNull();
  });
});

describe("getMaxEstimatedDeliveryLabel", () => {
  it("devuelve el texto del plazo máximo cuando todos son interpretables", () => {
    expect(
      getMaxEstimatedDeliveryLabel(["2 semanas", "2 días", "1 mes"])
    ).toBe("1 mes");
  });

  it("no muestra plazo general si hay algún valor no interpretable", () => {
    expect(
      getMaxEstimatedDeliveryLabel(["1 mes", "2 semanas o 1 mes"])
    ).toBeNull();
    expect(
      getMaxEstimatedDeliveryLabel(["2 semanas aproximadamente"])
    ).toBeNull();
  });

  it("ignora vacíos y no genera label si no hay plazos", () => {
    expect(getMaxEstimatedDeliveryLabel(["", "  ", null, undefined])).toBeNull();
    expect(getMaxEstimatedDeliveryLabel(["", "3 días"])).toBe("3 días");
  });
});
