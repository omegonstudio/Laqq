import { useEffect, useState } from "react";
import { Eye, Mail, Trash2 } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import Badge from "@/components/atoms/Badge";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { fetchMessages } from "@/store/contacts";
import { Message } from "@/types/api";
import { MessageDetailModal } from "../molecules/Modals/EditMessage";

const MessagesTable = () => {
  const dispatch = useAppDispatch();
  useEffect(() => {
    dispatch(fetchMessages({ page: 1, page_size: 20 }));
  }, [dispatch]);
  const { messages } = useAppSelector((state) => state.contacts);
  //const [messages] = useState<BackofficeMessage[]>(mockMessages);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const filteredMessages = messages.filter((message) => {
    const matchesSearch =
      message.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.first_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      message.last_name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || message.state === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Transform data to include badge for estado
  const dataWithBadges = filteredMessages.map((msg) => ({
    ...msg,
    estado: (
      <Badge variant={msg.state === "Nuevo" ? "default" : "secondary"}>
        {msg.state}
      </Badge>
    ),
  }));

  const handleView = (message: Message) => {
    setSelectedMessage(message);
    setIsModalOpen(true);
  };
  const handleReply = (message: Message) => {
    console.log("Responder mensaje:", message);
  };

  const handleDelete = (message: Message) => {
    console.log("Eliminar mensaje:", message);
  };

  const columns = [
    { key: "company_name", label: "Empresa", sortable: true },
    { key: "last_name", label: "Apellido", sortable: true },
    { key: "first_name", label: "Nombre", sortable: true },
    { key: "country", label: "País", sortable: true },
    { key: "created_at", label: "Fecha", sortable: true },
    { key: "message", label: "Mensaje", sortable: false },
    { key: "state", label: "Estado", sortable: true },
  ];

  const actions = [
    { icon: <Eye size={16} />, onClick: handleView, label: "Ver detalles" },
    { icon: <Mail size={16} />, onClick: handleReply, label: "Responder" },
    {
      icon: <Trash2 size={16} />,
      onClick: handleDelete,
      color: "red",
      label: "Eliminar",
    },
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
            { value: "Respondido", label: "Respondidos" },
          ]}
          className="max-w-xs"
        />
      </div>

      <Table columns={columns} data={dataWithBadges} actions={actions} />
      <MessageDetailModal
        message={selectedMessage}
        open={isModalOpen}
        onOpenChange={setIsModalOpen}
      />
    </div>
  );
};

export default MessagesTable;
