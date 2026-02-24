import UsersTable from "@/components/modules/UsersTable";

const UsersPage = () => {
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
      <UsersTable />
    </div>
  );
};

export default UsersPage;
