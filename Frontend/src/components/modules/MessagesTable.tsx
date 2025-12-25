import { useState } from "react";
import { Eye, Mail, Trash2 } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { mockMessages, BackofficeMessage } from "@/utils/mockData/messages";
import Badge from "@/components/atoms/Badge";

const MessagesTable = () => {
  const [messages] = useState<BackofficeMessage[]>(mockMessages);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const filteredMessages = messages.filter(message => {
    const matchesSearch = message.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         message.apellido.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === "all" || message.estado === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Transform data to include badge for estado
  const dataWithBadges = filteredMessages.map(msg => ({
    ...msg,
    estado: <Badge variant={msg.estado === "Nuevo" ? "default" : "secondary"}>{msg.estado}</Badge>
  }));

  const handleView = (message: BackofficeMessage) => {
    console.log("Ver mensaje:", message);
  };

  const handleReply = (message: BackofficeMessage) => {
    console.log("Responder mensaje:", message);
  };

  const handleDelete = (message: BackofficeMessage) => {
    console.log("Eliminar mensaje:", message);
  };

  const columns = [
    { key: "empresa", label: "Empresa", sortable: true },
    { key: "apellido", label: "Apellido", sortable: true },
    { key: "nombre", label: "Nombre", sortable: true },
    { key: "pais", label: "País", sortable: true },
    { key: "fecha", label: "Fecha", sortable: true },
    { key: "mensaje", label: "Mensaje", sortable: false },
    { key: "estado", label: "Estado", sortable: true },
  ];

  const actions = [
    { icon: <Eye size={16} />, onClick: handleView, label: "Ver detalles" },
    { icon: <Mail size={16} />, onClick: handleReply, label: "Responder" },
    { icon: <Trash2 size={16} />, onClick: handleDelete, color: "red", label: "Eliminar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <InputField
          placeholder="Buscar por empresa o nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          options={[
            { value: "all", label: "Todos los estados" },
            { value: "Nuevo", label: "Nuevos" },
            { value: "Respondido", label: "Respondidos" }
          ]}
          className="max-w-xs"
        />
      </div>

      <Table columns={columns} data={dataWithBadges} actions={actions} />
    </div>
  );
};

export default MessagesTable;
