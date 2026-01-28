import QuotesTable from "@/components/modules/QuotesTable";

const QuotesBackoffice = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestión de Cotizaciones
        </h1>
        <p className="text-muted-foreground">
          Administrar solicitudes de cotización de clientes
        </p>
      </div>
      <QuotesTable />
    </div>
  );
};

export default QuotesBackoffice;
