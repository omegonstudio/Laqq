import { describe, expect, it } from "vitest";
import { absoluteUrl, seoForPath } from "@/config/seo";

describe("seoForPath marcas", () => {
  it("indexa /marcas/:slug con title y canonical", () => {
    const seo = seoForPath("/marcas/julabo");
    expect(seo.robots).toBe("index, follow");
    expect(seo.title.toLowerCase()).toContain("julabo");
    expect(seo.canonical).toBe(absoluteUrl("/marcas/julabo"));
  });

  it("rutas privadas quedan noindex", () => {
    const seo = seoForPath("/backoffice/brands");
    expect(seo.robots).toContain("noindex");
  });
});
