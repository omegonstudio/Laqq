import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import { levels as initialLevels } from "@/utils/mockData/levels";

const LevelsABM = () => {
  const [levelsData, setLevelsData] = useState(initialLevels);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentLevel, setCurrentLevel] = useState({ 
    id: "", 
    name: "", 
    permissions: [] as string[] 
  });

  const handleEdit = (level: any) => {
    setCurrentLevel(level);
    setIsModalOpen(true);
  };

  const handleDelete = (level: any) => {
    if (confirm(`¿Eliminar nivel "${level.name}"?`)) {
      setLevelsData(levelsData.filter(l => l.id !== level.id));
    }
  };

  const handleSave = () => {
    if (currentLevel.id) {
      setLevelsData(levelsData.map(l => l.id === currentLevel.id ? currentLevel : l));
    } else {
      setLevelsData([...levelsData, { ...currentLevel, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setCurrentLevel({ id: "", name: "", permissions: [] });
  };

  const columns = [
    { key: "name", label: "Nivel de Acceso", sortable: true },
    { 
      key: "permissions", 
      label: "Permisos", 
      sortable: false,
      render: (value: string[]) => value.join(", ")
    },
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
            setCurrentLevel({ id: "", name: "", permissions: [] });
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          Nuevo Nivel
        </Button>
      </div>

      <Table columns={columns} data={levelsData} actions={actions} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentLevel.id ? "Editar Nivel" : "Nuevo Nivel"}
      >
        <div className="space-y-4">
          <InputField
            label="Nombre del Nivel"
            value={currentLevel.name}
            onChange={(e) => setCurrentLevel({ ...currentLevel, name: e.target.value })}
          />
          <InputField
            label="Permisos (separados por coma)"
            value={currentLevel.permissions.join(", ")}
            onChange={(e) => setCurrentLevel({ 
              ...currentLevel, 
              permissions: e.target.value.split(",").map(p => p.trim()) 
            })}
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

export default LevelsABM;
