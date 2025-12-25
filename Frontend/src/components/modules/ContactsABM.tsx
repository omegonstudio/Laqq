import { useState } from "react";
import { Edit2, Trash2, Eye } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import { mockContacts, Contact } from "@/utils/mockData/contacts";

const ContactsABM = () => {
  const [contacts] = useState<Contact[]>(mockContacts);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("todos");

  const filteredContacts = contacts.filter(contact => {
    const matchesSearch = 
      contact.empresa.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
      contact.email.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === "todos" || contact.estado === statusFilter;
    
    return matchesSearch && matchesStatus;
  });

  const handleView = (contact: Contact) => {
    console.log("Ver contacto:", contact);
  };

  const handleEdit = (contact: Contact) => {
    console.log("Editar contacto:", contact);
  };

  const handleDelete = (contact: Contact) => {
    console.log("Eliminar contacto:", contact);
  };

  const columns = [
    { key: "empresa", label: "Empresa", sortable: true },
    { key: "nombre", label: "Nombre", sortable: true },
    { key: "apellido", label: "Apellido", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "telefono", label: "Teléfono", sortable: false },
    { key: "pais", label: "País", sortable: true },
    { key: "fecha", label: "Fecha", sortable: true },
    { key: "estado", label: "Estado", sortable: true },
  ];

  const actions = [
    { icon: <Eye size={16} />, onClick: handleView, label: "Ver" },
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    { icon: <Trash2 size={16} />, onClick: handleDelete, color: "red", label: "Eliminar" },
  ];

  const statusOptions = [
    { value: "todos", label: "Todos los estados" },
    { value: "Nuevo", label: "Nuevo" },
    { value: "En proceso", label: "En proceso" },
    { value: "Respondido", label: "Respondido" }
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <InputField
          placeholder="Buscar por empresa, nombre, apellido o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Select
          options={statusOptions}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="w-48"
        />
      </div>

      <Table columns={columns} data={filteredContacts} actions={actions} />
    </div>
  );
};

export default ContactsABM;
