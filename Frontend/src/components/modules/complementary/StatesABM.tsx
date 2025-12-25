import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import { states as initialStates } from "@/utils/mockData/states";

const StatesABM = () => {
  const [statesData, setStatesData] = useState(initialStates);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentState, setCurrentState] = useState({ id: "", name: "", description: "" });

  const handleEdit = (state: any) => {
    setCurrentState(state);
    setIsModalOpen(true);
  };

  const handleDelete = (state: any) => {
    if (confirm(`¿Eliminar estado "${state.name}"?`)) {
      setStatesData(statesData.filter(s => s.id !== state.id));
    }
  };

  const handleSave = () => {
    if (currentState.id) {
      setStatesData(statesData.map(s => s.id === currentState.id ? currentState : s));
    } else {
      setStatesData([...statesData, { ...currentState, id: Date.now().toString() }]);
    }
    setIsModalOpen(false);
    setCurrentState({ id: "", name: "", description: "" });
  };

  const columns = [
    { key: "name", label: "Estado", sortable: true },
    { key: "description", label: "Descripción", sortable: false },
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
            setCurrentState({ id: "", name: "", description: "" });
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          Nuevo Estado
        </Button>
      </div>

      <Table columns={columns} data={statesData} actions={actions} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentState.id ? "Editar Estado" : "Nuevo Estado"}
      >
        <div className="space-y-4">
          <InputField
            label="Nombre"
            value={currentState.name}
            onChange={(e) => setCurrentState({ ...currentState, name: e.target.value })}
          />
          <InputField
            label="Descripción"
            value={currentState.description}
            onChange={(e) => setCurrentState({ ...currentState, description: e.target.value })}
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

export default StatesABM;
