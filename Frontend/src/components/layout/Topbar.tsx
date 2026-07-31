import { useAuth } from "@/components/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import Button from "@/components/atoms/Button";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "@/store";
import { logout as logoutAction } from "@/store/authSlice";

// user_type.id -> etiqueta legible para el topbar
const USER_TYPE_LABEL: Record<string, string> = {
  admin: "Administrador",
  back: "Backoffice",
  client: "Cliente",
};

const getUserTypeLabel = (
  userTypeId: string | null | undefined,
  isSuperuser: boolean | undefined
): string => {
  if (isSuperuser) return USER_TYPE_LABEL.admin;
  if (!userTypeId) return "Sin tipo";
  return USER_TYPE_LABEL[userTypeId] ?? userTypeId;
};

const Topbar = () => {
  const { logout: clearLocalAuth } = useAuth();
  const authUser = useSelector((state: RootState) => state.auth.user);
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    clearLocalAuth(); // limpia la sesión del AuthContext (localStorage)
    await dispatch(logoutAction()); // limpia el slice de Redux
    navigate("/login");
  };

  const userTypeLabel = getUserTypeLabel(
    authUser?.user_type_id,
    authUser?.is_superuser
  );

  return (
    <div className="bg-card border-b border-border px-6 py-4 flex items-center justify-between mb-6">
      <div>
        <h2 className="text-xl font-bold text-foreground">
          Panel de Administración
        </h2>
        <p className="text-sm text-muted-foreground">
          Gestión de contenidos y datos
        </p>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2 text-sm leading-tight">
          <User size={18} className="text-muted-foreground" />
          <div className="flex flex-col">
            <span className="font-medium text-foreground">
              {authUser?.username ?? "—"}
            </span>
            <span className="text-xs text-muted-foreground">
              {userTypeLabel}
            </span>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={handleLogout}
          className="flex items-center gap-2"
        >
          <LogOut size={16} />
          Cerrar Sesión
        </Button>
      </div>
    </div>
  );
};

export default Topbar;
