import StatesABM from "@/components/modules/complementary/StatesABM";

const StatesPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Estados</h1>
        <p className="text-muted-foreground mt-1">
          Administre los diferentes estados del sistema
        </p>
      </div>
      <StatesABM />
    </div>
  );
};

export default StatesPage;
