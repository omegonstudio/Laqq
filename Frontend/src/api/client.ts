/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  selectDecryptedAccessToken,
  refreshThunk,
  logout,
} from "../store/authSlice";
import type { AppDispatch, RootState } from "../store";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

interface ApiError {
  message: string;
  status: number;
  errors?: Record<string, string[]>;
}

// Variable global para el store (se inicializa en store/index.tsx)
let storeRef: { getState: () => RootState; dispatch: AppDispatch } | null =
  null;

export const setStoreReference = (store: {
  getState: () => RootState;
  dispatch: AppDispatch;
}) => {
  storeRef = store;
};

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
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
      const errorData = await response.json().catch(() => ({}));

      const error: ApiError = {
        message:
          errorData.detail || errorData.message || "Error en la petición",
        status: response.status,
        errors: errorData.errors,
      };

      throw error;
    }

    // Si es 204 No Content, devolver null
    if (response.status === 204) {
      return null as T;
    }

    return response.json();
  }

  /**
   * Realiza una petición con manejo automático de refresh token
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.getAccessToken();

    const headers: HeadersInit = {
      "Content-Type": "application/json",
      ...options.headers,
    };

    if (token) {
      (headers as Record<string, string>).Authorization = `Bearer ${token}`;
    }

    let response = await fetch(`${this.baseURL}${endpoint}`, {
      ...options,
      headers,
    });

    // Si es 401, intentar refrescar el token
    if (response.status === 401 && token) {
      try {
        const store = this.getStore();
        await store.dispatch(refreshThunk()).unwrap();

        // Obtener el nuevo token
        const newToken = this.getAccessToken();

        if (newToken) {
          (
            headers as Record<string, string>
          ).Authorization = `Bearer ${newToken}`;

          // Reintentar la petición
          response = await fetch(`${this.baseURL}${endpoint}`, {
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
   * GET request
   */
  async get<T>(endpoint: string, params?: Record<string, any>): Promise<T> {
    const queryString = params
      ? "?" + new URLSearchParams(params).toString()
      : "";

    return this.request<T>(`${endpoint}${queryString}`, {
      method: "GET",
    });
  }

  /**
   * POST request
   */
  async post<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: JSON.stringify(data),
    });
  }

  /**
   * PUT request
   */
  async put<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(endpoint: string, data?: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: JSON.stringify(data),
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
