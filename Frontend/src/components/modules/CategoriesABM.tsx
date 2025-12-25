import { useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import { categories } from "@/utils/data/categories";

interface CategoryFlat {
  id: string;
  nombre: string;
  tipo: string;
  padre?: string;
}

const CategoriesABM = () => {
  // Flatten categories for table display
  const flatCategories: CategoryFlat[] = categories.flatMap(cat => [
    { id: cat.id, nombre: cat.name, tipo: "Principal", padre: "-" },
    ...(cat.subcategories?.map(sub => ({
      id: sub.id,
      nombre: sub.name,
      tipo: "Subcategoría",
      padre: cat.name
    })) || [])
  ]);

  const [categoryData] = useState<CategoryFlat[]>(flatCategories);

  const handleEdit = (category: CategoryFlat) => {
    console.log("Editar categoría:", category);
  };

  const handleDelete = (category: CategoryFlat) => {
    console.log("Eliminar categoría:", category);
  };

  const columns = [
    { key: "nombre", label: "Nombre", sortable: true },
    { key: "tipo", label: "Tipo", sortable: true },
    { key: "padre", label: "Categoría Padre", sortable: true },
  ];

  const actions = [
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    { icon: <Trash2 size={16} />, onClick: handleDelete, color: "red", label: "Eliminar" },
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="primary" className="flex items-center gap-2">
          <Plus size={18} />
          Nueva Categoría
        </Button>
      </div>

      <Table columns={columns} data={categoryData} actions={actions} />
    </div>
  );
};

export default CategoriesABM;
