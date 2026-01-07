import { apiClient } from "@/api/client";

export interface NormalizedApiError {
  message: string;
  status?: number;
  errors?: Record<string, string[]>;
}

const normalizeError = (err: unknown): NormalizedApiError => {
  if (err && typeof err === "object") {
    const anyErr = err as Record<string, any>;
    return {
      message: anyErr.message || "Error en la petición",
      status: anyErr.status,
      errors: anyErr.errors,
    };
  }

  return { message: "Error en la petición" };
};

const wrap = async <T>(fn: () => Promise<T>): Promise<T> => {
  try {
    return await fn();
  } catch (err) {
    throw normalizeError(err);
  }
};

export const api = {
  get: <T>(path: string, params?: Record<string, any>) =>
    wrap(() => apiClient.get<T>(path, params)),
  post: <T>(path: string, data?: any) =>
    wrap(() => apiClient.post<T>(path, data)),
  put: <T>(path: string, data?: any) =>
    wrap(() => apiClient.put<T>(path, data)),
  patch: <T>(path: string, data?: any) =>
    wrap(() => apiClient.patch<T>(path, data)),
  delete: <T>(path: string) => wrap(() => apiClient.delete<T>(path)),
};

