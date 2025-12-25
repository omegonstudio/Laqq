import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import { mockNotes, BackofficeNote } from "@/utils/mockData/notes";
import Badge from "@/components/atoms/Badge";

const NotesTable = () => {
  const [notes] = useState<BackofficeNote[]>(mockNotes);
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");

  const filteredNotes = notes.filter(note => {
    const matchesSearch = note.titulo.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = typeFilter === "all" || note.tipo === typeFilter;
    return matchesSearch && matchesType;
  });

  // Transform data to include badge for estado
  const dataWithBadges = filteredNotes.map(note => ({
    ...note,
    estado: <Badge variant={note.estado === "Publicado" ? "default" : "secondary"}>{note.estado}</Badge>
  }));

  const handleEdit = (note: BackofficeNote) => {
    console.log("Editar nota:", note);
  };

  const handleDelete = (note: BackofficeNote) => {
    console.log("Eliminar nota:", note);
  };

  const columns = [
    { key: "titulo", label: "Título", sortable: true },
    { key: "fecha", label: "Fecha", sortable: true },
    { key: "tipo", label: "Tipo", sortable: true },
    { key: "autor", label: "Autor", sortable: true },
    { key: "estado", label: "Estado", sortable: true },
  ];

  const actions = [
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    { icon: <Trash2 size={16} />, onClick: handleDelete, color: "red", label: "Eliminar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <InputField
            placeholder="Buscar por título..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            options={[
              { value: "all", label: "Todos los tipos" },
              { value: "Producto", label: "Producto" },
              { value: "Empresa", label: "Empresa" },
              { value: "Evento", label: "Evento" },
              { value: "Promoción", label: "Promoción" },
              { value: "Capacitación", label: "Capacitación" }
            ]}
            className="max-w-xs"
          />
        </div>
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nueva Nota
        </Button>
      </div>

      <Table columns={columns} data={dataWithBadges} actions={actions} />
    </div>
  );
};

export default NotesTable;
