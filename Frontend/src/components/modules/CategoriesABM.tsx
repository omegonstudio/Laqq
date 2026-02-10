import { useEffect, useMemo, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Category } from "@/types/types";
import ModalCategory from "../molecules/Modals/EditCategory";
import { deleteCategory, fetchAllCategories } from "@/store/categoriesSlice";
import ModalDelete from "../molecules/Modals/ModalDelete";
import InputField from "../atoms/InputField";
import { toast } from "@/hooks/use-toast";
const CategoriesABM = () => {
  const { list: categories, loading: loadingCategories } = useAppSelector(
    (state) => state.categories
  );
  const dispatch = useAppDispatch();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(
    null
  );
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [searchCategories, setSearchCategories] = useState("");

  // Cargar TODAS las categorías al montar
  useEffect(() => {
    dispatch(fetchAllCategories());
  }, [dispatch]);

  const handleEdit = (category: Category) => {
    setSelectedCategory(category);
    setIsModalOpen(true);
  };

  const handleOpenDeleteModal = (product: Category) => {
    setSelectedCategory(product);
    setIsModalDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!selectedCategory) return;

    try {
      await dispatch(deleteCategory(selectedCategory.id)).unwrap();
      toast({ title: "Categoría eliminado exitosamente" });
      setIsModalDeleteOpen(false);
    } catch (error: unknown) {
      console.error("Error eliminando categoría:", error);
      if (error instanceof Error) {
        toast({
          title: error.message || "Error al eliminar el categoría",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al eliminar el categoría",
          variant: "destructive",
        });
      }
    }
  };

  const handleNewCategory = () => {
    setSelectedCategory(null);
    setIsModalOpen(true);
  };

  const getCategoryName = (id: string | undefined): string => {
    if (!id) return "Categoría nivel 0";
    const category = categories.find((cat) => cat.id === id);
    return category?.name || "";
  };

  // Filtrado local de categorías (sobre TODAS las categorías)
  const filteredCategories = useMemo(() => {
    if (!searchCategories.trim()) {
      return categories;
    }

    const searchLower = searchCategories.toLowerCase().trim();
    return categories.filter((cat) => {
      const nameMatch = cat.name.toLowerCase().includes(searchLower);
      const parentMatch = getCategoryName(cat.parent)
        .toLowerCase()
        .includes(searchLower);
      const orderMatch = cat.display_order.toString().includes(searchLower);
      return nameMatch || parentMatch || orderMatch;
    });
  }, [categories, searchCategories]);

  // Datos para la tabla con nombres de padres
  const tableData = useMemo(() => {
    return filteredCategories.map((cat) => ({
      ...cat,
      parentName: getCategoryName(cat.parent),
    }));
  }, [filteredCategories]);

  const columns = [
    { key: "name", label: "Nombre", sortable: true },
    { key: "display_order", label: "Orden", sortable: true },
    { key: "parentName", label: "Categoría padre", sortable: true },
  ];

  const actions = [
    { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
    {
      icon: <Trash2 size={16} />,
      onClick: handleOpenDeleteModal,
      color: "red",
      label: "Eliminar",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 flex-1 ">
          <InputField
            placeholder="Buscar por nombre..."
            value={searchCategories}
            onChange={(e) => setSearchCategories(e.target.value)}
            className="max-w-md"
          />
          {searchCategories && (
            <span className="text-sm text-gray-200 self-center w-full">
              {filteredCategories.length} resultado(s)
            </span>
          )}
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={handleNewCategory}
        >
          <Plus size={18} />
          Nueva Categoría
        </Button>
      </div>

      {loadingCategories ? (
        <div className="text-center py-8">Cargando categorías...</div>
      ) : (
        <Table
          columns={columns}
          data={tableData}
          actions={actions}
          // La tabla paginará sobre los resultados filtrados
        />
      )}

      <ModalCategory
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedCategory}
        isNew={!selectedCategory}
        categories={categories} // ← Siempre todas las categorías sin filtrar
      />

      <ModalDelete
        isOpen={isModalDeleteOpen}
        onClose={() => {
          setIsModalDeleteOpen(false);
          setSelectedCategory(null);
        }}
        itemName={selectedCategory?.name || ""}
        onConfirm={handleDelete}
      />
    </div>
  );
};

export default CategoriesABM;
