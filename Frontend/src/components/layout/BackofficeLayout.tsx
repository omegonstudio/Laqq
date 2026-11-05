import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { useAppDispatch } from "@/store/hooks";
import { fetchAllBrands } from "@/store/brandSlice";
import { fetchAllCategories } from "@/store/categoriesSlice";
import { useIsServicioTecnico } from "@/hooks/usePermissions";

const SERVICIO_TECNICO_PATHS = new Set(["/backoffice", "/backoffice/tickets"]);

const BackofficeLayout = () => {
  const dispatch = useAppDispatch();
  const location = useLocation();
  const isServicioTecnico = useIsServicioTecnico();

  // Marcas/categorías completas para selects del BO (editar producto, etc.)
  useEffect(() => {
    dispatch(fetchAllBrands());
    dispatch(fetchAllCategories({}));
  }, [dispatch]);

  if (
    isServicioTecnico &&
    !SERVICIO_TECNICO_PATHS.has(location.pathname)
  ) {
    return <Navigate to="/backoffice/tickets" replace />;
  }

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
