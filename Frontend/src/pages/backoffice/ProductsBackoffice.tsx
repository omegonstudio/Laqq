import ProductsTable from "@/components/modules/ProductsTable";
import { fetchAllBrands, fetchBrands } from "@/store/brandSlice";
import { fetchAllCategories } from "@/store/categoriesSlice";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";

const ProductsBackoffice = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  useEffect(() => {
    dispatch(fetchAllBrands());
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
