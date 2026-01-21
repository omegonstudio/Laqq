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
  const { list: brands } = useAppSelector((state) => state.brands);

  // Local UI state
  const dispatch = useAppDispatch();
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [brandFilter, setBrandFilter] = useState("all");
  const [isModalEditOpen, setIsModalEditOpen] = useState(false);
  const [isModalDeleteOpen, setIsModalDeleteOpen] = useState(false);
  const [isNew, setIsNew] = useState(false);
  const [currentProduct, setCurrentProduct] = useState<Product | null>(
    currentInitialData
  );

  // Debounce para el search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Fetch productos cuando cambian los filtros o la búsqueda
  useEffect(() => {
    const params: {
      page: number;
      page_size: number;
      search?: string;
      brand?: string;
    } = {
      page: 1,
      page_size: 10,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (brandFilter !== "all") {
      params.brand = brandFilter;
    }

    dispatch(fetchProducts(params));
  }, [dispatch, debouncedSearch, brandFilter]);

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

      // Recargar con los filtros actuales
      const params: {
        page: number;
        page_size: number;
        search?: string;
        brand?: string;
      } = {
        page: pagination.current_page,
        page_size: pagination.page_size,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      if (brandFilter !== "all") {
        params.brand = brandFilter;
      }

      dispatch(fetchProducts(params));
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

  // Handler para cambio de página (mantiene los filtros)
  const handlePageChange = (newPage: number) => {
    const params: {
      page: number;
      page_size: number;
      search?: string;
      brand?: string;
    } = {
      page: newPage,
      page_size: pagination.page_size,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (brandFilter !== "all") {
      params.brand = brandFilter;
    }

    dispatch(fetchProducts(params));
  };

  const columns = [
    { key: "product_code", label: "Codigo", sortable: false },
    { key: "name", label: "Nombre", sortable: false },
    { key: "brand", label: "Marca", sortable: false },
    { key: "category", label: "Categoria", sortable: false },
  ];

  const brandOptions = [
    { value: "all", label: "Todas las marcas" },
    ...brands.map((brand) => ({
      value: brand.id,
      label: brand.name,
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
            value={brandFilter}
            onChange={(e) => setBrandFilter(e.target.value)}
            options={brandOptions}
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
        data={products}
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
