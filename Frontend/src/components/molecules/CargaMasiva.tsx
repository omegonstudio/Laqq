import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "../common/Modal";
import { useBulkUploadProducts } from "@/hooks/useProducts";
import { InfoIcon } from "lucide-react";
import excelEjemplo from "../../../public/productos.xlsx";

const CargaMasivaProducts = () => {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const bulkUploadProducts = useBulkUploadProducts();

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setIsModalOpen(true);
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("csv_file", file);

    bulkUploadProducts.mutate(formData, {
      onSuccess: () => {
        setIsModalOpen(false);
        setFile(null);
      },
    });
  };

  return (
    <>
      <Button
        variant="secondary"
        className="flex items-center gap-2"
        onClick={() => setIsModalOpen(true)}
      >
        Carga masiva por excel
      </Button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Carga Masiva de Productos"
      >
        <div className="space-y-4 mb-5">
          <input type="file" accept=".xls,.xlsx" onChange={handleFileChange} />
          {file && <p>Archivo: {file?.name}</p>}
        </div>
        <a
          href={excelEjemplo}
          download
          className="flex items-center gap-2 text-primary cursor-pointer"
        >
          <span>Excel de ejemplo</span>
          <InfoIcon size={18} />
        </a>
        <div className="flex justify-end space-x-4">
          <Button variant="secondary" onClick={() => setIsModalOpen(false)}>
            Cancelar
          </Button>

          <Button
            onClick={handleUpload}
            disabled={bulkUploadProducts.isPending}
          >
            {bulkUploadProducts.isPending ? "Cargando..." : "Cargar"}
          </Button>
        </div>
      </Modal>
    </>
  );
};

export default CargaMasivaProducts;
