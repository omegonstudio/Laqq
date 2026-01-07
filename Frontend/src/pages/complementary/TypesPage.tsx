import TypesABM from "@/components/modules/complementary/TypesABM";

const TypesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Tipos</h1>
        <p className="text-muted-foreground mt-1">
          Administre los tipos de productos y categorías
        </p>
      </div>
      <TypesABM />
    </div>
  );
};

export default TypesPage;
