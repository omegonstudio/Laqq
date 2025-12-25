import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { selectDecryptedAccessToken } from "@/store/authSlice";

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const decryptedToken = useSelector(selectDecryptedAccessToken);

  // Si no hay token válido, redirigir al login
  if (!decryptedToken) {
    return <Navigate to="/login" replace />;
  }

  // Si hay token válido, mostrar el contenido protegido
  return <>{children}</>;
};
