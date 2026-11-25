import { useAppSelector } from "@/store/hooks";

type UserRole = "admin" | "back" | "back_full" | "client" | "servicio_tecnico" | null;

const useUserRole = (): UserRole => {
  const { user } = useAppSelector((state) => state.auth);
  if (!user) return null;
  if (user.is_superuser) return "admin";
  return user.user_type_id ?? null;
};

const isBackOffice = (role: UserRole) =>
  role === "admin" || role === "back" || role === "back_full";

/** Productos: ¿puede exportar el Excel? Admin, back y back office full. */
export const useCanExportProducts = () => isBackOffice(useUserRole());

/** Productos: ¿puede crear/editar/eliminar? Admin y back office full. */
export const useCanManageProducts = () => {
  const role = useUserRole();
  return role === "admin" || role === "back_full";
};

/** Cotizaciones: ¿puede editar/eliminar/enviar? Admin, back y back office full. */
export const useCanManageQuotes = () => isBackOffice(useUserRole());

/** Cotizaciones: ¿puede crear? Admin, back y back office full. */
export const useCanCreateQuotes = () => isBackOffice(useUserRole());

/** Tickets: ¿puede editar/cerrar/asignar? Admin y servicio técnico. */
export const useCanManageTickets = () => {
  const role = useUserRole();
  return role === "admin" || role === "servicio_tecnico";
};

/** Tickets: workflow (assign/start/resolve/close). Admin y servicio técnico. */
export const useCanRunTicketActions = () => {
  const role = useUserRole();
  return role === "admin" || role === "servicio_tecnico";
};

/** Tickets: export Excel. Admin y servicio técnico. */
export const useCanExportTickets = () => {
  const role = useUserRole();
  return role === "admin" || role === "servicio_tecnico";
};

/** ¿Es admin (o superuser mapeado a admin)? */
export const useIsAdmin = () => useUserRole() === "admin";

/** Backoffice reducido: solo dashboard y tickets. */
export const useIsServicioTecnico = () => useUserRole() === "servicio_tecnico";

/** Usuarios: ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageUsers = () => {
  const role = useUserRole();
  return role === "admin";
};

/** Contactos: ¿puede crear? Admin, back y back office full. */
export const useCanCreateContacts = () => isBackOffice(useUserRole());

/** Contactos: ¿puede editar/eliminar? Solo admin. */
export const useCanManageContacts = () => useUserRole() === "admin";

/** Mensajes: ¿puede eliminar? Solo admin. */
export const useCanManageMessages = () => useUserRole() === "admin";

/** Categorías: ¿puede crear/editar/eliminar? Admin y back office full. */
export const useCanManageCategories = () => {
  const role = useUserRole();
  return role === "admin" || role === "back_full";
};

/** Marcas: ¿puede crear/editar/eliminar? Admin y back office full. */
export const useCanManageBrands = () => {
  const role = useUserRole();
  return role === "admin" || role === "back_full";
};

/** Adjuntos (galería general): ¿puede crear/editar/eliminar? Solo admin. */
export const useCanManageAttachments = () => useUserRole() === "admin";
