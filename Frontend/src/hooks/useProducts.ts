import { useEffect, useState, useCallback } from "react";
import { Product } from "../types/types";
import { productsApi } from "@/lib/api/products";
import { PaginatedResponse } from "@/types/types";

interface UseProductsParams {
  page?: number;
  page_size?: number;
}

export function useProducts(params: UseProductsParams = {}) {
  const [data, setData] = useState<Product[]>([]);
  const [count, setCount] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await productsApi.list(params);

      setData(response.results);
      setCount(response.count);
    } catch (err: unknown) {
      if (err instanceof Error) setError(err.message);
      else setError("Error obteniendo productos");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [JSON.stringify(params)]);

  return {
    data, // array de productos
    count, // total
    loading,
    error,
    refetch: fetchProducts,
  };
}
export function useProduct(id?: string) {
  const [data, setData] = useState<Product | null>(null);
  const [loading, setLoading] = useState<boolean>(!!id);
  const [error, setError] = useState<string | null>(null);

  const fetchProduct = useCallback(async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      const response = await productsApi.retrieve(id);
      setData(response as Product);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error obteniendo el producto");
      }
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  return {
    data,
    loading,
    error,
    refetch: fetchProduct,
  };
}
export function useCreateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdItem, setCreatedItem] = useState<Product | null>(null);

  const createProduct = async (data: Partial<Product>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await productsApi.create(
        data as unknown as Product // manteniendo compatibilidad
      );
      setCreatedItem(response);
      return response;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error creando el producto");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    createProduct,
    loading,
    error,
    createdItem,
  };
}
export function useUpdateProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [updatedItem, setUpdatedItem] = useState<Product | null>(null);

  const updateProduct = async (id: string, data: Partial<Product>) => {
    setLoading(true);
    setError(null);

    try {
      const response = await productsApi.update(
        id,
        data as unknown as Product
      );
      setUpdatedItem(response as Product);
      return response as Product;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error actualizando el producto");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    updateProduct,
    loading,
    error,
    updatedItem,
  };
}

export function useDeleteProduct() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);

  const deleteProduct = async (id: string) => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      await productsApi.delete(id);
      setSuccess(true);
      return true;
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError("Error eliminando el producto");
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    deleteProduct,
    loading,
    error,
    success,
  };
}
