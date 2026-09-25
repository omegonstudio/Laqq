/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  selectDecryptedAccessToken,
  refreshThunk,
  logout,
} from "../store/authSlice";
import type { AppDispatch, RootState } from "../store";
import { getApiBaseUrl } from "@/config/api";

const BASE_URL = getApiBaseUrl();

/**
 * Determina si un JWT de acceso ya expiró (decodificando la claim `exp`).
 * Si no se puede decodificar, asume que NO expiró para evitar forzar
 * refetches innecesarios.
 */
const isJwtExpired = (token: string): boolean => {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return true;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = JSON.parse(atob(padded));
    return typeof decoded.exp === "number" && decoded.exp * 1000 <= Date.now();
  } catch {
    return false;
  }
};

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Variable global para el store (se inicializa en store/index.tsx)
let storeRef: { getState: () => RootState; dispatch: AppDispatch } | null =
  null;
let refreshPromise: Promise<void> | null = null;

export const setStoreReference = (store: {
  getState: () => RootState;
  dispatch: AppDispatch;
}) => {
  storeRef = store;
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL.replace(/\/+$/, "");
  }

  /**
   * Obtiene el store
   */
  private getStore() {
    if (!storeRef) {
      throw new Error(
        "Store no inicializado. Llama a setStoreReference primero."
      );
    }
    return storeRef;
  }

  /**
   * Obtiene el token de acceso desencriptado
   */
  private getAccessToken(): string | null {
    const state = this.getStore().getState();
    return selectDecryptedAccessToken(state);
  }

  /**
   * Maneja la respuesta de la API
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      let parsed: any = null;
      let rawText: string | undefined;

      try {
        parsed = await response.json();
      } catch {
        try {
          rawText = await response.text();
        } catch {
          rawText = undefined;
        }
      }

      const isObject =
        parsed && typeof parsed === "object" && !Array.isArray(parsed);

      const errorsField = parsed?.errors ?? (isObject ? parsed : undefined);
      const firstFieldError =
        isObject && errorsField
          ? Object.values(errorsField).find((v) => Array.isArray(v))?.[0]
          : undefined;

      const message =
        firstFieldError ||
        parsed?.detail ||
        parsed?.message ||
        rawText ||
        "Error en la petición";

      const error: ApiError = {
        message,
        status: response.status,
        errors: errorsField,
      };

      throw error;
    }

    // Si es 204 No Content, devolver null
    if (response.status === 204) {
      return null as T;
    }

    const contentType = response.headers.get("Content-Type") || "";
    if (contentType.toLowerCase().includes("application/json")) {
      return response.json();
    }

    const text = await response.text();
    return text as unknown as T;
  }

  private buildUrl(endpoint: string) {
    const normalizedEndpoint = endpoint.startsWith("/")
      ? endpoint
      : `/${endpoint}`;
    return `${this.baseURL}${normalizedEndpoint}`;
  }

  private serializeParams(params?: Record<string, any>) {
    if (!params) return "";

    const search = new URLSearchParams();

    Object.entries(params).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      if (Array.isArray(value)) {
        value.forEach((item) => {
          if (item === undefined || item === null) return;
          if (typeof item === "object") {
            search.append(key, JSON.stringify(item));
          } else {
            search.append(key, String(item));
          }
        });
        return;
      }

      if (typeof value === "object") {
        search.append(key, JSON.stringify(value));
      } else {
        search.append(key, String(value));
      }
    });

    const qs = search.toString();
    return qs ? `?${qs}` : "";
  }

  private async ensureFreshToken() {
    if (refreshPromise) {
      await refreshPromise;
      return;
    }

    const store = this.getStore();
    refreshPromise = store
      .dispatch(refreshThunk())
      .unwrap()
      .then(() => undefined);

    try {
      await refreshPromise;
    } finally {
      refreshPromise = null;
    }
  }

  /**
   * Devuelve un access token utilizable para la petición:
   * si el guardado está vencido intenta refrescarlo; si no hay sesión
   * válida devuelve null para que la petición salga ANÓNIMA (y así los
   * endpoints públicos de catálogo no se rompan con un Bearer vencido).
   */
  private async resolveUsableToken(): Promise<string | null> {
    const stored = this.getAccessToken();
    if (!stored) return null;

    if (!isJwtExpired(stored)) {
      return stored;
    }

    // Token vencido: intentar refrescar una vez.
    try {
      await this.ensureFreshToken();
      return this.getAccessToken();
    } catch {
      // Sin refresh válido → enviar anónimo (no hacer logout de un visitante).
      return null;
    }
  }

  /**
   * Realiza una petición con manejo automático de refresh token
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = await this.resolveUsableToken();

    const isFormData = options.body instanceof FormData;
    const headers: HeadersInit = {
      Accept: "application/json",
      ...options.headers,
    };

    if (!isFormData && options.body !== undefined) {
      (headers as Record<string, string>)["Content-Type"] = "application/json";
    }

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const url = this.buildUrl(endpoint);

    let response = await fetch(url, {
      ...options,
      headers,
    });

    // Si es 401, intentar refrescar el token
    const isAuthEndpoint =
      endpoint.includes("/users/token/") ||
      endpoint.includes("/users/token/refresh/");

    if (response.status === 401 && token && !isAuthEndpoint) {
      try {
        await this.ensureFreshToken();

        // Obtener el nuevo token
        const newToken = this.getAccessToken();

        if (newToken) {
          (
            headers as Record<string, string>
          ).Authorization = `Bearer ${newToken}`;

          // Reintentar la petición
          response = await fetch(this.buildUrl(endpoint), {
            ...options,
            headers,
          });
        }
      } catch {
        // Si falla el refresh, hacer logout
        const store = this.getStore();
        store.dispatch(logout());
        window.location.href = "/login";
        throw new Error("Sesión expirada");
      }
    }

    return this.handleResponse<T>(response);
  }

  /**
   * GET que descarga un archivo binario (Excel, PDF, etc.).
   */
  async getBlob(
    endpoint: string,
    params?: Record<string, any>
  ): Promise<{ blob: Blob; filename: string }> {
    const queryString = this.serializeParams(params);
    const token = await this.resolveUsableToken();
    const headers: HeadersInit = {
      Accept:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/octet-stream, application/json",
    };
    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    const url = this.buildUrl(`${endpoint}${queryString}`);
    let response = await fetch(url, { method: "GET", headers });

    const isAuthEndpoint =
      endpoint.includes("/users/token/") ||
      endpoint.includes("/users/token/refresh/");

    if (response.status === 401 && token && !isAuthEndpoint) {
      try {
        await this.ensureFreshToken();
        const newToken = this.getAccessToken();
        if (newToken) {
          (headers as Record<string, string>).Authorization = `Bearer ${newToken}`;
          response = await fetch(this.buildUrl(`${endpoint}${queryString}`), {
            method: "GET",
            headers,
          });
        }
      } catch {
        const store = this.getStore();
        store.dispatch(logout());
        window.location.href = "/login";
        throw new Error("Sesión expirada");
      }
    }

    if (!response.ok) {
      return this.handleResponse(response);
    }

    const disposition = response.headers.get("Content-Disposition") || "";
    const match = /filename\*?=(?:UTF-8''|"?)([^\";]+)/i.exec(disposition);
    const filename = match
      ? decodeURIComponent(match[1].replace(/"/g, "").trim())
      : "productos.xlsx";

    return { blob: await response.blob(), filename };
  }

  /**
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = this.serializeParams(params);

    return this.request<T>(`${endpoint}${queryString}`, {
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);

    return this.request<T>(endpoint, {
      method: "POST",
      body,
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);

    return this.request<T>(endpoint, {
      method: "PUT",
      body,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    const body = data instanceof FormData ? data : JSON.stringify(data);

    return this.request<T>(endpoint, {
      method: "PATCH",
      body,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: "DELETE",
    });
  }
}

// Exportar instancia única
export const apiClient = new ApiClient(BASE_URL);
