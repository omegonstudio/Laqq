import ProductsTable from "@/components/modules/ProductsTable";

const ProductsBackoffice = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Gestión de Productos
        </h1>
        <p className="text-muted-foreground">
          Administrar catálogo de productos y equipamiento
        </p>
      </div>
      <ProductsTable />
    </div>
  );
};

export default ProductsBackoffice;
