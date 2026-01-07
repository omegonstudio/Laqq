import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import { rrhhData as initialRRHH } from "@/utils/mockData/rrhh";

const RRHHTable = () => {
  const [rrhhData, setRRHHData] = useState(initialRRHH);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentRecord, setCurrentRecord] = useState({
    id: "",
    fecha: "",
    nombre: "",
    apellido: "",
    telefono: "",
    email: "",
    puesto: "",
    departamento: "",
  });

  const handleEdit = (record: any) => {
    setCurrentRecord(record);
    setIsModalOpen(true);
  };

  const handleDelete = (record: any) => {
    if (confirm(`¿Eliminar registro de ${record.nombre} ${record.apellido}?`)) {
      setRRHHData(rrhhData.filter(r => r.id !== record.id));
    }
  };

  const handleSave = () => {
    if (currentRecord.id) {
      setRRHHData(rrhhData.map(r => r.id === currentRecord.id ? currentRecord : r));
    } else {
      setRRHHData([...rrhhData, { 
        ...currentRecord, 
        id: Date.now().toString(),
        fecha: new Date().toISOString().split('T')[0]
      }]);
    }
    setIsModalOpen(false);
    setCurrentRecord({
      id: "",
      fecha: "",
      nombre: "",
      apellido: "",
      telefono: "",
      email: "",
      puesto: "",
      departamento: "",
    });
  };

  const columns = [
    { key: "fecha", label: "Fecha", sortable: true },
    { key: "nombre", label: "Nombre", sortable: true },
    { key: "apellido", label: "Apellido", sortable: true },
    { key: "telefono", label: "Teléfono", sortable: false },
    { key: "email", label: "Email", sortable: true },
    { key: "puesto", label: "Puesto", sortable: true },
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
            setCurrentRecord({
              id: "",
              fecha: "",
              nombre: "",
              apellido: "",
              telefono: "",
              email: "",
              puesto: "",
              departamento: "",
            });
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          Nuevo Registro RRHH
        </Button>
      </div>

      <Table columns={columns} data={rrhhData} actions={actions} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentRecord.id ? "Editar Registro RRHH" : "Nuevo Registro RRHH"}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Nombre"
            value={currentRecord.nombre}
            onChange={(e) => setCurrentRecord({ ...currentRecord, nombre: e.target.value })}
          />
          <InputField
            label="Apellido"
            value={currentRecord.apellido}
            onChange={(e) => setCurrentRecord({ ...currentRecord, apellido: e.target.value })}
          />
          <InputField
            label="Teléfono"
            value={currentRecord.telefono}
            onChange={(e) => setCurrentRecord({ ...currentRecord, telefono: e.target.value })}
          />
          <InputField
            label="Email"
            type="email"
            value={currentRecord.email}
            onChange={(e) => setCurrentRecord({ ...currentRecord, email: e.target.value })}
          />
          <InputField
            label="Puesto"
            value={currentRecord.puesto}
            onChange={(e) => setCurrentRecord({ ...currentRecord, puesto: e.target.value })}
          />
          <InputField
            label="Departamento"
            value={currentRecord.departamento}
            onChange={(e) => setCurrentRecord({ ...currentRecord, departamento: e.target.value })}
          />
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default RRHHTable;
