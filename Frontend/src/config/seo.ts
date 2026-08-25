/**
 * Configuración SEO canónica del sitio.
 * Usar siempre HTTPS en metadatos absolutos (listo para GO LIVE con TLS).
 */
export const SITE_ORIGIN = "https://laqq.com.ar";

export const SITE_NAME = "La Química Quirúrgica";

export const DEFAULT_TITLE =
  "La Química Quirúrgica - Equipo y Material de Laboratorio";

export const DEFAULT_DESCRIPTION =
  "Proveedor especializado en equipo de laboratorio, material de consumo y servicios técnicos para la industria científica.";

export const DEFAULT_OG_IMAGE = `${SITE_ORIGIN}/laqq_marca_color_neg.png`;

export const TWITTER_SITE = "@laqq_lab";

/** Rutas públicas indexables (sin backoffice / login). */
export const PUBLIC_ROUTES: {
  path: string;
  title: string;
  description: string;
}[] = [
  {
    path: "/",
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
  },
  {
    path: "/products",
    title: `Productos | ${SITE_NAME}`,
    description:
      "Catálogo de equipo de laboratorio, instrumental y material de consumo.",
  },
  {
    path: "/furniture",
    title: `Mobiliario de laboratorio | ${SITE_NAME}`,
    description:
      "Mobiliario, cámaras y servicios Koettermann para laboratorios.",
  },
  {
    path: "/company",
    title: `Empresa | ${SITE_NAME}`,
    description:
      "Conocé La Química Quirúrgica, nuestras representaciones y trayectoria.",
  },
  {
    path: "/contact",
    title: `Contacto | ${SITE_NAME}`,
    description: "Contactá al equipo de La Química Quirúrgica.",
  },
  {
    path: "/quote",
    title: `Solicitar cotización | ${SITE_NAME}`,
    description: "Pedí una cotización de productos y servicios de laboratorio.",
  },
  {
    path: "/support",
    title: `Soporte técnico | ${SITE_NAME}`,
    description: "Servicio técnico y soporte para equipos de laboratorio.",
  },
  {
    path: "/certificates",
    title: `Certificados | ${SITE_NAME}`,
    description: "Certificaciones y documentación de La Química Quirúrgica.",
  },
];

export function absoluteUrl(path: string): string {
  if (path.startsWith("http://") || path.startsWith("https://")) {
    return path;
  }
  const normalized = path.startsWith("/") ? path : `/${path}`;
  return `${SITE_ORIGIN}${normalized}`;
}

export function seoForPath(pathname: string): {
  title: string;
  description: string;
  canonical: string;
  robots: string;
} {
  const exact = PUBLIC_ROUTES.find((r) => r.path === pathname);
  if (exact) {
    return {
      title: exact.title,
      description: exact.description,
      canonical: absoluteUrl(exact.path),
      robots: "index, follow",
    };
  }

  if (pathname.startsWith("/product/")) {
    return {
      title: `Producto | ${SITE_NAME}`,
      description: DEFAULT_DESCRIPTION,
      canonical: absoluteUrl(pathname),
      robots: "index, follow",
    };
  }

  // Rutas privadas / 404 / no públicas: no indexar
  return {
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    canonical: absoluteUrl(pathname),
    robots: "noindex, follow",
  };
}
