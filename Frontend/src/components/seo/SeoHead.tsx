import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  DEFAULT_OG_IMAGE,
  SITE_NAME,
  TWITTER_SITE,
  seoForPath,
} from "@/config/seo";

function upsertMeta(
  selector: string,
  attrs: Record<string, string>,
  content: string
) {
  let el = document.head.querySelector(selector) as HTMLMetaElement | null;
  if (!el) {
    el = document.createElement("meta");
    Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let el = document.head.querySelector(
    `link[rel="${rel}"]`
  ) as HTMLLinkElement | null;
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
}

/**
 * Actualiza title, description, canonical y OG/Twitter por ruta (SPA).
 * Los valores por defecto en index.html cubren el primer paint / no-JS.
 */
export function SeoHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const { title, description, canonical } = seoForPath(pathname);

    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description" }, description);
    upsertLink("canonical", canonical);

    upsertMeta('meta[property="og:title"]', { property: "og:title" }, title);
    upsertMeta(
      'meta[property="og:description"]',
      { property: "og:description" },
      description
    );
    upsertMeta('meta[property="og:url"]', { property: "og:url" }, canonical);
    upsertMeta(
      'meta[property="og:image"]',
      { property: "og:image" },
      DEFAULT_OG_IMAGE
    );
    upsertMeta(
      'meta[property="og:site_name"]',
      { property: "og:site_name" },
      SITE_NAME
    );

    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title" }, title);
    upsertMeta(
      'meta[name="twitter:description"]',
      { name: "twitter:description" },
      description
    );
    upsertMeta(
      'meta[name="twitter:image"]',
      { name: "twitter:image" },
      DEFAULT_OG_IMAGE
    );
    upsertMeta(
      'meta[name="twitter:site"]',
      { name: "twitter:site" },
      TWITTER_SITE
    );
  }, [pathname]);

  return null;
}

export default SeoHead;
