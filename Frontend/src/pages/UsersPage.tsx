import { useState } from "react";
import UsersTable from "@/components/modules/UsersTable";
import PermissionsMatrix from "@/components/modules/PermissionsMatrix";
import { cn } from "@/lib/utils";

type UsersView = "users" | "matrix";

const UsersPage = () => {
  const [view, setView] = useState<UsersView>("users");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestión de Usuarios
        </h1>
        <p className="text-muted-foreground">
          Administrar usuarios del sistema BackOffice
        </p>
      </div>

      <div className="flex gap-2 border-b border-border">
        {(
          [
            { id: "users" as const, label: "Usuarios" },
            { id: "matrix" as const, label: "Matriz de permisos" },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setView(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium border-b-2 -mb-px transition-colors",
              view === tab.id
                ? "border-primary text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {view === "users" ? <UsersTable /> : <PermissionsMatrix />}
    </div>
  );
};

export default UsersPage;
