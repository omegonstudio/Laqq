import TicketsABM from "@/components/modules/TicketsABM";

const TicketsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">
          Gestión de tickets de servicio
        </h1>
        <p className="text-muted-foreground mt-1">
          Administración de consultas y contactos de clientes
        </p>
      </div>
      <TicketsABM />
    </div>
  );
};

export default TicketsPage;
