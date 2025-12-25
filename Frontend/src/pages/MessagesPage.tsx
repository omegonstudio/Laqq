import MessagesTable from "@/components/modules/MessagesTable";

const MessagesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Administrador de Mensajes</h1>
        <p className="text-muted-foreground">Gestionar mensajes recibidos de clientes</p>
      </div>

      <MessagesTable />
    </div>
  );
};

export default MessagesPage;
