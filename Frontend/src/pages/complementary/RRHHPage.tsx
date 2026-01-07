import RRHHTable from "@/components/modules/complementary/RRHHTable";

const RRHHPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Recursos Humanos</h1>
        <p className="text-muted-foreground mt-1">
          Administre los registros del personal de la empresa
        </p>
      </div>
      <RRHHTable />
    </div>
  );
};

export default RRHHPage;
