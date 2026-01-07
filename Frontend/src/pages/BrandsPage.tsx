import BrandsABM from "@/components/modules/BrandsABM";

const BrandsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Marcas</h1>
        <p className="text-muted-foreground mt-1">
          Administración de marcas del catálogo
        </p>
      </div>
      <BrandsABM />
    </div>
  );
};

export default BrandsPage;
