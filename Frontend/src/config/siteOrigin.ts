/**
 * Origin del sitio y helpers SEO estáticos (Node + browser safe).
 * Sin import.meta.env — usable desde vite.config y desde seo.ts.
 */

export const DEFAULT_SITE_ORIGIN = "https://laqq.com.ar";

/**
 * Normaliza un origin absoluto: trim, sin slash final.
 * Vacío / undefined → DEFAULT_SITE_ORIGIN.
 */
export function normalizeSiteOrigin(raw: string | undefined | null): string {
  const value = (raw ?? "").trim();
  if (!value) {
    return DEFAULT_SITE_ORIGIN;
  }
  return value.replace(/\/+$/, "");
}

/** Contenido de robots.txt para un origin dado. */
export function buildRobotsTxt(origin: string): string {
  const base = normalizeSiteOrigin(origin);
  return `User-agent: *\nAllow: /\nSitemap: ${base}/sitemap.xml\n`;
}

export type SitemapRouteMeta = {
  path: string;
  changefreq: string;
  priority: string;
};

/** Rutas del sitemap estático histórico (mismas prioridades que public/sitemap.xml). */
export const SITEMAP_ROUTES: SitemapRouteMeta[] = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/products", changefreq: "daily", priority: "0.9" },
  { path: "/furniture", changefreq: "monthly", priority: "0.8" },
  { path: "/company", changefreq: "monthly", priority: "0.7" },
  { path: "/contact", changefreq: "monthly", priority: "0.7" },
  { path: "/quote", changefreq: "monthly", priority: "0.8" },
  { path: "/support", changefreq: "monthly", priority: "0.6" },
  { path: "/certificates", changefreq: "monthly", priority: "0.5" },
];

/** Contenido de sitemap.xml para un origin dado. */
export function buildSitemapXml(
  origin: string,
  routes: SitemapRouteMeta[] = SITEMAP_ROUTES
): string {
  const base = normalizeSiteOrigin(origin);
  const urls = routes
    .map((route) => {
      const loc = route.path === "/" ? `${base}/` : `${base}${route.path}`;
      return `  <url>
    <loc>${loc}</loc>
    <changefreq>${route.changefreq}</changefreq>
    <priority>${route.priority}</priority>
  </url>`;
    })
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>

<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;
}
