import { useAppSelector } from "@/store/hooks";

type UserRole = "admin" | "back" | "client" | null;

const useUserRole = (): UserRole => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return null;
  if (user.is_superuser) return "admin";
  return user.user_type_id ?? null;
};

/** Productos: ¿puede exportar el Excel? Admin y back (mismo criterio que el endpoint). */
export const useCanExportProducts = () => {
  const role = useUserRole();
  return role === "admin" || role === "back";
};

/** Productos: ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageProducts = () => {
  const role = useUserRole();
  return role === "admin";
};

/** Cotizaciones: ¿puede editar/eliminar/enviar? Admin y back.
 *  (era la función principal del backoffice, no se bloquea). */
export const useCanManageQuotes = () => {
  const role = useUserRole();
  return role === "admin" || role === "back";
};

/** Cotizaciones: ¿puede crear? Admin y back. */
export const useCanCreateQuotes = () => {
  const role = useUserRole();
  return role === "admin" || role === "back";
};

/** Tickets: ¿puede editar/cerrar/asignar? Solo admin.
 *  (backoffice puede VER y adjuntar archivos pero no editar) */
export const useCanManageTickets = () => useUserRole() === "admin";

/** Tickets: ¿puede ejecutar acciones de workflow (assign/start/resolve/close)? Solo admin. */
export const useCanRunTicketActions = () => useUserRole() === "admin";

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

/** Marcas: ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageBrands = () => useUserRole() === "admin";

/** Adjuntos (galería general): ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageAttachments = () => useUserRole() === "admin";
