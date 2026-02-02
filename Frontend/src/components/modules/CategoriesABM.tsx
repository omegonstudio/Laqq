import { useEffect, useMemo, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Category } from "@/types/types";
import ModalCategory from "../molecules/Modals/EditCategory";
import { deleteCategory, fetchCategories } from "@/store/categoriesSlice";
import { toast } from "sonner";
import ModalDelete from "../molecules/Modals/ModalDelete";
import InputField from "../atoms/InputField";

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
  const [debouncedSearch, setDebouncedSearch] = useState("");

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

      toast.success("Categoría eliminado exitosamente");
      setIsModalDeleteOpen(false);
    } catch (error: unknown) {
      console.error("Error eliminando categoría:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Error al eliminar el categoría");
      } else {
        toast.error("Error al eliminar el categoría");
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
  const tableData = useMemo(() => {
    return categories.map((cat) => ({
      ...cat, // ← Mantiene TODOS los datos originales incluyendo parent (ID)
      parentName: getCategoryName(cat.parent), // ← Agrega solo el nombre para visualización
    }));
  }, [categories]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchCategories);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchCategories]);

  useEffect(() => {
    const params: {
      page: number;
      page_size: number;
      search?: string;
    } = {
      page: 1,
      page_size: 10,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    dispatch(fetchCategories(params));
  }, [dispatch, debouncedSearch]);

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
        <div className="flex gap-4 flex-1">
          <InputField
            placeholder="Buscar por nombre..."
            value={searchCategories}
            onChange={(e) => setSearchCategories(e.target.value)}
            className="max-w-md"
          />
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
      <Table columns={columns} data={tableData} actions={actions} />

      <ModalCategory
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialData={selectedCategory}
        isNew={!selectedCategory}
        categories={categories}
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
