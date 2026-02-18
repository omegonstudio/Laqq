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
import ModalProduct from "../molecules/Modals/EditProduct";
import ModalDelete from "../molecules/Modals/ModalDelete";
import CargaMasivaProducts from "../molecules/CargaMasiva";
import { toast } from "@/hooks/use-toast";

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
  attachments: [],
};

const ProductsTable: React.FC = () => {
  // Redux state
  const {
    list: products,
    pagination,
    loading: loadingProducts,
  } = useAppSelector((state) => state.products);

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
  const [currentPageState, setCurrentPageState] = useState(1);

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
      page: currentPageState,
      page_size: 10,
    };

    if (debouncedSearch.trim()) {
      params.search = debouncedSearch.trim();
    }

    if (brandFilter !== "all") {
      params.brand = brandFilter;
    }

    dispatch(fetchProducts(params));
  }, [debouncedSearch, brandFilter, currentPageState, dispatch]);

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
      toast({ title: "Producto eliminado exitosamente" });
      setIsModalDeleteOpen(false);
      if (products.length === 1 && currentPageState > 1) {
        setCurrentPageState((p) => p - 1);
      }
      // Recargar con los filtros actuales
      const params: {
        page: number;
        page_size: number;
        search?: string;
        brand?: string;
        is_active?: boolean;
      } = {
        page: currentPageState,
        page_size: pagination.page_size,
      };

      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }

      if (brandFilter !== "all") {
        params.brand = brandFilter;
      }
    } catch (error: unknown) {
      console.error("Error eliminando producto:", error);
      if (error instanceof Error) {
        toast({
          title: error.message || "Error al eliminar el producto",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error al eliminar el producto",
          variant: "destructive",
        });
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
    setCurrentPageState(newPage); // Guardar localmente
  };
  useEffect(() => {
    setCurrentPageState(1);
  }, [debouncedSearch, brandFilter]);

  const renderActive = (is_active: boolean) => {
    if (is_active) {
      return "Activo";
    } else {
      return "Inactivo";
    }
  };
  const columns = [
    { key: "product_code", label: "Codigo", sortable: false },
    { key: "name", label: "Nombre", sortable: false },
    { key: "brand", label: "Marca", sortable: false },
    { key: "category", label: "Categoria", sortable: false },
    {
      key: "is_active",
      label: "Activo",
      sortable: false,
      render: (value: boolean) => renderActive(value),
    },
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
        <CargaMasivaProducts />
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
          currentPage: currentPageState,
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
