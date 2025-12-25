import { useState } from "react";
import { Edit2, Plus, Search } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import { accessories as initialAccessories } from "@/utils/mockData/accessories";

const AccessoriesTable = () => {
  const [accessoriesData, setAccessoriesData] = useState(initialAccessories);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentAccessory, setCurrentAccessory] = useState({
    id: "",
    codigo: "",
    marca: "",
    modelo: "",
    descripcion: "",
    categoria: "",
  });

  const handleEdit = (accessory: any) => {
    setCurrentAccessory(accessory);
    setIsModalOpen(true);
  };

  const handleSave = () => {
    if (currentAccessory.id) {
      setAccessoriesData(accessoriesData.map(a => 
        a.id === currentAccessory.id ? currentAccessory : a
      ));
    } else {
      setAccessoriesData([...accessoriesData, { 
        ...currentAccessory, 
        id: Date.now().toString()
      }]);
    }
    setIsModalOpen(false);
    setCurrentAccessory({
      id: "",
      codigo: "",
      marca: "",
      modelo: "",
      descripcion: "",
      categoria: "",
    });
  };

  const filteredData = accessoriesData.filter(acc =>
    acc.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.marca.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.modelo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    acc.descripcion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const columns = [
    { key: "codigo", label: "Código", sortable: true },
    { key: "marca", label: "Marca", sortable: true },
    { key: "modelo", label: "Modelo", sortable: true },
    { key: "descripcion", label: "Descripción", sortable: false },
    { key: "categoria", label: "Categoría", sortable: true },
  ];

  const actions = [
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Buscar accesorios..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>
        
        <Button 
          variant="primary" 
          className="flex items-center gap-2"
          onClick={() => {
            setCurrentAccessory({
              id: "",
              codigo: "",
              marca: "",
              modelo: "",
              descripcion: "",
              categoria: "",
            });
            setIsModalOpen(true);
          }}
        >
          <Plus size={18} />
          Nuevo Accesorio
        </Button>
      </div>

      <Table columns={columns} data={filteredData} actions={actions} />

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={currentAccessory.id ? "Editar Accesorio" : "Nuevo Accesorio"}
        size="lg"
      >
        <div className="grid grid-cols-2 gap-4">
          <InputField
            label="Código"
            value={currentAccessory.codigo}
            onChange={(e) => setCurrentAccessory({ ...currentAccessory, codigo: e.target.value })}
          />
          <InputField
            label="Marca"
            value={currentAccessory.marca}
            onChange={(e) => setCurrentAccessory({ ...currentAccessory, marca: e.target.value })}
          />
          <InputField
            label="Modelo"
            value={currentAccessory.modelo}
            onChange={(e) => setCurrentAccessory({ ...currentAccessory, modelo: e.target.value })}
          />
          <InputField
            label="Categoría"
            value={currentAccessory.categoria}
            onChange={(e) => setCurrentAccessory({ ...currentAccessory, categoria: e.target.value })}
          />
          <div className="col-span-2">
            <InputField
              label="Descripción"
              value={currentAccessory.descripcion}
              onChange={(e) => setCurrentAccessory({ ...currentAccessory, descripcion: e.target.value })}
            />
          </div>
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

export default AccessoriesTable;
