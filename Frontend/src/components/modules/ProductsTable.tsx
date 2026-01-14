import { useState, useEffect } from "react";
import { Edit2, Trash2, Plus } from "lucide-react";
import Table from "@/components/common/Table";
import InputField from "@/components/atoms/InputField";
import Select from "@/components/atoms/Select";
import Button from "@/components/atoms/Button";
import { Product } from "@/types/types";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { deleteProduct, fetchProducts } from "@/store/productSlice";
import { fixedSpecInitialData } from "@/utils/productSaveFlow";
import { toast } from "sonner";
import ModalProduct from "../molecules/Modals/EditProduct";
import ModalDelete from "../molecules/Modals/ModalDelete";

const currentInitialData: Product = {
  id: "",
  name: "",
  description: "",
  brand: "",
  brand_id: "",
  category: "",
  category_id: "",
  product_code: "",
  specs: [],
  related: [],
  related_products: [],
  image_attachment: null,
  is_active: true,
  fixed_specs: [fixedSpecInitialData],
  image_url: null,
  is_featured: false,
};

const ProductsTable: React.FC = () => {
  // Redux state
  const {
    list: products,
    pagination,
    loading: loadingProducts,
  } = useAppSelector((state) => state.products);

  const { list: categories } = useAppSelector((state) => state.categories);

  // Local UI state
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(
    currentInitialData
  );
  useEffect(() => {
    console.log(products, "PRODUCTOS");
  }, [products]);
  // Cargar productos inicialmente
  useEffect(() => {
    dispatch(fetchProducts({ page: 1, page_size: 10 }));
  }, [dispatch]);

  const handleEdit = (product: Product) => {
    setCurrentProduct(product);
    setIsModalEditOpen(true);
    setIsNew(false);
  };

  const handleOpenDeleteModal = (product: Product) => {
    setCurrentProduct(product);
    setIsModalDeleteOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!currentProduct) return;

    try {
      await dispatch(deleteProduct(currentProduct.id)).unwrap();
      toast.success("Producto eliminado exitosamente");
      setIsModalDeleteOpen(false);

      // Recargar la página actual
      dispatch(
        fetchProducts({
          page: pagination.current_page,
          page_size: pagination.page_size,
        })
      );
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
    setCurrentProduct(currentInitialData);
    setIsModalEditOpen(true);
  };

  // Handler para cambio de página
  const handlePageChange = (newPage: number) => {
    dispatch(
      fetchProducts({
        page: newPage,
        page_size: pagination.page_size,
      })
    );
  };

  // Filtrado local (si quieres mantenerlo, considera hacerlo en el servidor)
  const filteredProducts = products.filter((product: Product) => {
    const brandName = product.brand ? product.brand.toLowerCase() : "";
    const matchesSearch =
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      brandName.includes(searchTerm.toLowerCase());

    const categoryName = product.category || "";
    const matchesCategory =
      categoryFilter === "all" || categoryName === categoryFilter;

    return matchesSearch && matchesCategory;
  });

  const columns = [
    { key: "product_code", label: "Código", sortable: false }, // Desactivar sorting local
    { key: "name", label: "Nombre", sortable: false },
    { key: "brand", label: "Marca", sortable: false },
    { key: "category", label: "Categoría", sortable: false },
  ];

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
            options={categoryOptions}
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
        serverPagination={{
          currentPage: pagination.current_page,
          totalPages: pagination.total_pages,
          totalItems: pagination.count,
          pageSize: pagination.page_size,
          onPageChange: handlePageChange,
        }}
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
          setCurrentProduct(currentInitialData);
        }}
        itemName={currentProduct?.name || ""}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
};

export default ProductsTable;
