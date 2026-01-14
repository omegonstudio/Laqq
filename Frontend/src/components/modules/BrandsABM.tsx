import { useEffect, useState } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { Brand } from "@/types/types";
import { deleteBrand, fetchBrand, fetchBrands } from "@/store/brandSlice";
import { toast } from "sonner";
import ModalDelete from "../molecules/Modals/ModalDelete";
import ModalBrands from "../molecules/Modals/editBrand";

const BrandsABM = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    dispatch(fetchBrands({ page: 1, page_size: 20 }));
  }, [dispatch]);

  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [currentBrand, setCurrentBrand] = useState<Brand>({
    id: "",
    name: "",
    description: "",
    logo_attachment: null,
  });

  const { list: initialBrands, loading } = useAppSelector(
    (state) => state.brands
  );
  const [searchTerm, setSearchTerm] = useState("");

  const filteredBrands = initialBrands.filter(
    (brand) =>
      brand.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brand.description.toLowerCase().includes(searchTerm.toLowerCase())
  );
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
    });
    setIsModalEditOpen(true);
  };

  const columns = [
    { key: "name", label: "name", sortable: true },
    { key: "description", label: "Descripción", sortable: true },
  ];

  const handleOpenDeleteModal = (item: Brand) => {
    setCurrentBrand(item);
    setIsModalDeleteOpen(true);
  };

  // ✅ Esta función se ejecuta cuando confirmas en el modal
  const handleConfirmDelete = async () => {
    if (!currentBrand) return;

    try {
      await dispatch(deleteBrand(currentBrand.id)).unwrap();

      toast.success("Brando eliminado exitosamente");
      setIsModalDeleteOpen(false);
    } catch (error: unknown) {
      console.error("Error eliminando:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Error al eliminar el Brand");
      } else {
        toast.error("Error al eliminar el Brand");
      }
    }
  };
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

      <Table columns={columns} data={filteredBrands} actions={actions} />
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
