export type QueryParams = Record<
  string,
  string | number | boolean | null | undefined | (string | number | boolean | null | undefined)[]
>;

/**
 * Elimina valores undefined de los query params y expande arrays.
 */
export const cleanParams = (params?: QueryParams) => {
  if (!params) return undefined;

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined) return;

    if (Array.isArray(value)) {
      value.forEach((item) => {
        if (item === undefined) return;
        searchParams.append(key, item === null ? "" : String(item));
      });
      return;
    }

    searchParams.append(key, value === null ? "" : String(value));
  });

  // Convertimos de nuevo a Record para mantener compatibilidad con apiClient
  const result: Record<string, string> = {};
  searchParams.forEach((v, k) => {
    result[k] = v;
  });

  return result;
};

