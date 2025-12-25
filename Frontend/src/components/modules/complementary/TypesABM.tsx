import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import { types as initialTypes } from "@/utils/mockData/types";

const TypesABM = () => {
  const [typesData, setTypesData] = useState(initialTypes);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentType, setCurrentType] = useState({ id: "", name: "", category: "" });

  const handleEdit = (type: any) => {
    setCurrentType(type);
    setIsModalOpen(true);
  };

  const handleDelete = (type: any) => {
    if (confirm(`¿Eliminar tipo "${type.name}"?`)) {
      setTypesData(typesData.filter(t => t.id !== type.id));
    }
  };

  const handleSave = () => {
    if (currentType.id) {
      setTypesData(typesData.map(t => t.id === currentType.id ? currentType : t));
    } else {
      setTypesData([...typesData, { ...currentType, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setCurrentType({ id: "", name: "", category: "" });
  };

  const columns = [
    { key: "name", label: "Tipo", sortable: true },
    { key: "category", label: "Categoría", sortable: true },
  ];

  const actions = [
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    { icon: <Trash2 size={16} />, onClick: handleDelete, color: "red", label: "Eliminar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => {
            setCurrentType({ id: "", name: "", category: "" });
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          Nuevo Tipo
        </Button>
      </div>

      <Table columns={columns} data={typesData} actions={actions} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentType.id ? "Editar Tipo" : "Nuevo Tipo"}
      >
        <div className="space-y-4">
          <InputField
            label="Nombre"
            value={currentType.name}
            onChange={(e) => setCurrentType({ ...currentType, name: e.target.value })}
          />
          <InputField
            label="Categoría"
            value={currentType.category}
            onChange={(e) => setCurrentType({ ...currentType, category: e.target.value })}
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button variant="primary" onClick={handleSave}>
              Guardar
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default TypesABM;
