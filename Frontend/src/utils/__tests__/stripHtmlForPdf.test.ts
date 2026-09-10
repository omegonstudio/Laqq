import { describe, expect, it } from "vitest";
import { stripHtmlForPdf } from "../useQuotePDF";

describe("stripHtmlForPdf", () => {
  it("preserva párrafos como saltos de línea", () => {
    expect(stripHtmlForPdf("<p>Primero.</p><p>Segundo.</p>")).toBe(
      "Primero.\n\nSegundo."
    );
  });

  it("convierte listas a viñetas", () => {
    expect(stripHtmlForPdf("<ul><li>Uno</li><li>Dos</li></ul>")).toBe(
      "• Uno\n• Dos"
    );
  });

  it("omite tablas HTML", () => {
    expect(
      stripHtmlForPdf(
        "<p>Intro</p><table><tr><td>A</td><td>B</td></tr></table><p>Cierre</p>"
      )
    ).toBe("Intro\n\nCierre");
  });

  it("decodifica entidades básicas", () => {
    expect(stripHtmlForPdf("<p>A &amp; B&nbsp;C</p>")).toBe("A & B C");
  });

  it("parte viñetas escritas dentro del mismo párrafo", () => {
    expect(
      stripHtmlForPdf(
        "<p>Introducción al equipo. • Función: mide X. • Sectores: lab.</p>"
      )
    ).toBe("Introducción al equipo.\n• Función: mide X.\n• Sectores: lab.");
  });

  it("parte títulos tipo Etiqueta: tras un punto", () => {
    const out = stripHtmlForPdf(
      "<p>Texto previo. Principio de Funcionamiento: SMLS es óptico.</p>"
    );
    expect(out).toContain("Texto previo.");
    expect(out).toContain("\n\nPrincipio de Funcionamiento:");
  });
});
