import { useState } from "react";
import { Button } from "@/components/ui/button";
import Modal from "../common/Modal";
import { useBulkUploadProducts } from "@/hooks/useProducts";
import { InfoIcon } from "lucide-react";
import { BulkUploadResponse } from "@/types/types";
import cargaMasivaTemplateUrl from "@/assets/templates/TablaCargaMasiva.xlsx?url";

const CargaMasivaProducts = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<BulkUploadResponse | null>(null);

  const bulkUploadProducts = useBulkUploadProducts();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setResult(null); // limpiar resultado anterior
  };

  const handleUpload = () => {
    if (!file) return;

    const formData = new FormData();
    formData.append("csv_file", file);

    bulkUploadProducts.mutate(formData, {
      onSuccess: (data) => {
        setResult(data); // ✅ acá está la clave
        setFile(null);
      },
    });
  };

  const handleClose = () => {
    setIsModalOpen(false);
    setFile(null);
    setResult(null);
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
        onClose={handleClose}
        title="Carga Masiva de Productos"
      >
        {/* === INPUT === */}
        {!result && (
          <div className="space-y-4 mb-5">
            <input
              type="file"
              accept=".xls,.xlsx,.csv"
              onChange={handleFileChange}
            />
            {file && <p className="text-sm">Archivo: {file.name}</p>}
          </div>
        )}

        {/* === TEMPLATE === */}
        {!result && (
          <a
            href={cargaMasivaTemplateUrl}
            download="TablaCargaMasiva.xlsx"
            className="flex items-center gap-2 text-primary cursor-pointer mb-4"
          >
            <span>Excel de ejemplo</span>
            <InfoIcon size={18} />
          </a>
        )}

        {/* === RESULTADO === */}
        {result && (
          <div className="space-y-3 text-sm mb-4">
            <p>Productos creados: {result.created_products}</p>
            <p>Productos actualizados: {result.updated_products}</p>
            <p>Especificaciones creadas: {result.created_specs}</p>
            <p>Especificaciones actualizadas: {result.updated_specs}</p>
          </div>
        )}

        {/* === ERRORES === */}
        {result?.errors?.length > 0 && (
          <div className="mt-4">
            <p className="font-medium text-destructive">
              Errores durante la importación
            </p>
            <ul className="mt-2 space-y-2 text-sm">
              {result.errors.map((err, index) => (
                <li key={index}>
                  <div className="font-mono break-all">{err.image_url}</div>
                  <div className="text-muted-foreground">{err.error}</div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* === FOOTER === */}
        <div className="flex justify-end gap-4 mt-6">
          <Button variant="secondary" onClick={handleClose}>
            {result ? "Cerrar" : "Cancelar"}
          </Button>

          {!result && (
            <Button
              onClick={handleUpload}
              disabled={!file || bulkUploadProducts.isPending}
            >
              {bulkUploadProducts.isPending ? "Cargando..." : "Cargar"}
            </Button>
          )}
        </div>
      </Modal>
    </>
  );
};

export default CargaMasivaProducts;
