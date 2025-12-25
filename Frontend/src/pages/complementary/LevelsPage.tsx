import LevelsABM from "@/components/modules/complementary/LevelsABM";

const LevelsPage = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Gestión de Niveles de Acceso</h1>
        <p className="text-muted-foreground mt-1">
          Configure los niveles de acceso y permisos del sistema
        </p>
      </div>
      <LevelsABM />
    </div>
  );
};

export default LevelsPage;
