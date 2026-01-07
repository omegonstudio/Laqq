import { useState } from "react";
import InputField from "../atoms/InputField";
import Select from "../atoms/Select";
import Button from "../atoms/Button";
import { toast } from "@/hooks/use-toast";

const CertificatesModal = () => {
  const [brand, setBrand] = useState("fisher");
  const [articleNo, setArticleNo] = useState("");
  const [lotNo, setLotNo] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("Searching certificates:", { brand, articleNo, lotNo });
    toast({
      title: "Búsqueda Realizada",
      description: "Los certificados serán descargados si están disponibles.",
    });
  };

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold mb-4">Búsqueda de Certificados</h1>
            <p className="text-xl text-muted-foreground">
              Consulta certificados de análisis para productos Fisher y Acros
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 shadow-sm">
            <form onSubmit={handleSearch} className="space-y-6">
              <Select
                label="Marca"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                options={[
                  { value: "fisher", label: "Fisher Scientific" },
                  { value: "acros", label: "Acros Organics" },
                ]}
              />

              <InputField
                label="Número de Artículo"
                value={articleNo}
                onChange={(e) => setArticleNo(e.target.value)}
                placeholder="Ej: 123456"
                required
              />

              <InputField
                label="Número de Lote"
                value={lotNo}
                onChange={(e) => setLotNo(e.target.value)}
                placeholder="Ej: LOT123456"
                required
              />

              <Button type="submit" size="lg" className="w-full">
                Buscar Certificado
              </Button>
            </form>

            <div className="mt-6 p-4 bg-muted/30 rounded-xl">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Nota:</strong> Los números de artículo y lote se encuentran en la etiqueta del producto. Los certificados están disponibles para productos recientes.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CertificatesModal;
