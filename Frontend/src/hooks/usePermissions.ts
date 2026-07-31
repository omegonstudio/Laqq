import { useAppSelector } from "@/store/hooks";

type UserRole = "admin" | "back" | "client" | null;

const useUserRole = (): UserRole => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return null;
  if (user.is_superuser) return "admin";
  return user.user_type_id ?? null;
};

/** Productos: ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageProducts = () => {
  const role = useUserRole();
  return role === "admin";
};

/** Cotizaciones: ¿puede editar/eliminar? Solo admin. */
export const useCanManageQuotes = () => useUserRole() === "admin";

/** Cotizaciones: ¿puede crear? Admin y back. */
export const useCanCreateQuotes = () => {
  const role = useUserRole();
  return role === "admin" || role === "back";
};

/** Tickets: ¿puede gestionar (editar/asignar/cerrar)? Admin y back. */
export const useCanManageTickets = () => {
  const role = useUserRole();
  return role === "admin" || role === "back";
};

/** Usuarios: ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageUsers = () => {
  const role = useUserRole();
  return role === "admin";
};

/** Contactos: ¿puede crear? Admin y back. */
export const useCanCreateContacts = () => {
  const role = useUserRole();
  return role === "admin" || role === "back";
};

/** Contactos: ¿puede editar/eliminar? Solo admin. */
export const useCanManageContacts = () => useUserRole() === "admin";

/** Mensajes: ¿puede eliminar? Solo admin. */
export const useCanManageMessages = () => useUserRole() === "admin";

/** Categorías: ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageCategories = () => useUserRole() === "admin";
