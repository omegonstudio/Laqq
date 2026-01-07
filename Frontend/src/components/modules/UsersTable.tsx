import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Button from "@/components/atoms/Button";
import { mockUsers, BackofficeUser } from "@/utils/mockData/users";

const UsersTable = () => {
  const [users] = useState<BackofficeUser[]>(mockUsers);
  const [searchTerm, setSearchTerm] = useState("");

  const filteredUsers = users.filter(user =>
    user.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleEdit = (user: BackofficeUser) => {
    console.log("Editar usuario:", user);
  };

  const handleDelete = (user: BackofficeUser) => {
    console.log("Eliminar usuario:", user);
  };

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true },
    { key: "apellido", label: "Apellido", sortable: true },
    { key: "nick", label: "Nick", sortable: true },
    { key: "email", label: "Email", sortable: true },
    { key: "tipo", label: "Tipo", sortable: true },
    { key: "estado", label: "Estado", sortable: true },
  ];

  const actions = [
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    { icon: <Trash2 size={16} />, onClick: handleDelete, color: "red", label: "Eliminar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <InputField
          placeholder="Buscar por nombre, apellido o email..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-md"
        />
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nuevo Usuario
        </Button>
      </div>

      <Table columns={columns} data={filteredUsers} actions={actions} />
    </div>
  );
};

export default UsersTable;
