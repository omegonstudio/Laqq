import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import { Product } from "@/types/types";
import ModalProduct from "../molecules/Modals/EditProduct";
import ModalDelete from "../molecules/Modals/ModalDelete";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteProduct } from "@/store/productSlice";
import { Toast } from "@radix-ui/react-toast";
import { toast } from "sonner";

const ProductsTable: React.FC = () => {
  // Redux state
  const { list: products, loading: loadingProducts } = useAppSelector(
    (state) => state.products
  );

  const { list: categories, loading: loadingCategories } = useAppSelector(
    (state) => state.categories
  );

  // Local UI state
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product>({
    id: "",
    name: "",
    description: "",
    brand: "",
    category: "",
    product_code: "",
    specs: [],
    related: [],
    image_attachment: null,
    is_active: true,
  });

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalEditOpen(true);
    setIsNew(false);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setCurrentProduct(product);
    setIsModalDeleteOpen(true);
  };

  // ✅ Esta función se ejecuta cuando confirmas en el modal
  const handleConfirmDelete = async () => {
    if (!currentProduct) return;

    try {
      await dispatch(deleteProduct(currentProduct.id)).unwrap();

      toast.success("Producto eliminado exitosamente");
      setIsModalDeleteOpen(false);
    } catch (error: unknown) {
      console.error("Error eliminando producto:", error);
      if (error instanceof Error) {
        toast.error(error.message || "Error al eliminar el producto");
      } else {
        toast.error("Error al eliminar el producto");
      }
    }
  };
  const handleCreate = () => {
    setIsNew(true);
    setCurrentProduct({
      id: "",
      name: "",
      description: "",
      brand: "",
      is_active: true,
      category: "",
      product_code: "",
      specs: [
        {
          volume: "",
          code: "",
          dimensions: "",
          cap: "",
          outlet: "",
          accuracy: "",
          additional_specs: "",
          id: "",
          precision: "",
          product: "",
        },
      ],
      related: [],
      image_attachment: null,
    });
    setIsModalEditOpen(true);
  };

  const filteredProducts = products.filter((product: Product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCategory =
      categoryFilter === "all" || product.category === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const columns = [
    { key: "product_code", label: "Código", sortable: true },
    { key: "name", label: "Nombre", sortable: true },
    { key: "brand", label: "Marca", sortable: true },
    { key: "category", label: "Categoría", sortable: true },
  ];

  // ✅ Construir opciones del select con "Todos" al inicio
  const categoryOptions = [
    { value: "all", label: "Todas las categorías" },
    ...categories.map((cat) => ({
      value: cat.name,
      label: cat.name,
    })),
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-4 flex-1">
          <InputField
            placeholder="Buscar por nombre o marca..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />

          <Select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            options={categoryOptions} // ✅ Usar el array con "Todos"
            className="max-w-xs"
          />
        </div>
        <Button
          variant="primary"
          className="flex items-center gap-2"
          onClick={handleCreate}
        >
          <Plus size={18} />
          Nuevo Producto
        </Button>
      </div>

      <Table
        columns={columns}
        data={filteredProducts}
        actions={[
          { icon: <Edit2 size={16} />, onClick: handleEdit, label: "Editar" },
          {
            icon: <Trash2 size={16} />,
            onClick: handleOpenDeleteModal,
            label: "Eliminar",
          },
        ]}
      />

      <ModalProduct
        isNew={isNew}
        isOpen={isModalEditOpen}
        onClose={() => setIsModalEditOpen(false)}
        initialData={currentProduct}
      />

      <ModalDelete
        isOpen={isModalDeleteOpen}
        onClose={() => {
          setIsModalDeleteOpen(false);
          setCurrentProduct(null);
        }}
        itemName={currentProduct?.name || ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ProductsTable;
