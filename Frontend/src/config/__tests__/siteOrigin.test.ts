import { describe, expect, it } from "vitest";
import {
  DEFAULT_SITE_ORIGIN,
  buildRobotsTxt,
  buildSitemapXml,
  normalizeSiteOrigin,
} from "@/config/siteOrigin";
import { absoluteUrl, seoForPath } from "@/config/seo";

describe("normalizeSiteOrigin", () => {
  it("usa fallback PROD si viene vacío o undefined", () => {
    expect(normalizeSiteOrigin(undefined)).toBe(DEFAULT_SITE_ORIGIN);
    expect(normalizeSiteOrigin(null)).toBe(DEFAULT_SITE_ORIGIN);
    expect(normalizeSiteOrigin("")).toBe(DEFAULT_SITE_ORIGIN);
    expect(normalizeSiteOrigin("   ")).toBe(DEFAULT_SITE_ORIGIN);
  });

  it("elimina trailing slash", () => {
    expect(normalizeSiteOrigin("https://laqq.com.ar/")).toBe(
      "https://laqq.com.ar"
    );
    expect(normalizeSiteOrigin("http://laqq.omegon.com.ar///")).toBe(
      "http://laqq.omegon.com.ar"
    );
  });

  it("acepta DEV y PROD", () => {
    expect(normalizeSiteOrigin("http://laqq.omegon.com.ar")).toBe(
      "http://laqq.omegon.com.ar"
    );
    expect(normalizeSiteOrigin("https://laqq.com.ar")).toBe(
      "https://laqq.com.ar"
    );
  });
});

describe("buildRobotsTxt / buildSitemapXml", () => {
  it("robots DEV apunta al sitemap del mismo origin", () => {
    const txt = buildRobotsTxt("http://laqq.omegon.com.ar");
    expect(txt).toContain("Sitemap: http://laqq.omegon.com.ar/sitemap.xml");
    expect(txt).not.toContain("https://laqq.com.ar");
  });

  it("sitemap PROD conserva hosts históricos", () => {
    const xml = buildSitemapXml("https://laqq.com.ar");
    expect(xml).toContain("<loc>https://laqq.com.ar/</loc>");
    expect(xml).toContain("<loc>https://laqq.com.ar/products</loc>");
    expect(xml).not.toContain("http://https://");
    expect(xml).not.toContain("laqq.omegon");
  });

  it("sitemap DEV no mezcla PROD", () => {
    const xml = buildSitemapXml("http://laqq.omegon.com.ar/");
    expect(xml).toContain("<loc>http://laqq.omegon.com.ar/</loc>");
    expect(xml).not.toContain("https://laqq.com.ar");
  });
});

describe("absoluteUrl / seoForPath (SITE_ORIGIN del build)", () => {
  it("absoluteUrl no duplica protocolo ni slash", () => {
    const url = absoluteUrl("/products");
    expect(url).toMatch(/^https?:\/\//);
    expect(url).not.toMatch(/http:\/\/https:/);
    expect(url.endsWith("/products")).toBe(true);
  });

  it("seoForPath home tiene canonical con origin", () => {
    const { canonical } = seoForPath("/");
    expect(canonical).toMatch(/^https?:\/\//);
    expect(canonical.endsWith("/") || canonical.includes("laqq")).toBe(true);
  });
});
