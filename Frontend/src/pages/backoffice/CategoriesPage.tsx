import CategoriesABM from "@/components/modules/CategoriesABM";
import { fetchAllCategories } from "@/store/categoriesSlice";
import { useAppDispatch } from "@/store/hooks";
import { useEffect } from "react";

const CategoriesPage = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchAllCategories({}));
  }, [dispatch]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestión de Categorías
        </h1>
        <p className="text-muted-foreground">
          Administrar rubros, tipos y clasificaciones de productos
        </p>
      </div>

      <CategoriesABM />
    </div>
  );
};

export default CategoriesPage;
