import AccessoriesTable from "@/components/modules/complementary/AccessoriesTable";

const AccessoriesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Accesorios</h1>
        <p className="text-muted-foreground mt-1">
          Administre el catálogo de accesorios y componentes
        </p>
      </div>
      <AccessoriesTable />
    </div>
  );
};

export default AccessoriesPage;
