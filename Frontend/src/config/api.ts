/**
 * URL base de la API.
 * En producción usa ruta relativa /api (mismo origen, sin mixed content).
 * En desarrollo local cae a 127.0.0.1:8000 si no hay VITE_API_BASE_URL.
 */
export function getApiBaseUrl(): string {
  const configured = import.meta.env.VITE_API_BASE_URL;
  if (configured) {
    return configured.replace(/\/+$/, "");
  }
  if (import.meta.env.PROD) {
    return "/api";
  }
  return "http://127.0.0.1:8000";
}
