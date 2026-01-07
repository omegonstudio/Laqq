import ProductsTable from "@/components/modules/ProductsTable";
import { fetchBrands } from "@/store/brandSlice";
import { fetchCategories } from "@/store/categoriesSlice";
import { useAppDispatch } from "@/store/hooks";
import { fetchProducts } from "@/store/productSlice";
import { useEffect } from "react";

const ProductsBackoffice = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchProducts({ page: 1, page_size: 20 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchCategories({ page: 1, page_size: 20 }));
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchBrands({ page: 1, page_size: 20 }));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestión de Productos
        </h1>
        <p className="text-muted-foreground">
          Administrar catálogo de productos y equipamiento
        </p>
      </div>

      <ProductsTable />
    </div>
  );
};

export default ProductsBackoffice;
