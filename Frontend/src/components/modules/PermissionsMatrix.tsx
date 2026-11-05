import { Check, Star, X } from "lucide-react";

/**
 * Matriz vigente documentada en docs/MANUAL_ARQUITECTURA.md (§5.3).
 * No se lee de UserType.permissions: ese JSON no gobierna el acceso.
 */
const ROWS: {
  module: string;
  public: string;
  client: string;
  back: string;
  admin: string;
}[] = [
  {
    module: "Catálogo de productos (ver)",
    public: "Sí",
    client: "Sí",
    back: "Sí",
    admin: "Sí",
  },
  {
    module: "ABM productos, marcas y categorías",
    public: "No",
    client: "No",
    back: "Solo lectura",
    admin: "Completo",
  },
  {
    module: "Exportar Excel de productos",
    public: "No",
    client: "No",
    back: "Sí",
    admin: "Sí",
  },
  {
    module: "Crear cotización (web)",
    public: "Sí",
    client: "Sí",
    back: "Sí",
    admin: "Sí",
  },
  {
    module: "Gestionar cotizaciones",
    public: "No",
    client: "No",
    back: "Sí",
    admin: "Sí",
  },
  {
    module: "Enviar mensaje de contacto",
    public: "Sí",
    client: "Sí",
    back: "Sí",
    admin: "Sí",
  },
  {
    module: "Mensajes en backoffice",
    public: "No",
    client: "No",
    back: "Ver",
    admin: "Completo",
  },
  {
    module: "Contactos",
    public: "No",
    client: "No",
    back: "Crear",
    admin: "Completo",
  },
  {
    module: "Crear ticket (web)",
    public: "Sí",
    client: "Sí",
    back: "Sí",
    admin: "Sí",
  },
  {
    module: "Ver tickets",
    public: "No",
    client: "Solo los propios",
    back: "Todos",
    admin: "Todos",
  },
  {
    module: "Workflow de tickets",
    public: "No",
    client: "No",
    back: "No",
    admin: "Sí",
  },
  {
    module: "Escribir en la librería",
    public: "No",
    client: "No",
    back: "No",
    admin: "Sí",
  },
  {
    module: "Usuarios",
    public: "No",
    client: "No",
    back: "No",
    admin: "Completo",
  },
  {
    module: "Certificados",
    public: "Sí",
    client: "Sí",
    back: "Sí",
    admin: "Sí",
  },
  {
    module: "Dashboard",
    public: "No",
    client: "Según acceso",
    back: "Sí",
    admin: "Sí",
  },
];

const SERVICIO_TECNICO_ACCESS: Record<string, string> = {
  "Crear ticket (web)": "Sí",
  "Ver tickets": "Todos",
  "Workflow de tickets": "Sí",
  Dashboard: "Según acceso",
};

const AccessMark = ({ value }: { value: string }) => {
  if (value === "Sí") {
    return (
      <Check
        size={16}
        strokeWidth={3}
        className="text-green-600"
        aria-label="Sí"
      />
    );
  }
  if (value === "No") {
    return (
      <X size={16} strokeWidth={3} className="text-red-600" aria-label="No" />
    );
  }
  if (value === "Completo") {
    return (
      <Star
        size={16}
        className="text-amber-500 fill-amber-500"
        aria-label="Completo"
      />
    );
  }
  return <span className="text-muted-foreground">{value}</span>;
};

const PermissionsMatrix = () => {
  return (
    <div className="space-y-3">
      <div className="flex items-start justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          Acceso actual por tipo de usuario. Público es quien entra sin sesión.
        </p>
        <div className="flex items-center gap-4 shrink-0 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Check size={14} strokeWidth={3} className="text-green-600" />
            Sí
          </span>
          <span className="inline-flex items-center gap-1">
            <X size={14} strokeWidth={3} className="text-red-600" />
            No
          </span>
          <span className="inline-flex items-center gap-1">
            <Star size={14} className="text-amber-500 fill-amber-500" />
            Completo
          </span>
        </div>
      </div>
      <div className="overflow-x-auto rounded-md border border-border">
        <table className="w-full text-sm table-fixed">
          <colgroup>
            <col className="w-[23%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
            <col className="w-[11%]" />
          </colgroup>
          <thead className="bg-muted/50">
            <tr className="text-left">
              <th className="px-3 py-2 font-medium">Módulo</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">Público</th>
              <th className="px-3 py-2 font-medium whitespace-nowrap">Cliente</th>
              <th className="p-0" aria-hidden="true" />
              <th className="px-3 py-2 font-medium">Servicio Técnico</th>
              <th className="px-3 py-2 font-medium">Back Office</th>
              <th className="px-3 py-2 font-medium">Back Office Full</th>
              <th className="px-3 py-2 font-medium">Administrador</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row) => (
              <tr key={row.module} className="border-t border-border">
                <td className="px-3 py-2">{row.module}</td>
                <td className="px-3 py-2">
                  <AccessMark value={row.public} />
                </td>
                <td className="px-3 py-2">
                  <AccessMark value={row.client} />
                </td>
                <td className="p-0" aria-hidden="true" />
                <td className="px-4 py-2">
                  <AccessMark value={SERVICIO_TECNICO_ACCESS[row.module] ?? "No"} />
                </td>
                <td className="px-3 py-2">
                  <AccessMark value={row.back} />
                </td>
                <td className="px-3 py-2">
                  <AccessMark
                    value={
                      row.module === "ABM productos, marcas y categorías"
                        ? "Completo"
                        : row.back
                    }
                  />
                </td>
                <td className="px-3 py-2">
                  <AccessMark value={row.admin} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PermissionsMatrix;
