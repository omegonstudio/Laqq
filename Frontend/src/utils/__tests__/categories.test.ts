import { describe, expect, test } from "vitest";
import {
  buildCatalogCrumbs,
  categoryListingHref,
  getCategoryAncestry,
  isCategoryUnderConsumibles,
  isCategoryUnderReactivosQuimicos,
} from "@/utils/data/categories";

const categories = [
  { id: "root", name: "Consumibles", parent: null },
  { id: "mid", name: "Reactivos Químicos", parent: "root" },
  { id: "leaf", name: "Ácidos", parent: "mid" },
  { id: "other", name: "Vidrio", parent: "root" },
  { id: "furn", name: "Mobiliario", parent: null },
];

describe("getCategoryAncestry", () => {
  test("devuelve raíz → hoja", () => {
    expect(getCategoryAncestry("leaf", categories).map((c) => c.id)).toEqual([
      "root",
      "mid",
      "leaf",
    ]);
  });

  test("categoría raíz es un solo eslabón", () => {
    expect(getCategoryAncestry("root", categories).map((c) => c.id)).toEqual([
      "root",
    ]);
  });

  test("id desconocido o vacío da lista vacía", () => {
    expect(getCategoryAncestry("nope", categories)).toEqual([]);
    expect(getCategoryAncestry(null, categories)).toEqual([]);
  });

  test("corta ciclos", () => {
    const cyclic = [
      { id: "a", name: "A", parent: "b" },
      { id: "b", name: "B", parent: "a" },
    ];
    expect(getCategoryAncestry("a", cyclic).map((c) => c.id)).toEqual([
      "b",
      "a",
    ]);
  });
});

describe("isCategoryUnderConsumibles", () => {
  test("raíz y cualquier descendiente de Consumibles", () => {
    expect(isCategoryUnderConsumibles("root", categories)).toBe(true);
    expect(isCategoryUnderConsumibles("mid", categories)).toBe(true);
    expect(isCategoryUnderConsumibles("other", categories)).toBe(true);
    expect(isCategoryUnderConsumibles("furn", categories)).toBe(false);
  });
});

describe("isCategoryUnderReactivosQuimicos", () => {
  test("solo Reactivos Químicos y sus hojas bajo Consumibles", () => {
    expect(isCategoryUnderReactivosQuimicos("mid", categories)).toBe(true);
    expect(isCategoryUnderReactivosQuimicos("leaf", categories)).toBe(true);
  });

  test("Consumibles sola u otra subcategoría no aplica", () => {
    expect(isCategoryUnderReactivosQuimicos("root", categories)).toBe(false);
    expect(isCategoryUnderReactivosQuimicos("other", categories)).toBe(false);
    expect(isCategoryUnderReactivosQuimicos("furn", categories)).toBe(false);
  });

  test("es case-insensitive", () => {
    const mixed = [
      { id: "root", name: "consumibles", parent: null },
      { id: "mid", name: "reactivos químicos", parent: "root" },
    ];
    expect(isCategoryUnderReactivosQuimicos("mid", mixed)).toBe(true);
  });
});

describe("buildCatalogCrumbs", () => {
  test("catálogo sin filtro: Inicio → Catálogo (página actual)", () => {
    expect(buildCatalogCrumbs({ categories: [] })).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Catálogo" },
    ]);
  });

  test("listado filtrado: categorías clickeables, hoja actual", () => {
    expect(
      buildCatalogCrumbs({ categories, categoryId: "leaf" })
    ).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Catálogo", href: "/products" },
      { label: "Consumibles", href: "/products?category=root" },
      { label: "Reactivos Químicos", href: "/products?category=mid" },
      { label: "Ácidos" },
    ]);
  });

  test("ficha: categorías clickeables y producto como página actual", () => {
    expect(
      buildCatalogCrumbs({
        categories,
        categoryId: "leaf",
        productName: "Ácido clorhídrico",
      })
    ).toEqual([
      { label: "Inicio", href: "/" },
      { label: "Catálogo", href: "/products" },
      { label: "Consumibles", href: "/products?category=root" },
      { label: "Reactivos Químicos", href: "/products?category=mid" },
      { label: "Ácidos", href: "/products?category=leaf" },
      { label: "Ácido clorhídrico" },
    ]);
  });
});

describe("categoryListingHref", () => {
  test("Mobiliario va a /furniture", () => {
    expect(categoryListingHref({ id: "furn", name: "Mobiliario" })).toBe(
      "/furniture"
    );
  });
});
