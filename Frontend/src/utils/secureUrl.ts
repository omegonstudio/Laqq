/**
 * Evita mixed content cuando la API devuelve URLs absolutas con http://
 * en un sitio servido por HTTPS.
 */
export function ensureHttpsUrl(
  url: string | null | undefined
): string | undefined {
  if (!url) return undefined;
  if (
    typeof window !== "undefined" &&
    window.location.protocol === "https:" &&
    url.startsWith("http://")
  ) {
    return url.replace(/^http:\/\//i, "https://");
  }
  return url;
}
