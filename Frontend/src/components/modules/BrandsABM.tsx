import { useEffect, useMemo, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Brand } from "@/types/types";
import { deleteBrand, fetchBrands } from "@/store/brandSlice";
import ModalDelete from "../molecules/Modals/ModalDelete";
import ModalBrands from "../molecules/Modals/editBrand";
import { toast } from "@/hooks/use-toast";

const BrandsABM = () => {
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1); // 👈 página controlada por el padre
  const { list: brands, loading } = useAppSelector((state) => state.brands);
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Al cambiar la búsqueda, volver siempre a página 1
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch]);

  // Fetch cada vez que cambia página o búsqueda
  const filteredBrands = useMemo(() => {
    if (!searchTerm.trim()) return brands;
    const lower = searchTerm.toLowerCase().trim();
    return brands.filter(
      (brand) =>
        brand.name.toLowerCase().includes(lower) ||
        brand.description.toLowerCase().includes(lower)
    );
  }, [brands, searchTerm]);

  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand>({
    id: "",
    name: "",
    description: "",
    logo_attachment: null,
    logo_url: null,
  });

  const handleEdit = (brand: Brand) => {
    setCurrentBrand(brand);
    setIsModalEditOpen(true);
    setIsNew(false);
  };

  const handleCreate = () => {
    setIsNew(true);
    setCurrentBrand({
      id: "",
      name: "",
      description: "",
      logo_attachment: null,
      logo_url: null,
    });
    setIsModalEditOpen(true);
  };

  const handleOpenDeleteModal = (item: Brand) => {
    setCurrentBrand(item);
    setIsModalDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentBrand) return;
    try {
      await dispatch(deleteBrand(currentBrand.id)).unwrap();
      toast({ title: "Marca eliminada exitosamente", variant: "default" });
      setIsModalDeleteOpen(false);
      // Si era el único elemento de la página, retroceder una página
      if (brands.length === 1 && currentPage > 1) {
        setCurrentPage((prev) => prev - 1);
      }
    } catch (error: unknown) {
      console.error("Error eliminando:", error);
      if (error instanceof Error) {
        toast({
          title: error.message || "Error al eliminar la marca",
          variant: "destructive",
        });
      } else {
        toast({ title: "Error al eliminar la marca", variant: "destructive" });
      }
    }
  };

  const columns = [
    { key: "name", label: "Nombre", sortable: true },
    { key: "description", label: "Descripción", sortable: true },
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
            placeholder="Buscar marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={handleCreate}
        >
          <Plus size={18} />
          Nueva marca
        </Button>
      </div>

      <Table
        key={filteredBrands.length} // 👈 resetea la paginación al filtrar
        columns={columns}
        data={filteredBrands}
        actions={actions}
      />

      <ModalBrands
        isNew={isNew}
        isOpen={isModalEditOpen}
        onClose={() => setIsModalEditOpen(false)}
        initialData={currentBrand}
      />
      <ModalDelete
        isOpen={isModalDeleteOpen}
        onClose={() => {
          setIsModalDeleteOpen(false);
          setCurrentBrand(null);
        }}
        itemName={currentBrand?.name || ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default BrandsABM;
