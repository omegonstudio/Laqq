import { useNavigate, useSearchParams } from "react-router-dom";

export const useProductFilters = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const navigateWithParams = (params: URLSearchParams) => {
    const query = params.toString();
    navigate(query ? `/products?${query}` : "/products");
  };

  const setFilter = (key: string, value?: string) => {
    const params = new URLSearchParams(searchParams);

    if (!value || value === "all") {
      params.delete(key);
    } else {
      params.set(key, value);
    }

    navigateWithParams(params);
  };

  const clearSearch = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("search");
    navigateWithParams(params);
  };
  const clearBrand = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("brand");
    navigateWithParams(params);
  };
  const clearCategory = () => {
    const params = new URLSearchParams(searchParams);
    params.delete("category");
    navigateWithParams(params);
  };
  const clearAll = () => {
    navigate("/products");
  };

  return {
    searchParams,
    setFilter,
    clearSearch,
    clearBrand,
    clearCategory,
    clearAll,
  };
};
