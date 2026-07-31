import { useAuth } from "@/components/auth/useAuth";
import { useNavigate } from "react-router-dom";
import { LogOut, User } from "lucide-react";
import Button from "@/components/atoms/Button";
import { useDispatch } from "react-redux";
import { AppDispatch } from "@/store";
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
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();

  const handleLogout = async () => {
    logout(); // tu hook (si hace algo extra)
    await dispatch(logoutAction()); // la acción de Redux
    navigate("/login");
  };

  const userTypeLabel = getUserTypeLabel(user?.user_type_id, user?.is_superuser);

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
              {user?.username ?? "—"}
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
