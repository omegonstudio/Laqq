import { useEffect, useState, useCallback } from "react";
import { apiClient } from "@/api/client";
import { PaginatedResponse } from "@/types/products";
import { Category } from "@/types/types";

interface UseCategorysParams {
  page?: number;
  page_size?: number;
}

export function useCategorys(params: UseCategorysParams = {}) {
  const [data, setData] = useState<Category[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCategorys = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<PaginatedResponse<Category>>(
        "/products/categories",
        params
      );

      setData(response.results);
      setCount(response.count);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error obteniendo Categoryos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCategorys();
  }, [JSON.stringify(params)]);

  return {
    data, // array de Categoryos
    count, // total
    loading,
    error,
    refetch: fetchCategorys,
  };
}
export function useCategory(id?: string) {
  const [data, setData] = useState<Category | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchCategory = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.get<Category>(
        `/products/categories${id}/`
      );
      setData(response);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error obteniendo el Categoryo");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCategory();
  }, [fetchCategory]);

  return {
    data,
    loading,
    error,
    refetch: fetchCategory,
  };
}
export function useCreateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<Category | null>(null);

  const createCategory = async (data: Partial<Category>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.post<Category>(
        "/products/categories",
        data
      );
      setCreatedItem(response);
      return response;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error creando el Categoryo");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createCategory,
    loading,
    error,
    createdItem,
  };
}
export function useUpdateCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedItem, setUpdatedItem] = useState<Category | null>(null);

  const updateCategory = async (id: string, data: Partial<Category>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.put<Category>(
        `/products/categories${id}/`,
        data
      );
      setUpdatedItem(response);
      return response;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error actualizando el Categoryo");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateCategory,
    loading,
    error,
    updatedItem,
  };
}

export function useDeleteCategory() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const deleteCategory = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await apiClient.delete(`/products/categories${id}/`);
      setSuccess(true);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error eliminando el Categoryo");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteCategory,
    loading,
    error,
    success,
  };
}
