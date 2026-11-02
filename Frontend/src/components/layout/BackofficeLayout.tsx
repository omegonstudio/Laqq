import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppDispatch } from "@/store/hooks";
import { fetchAllBrands } from "@/store/brandSlice";
import { fetchAllCategories } from "@/store/categoriesSlice";

const BackofficeLayout = () => {
  const dispatch = useAppDispatch();

  // Marcas/categorías completas para selects del BO (editar producto, etc.)
  useEffect(() => {
    dispatch(fetchAllBrands());
    dispatch(fetchAllCategories({}));
  }, [dispatch]);

  return (
    <div className="flex h-screen bg-muted/30 w-full">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <Topbar />
        <div className="px-6 pb-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default BackofficeLayout;
