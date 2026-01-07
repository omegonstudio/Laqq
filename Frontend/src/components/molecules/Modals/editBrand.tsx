import { toast } from "sonner";
import { createBrand, updateBrand } from "@/store/brandSlice";
import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { Brand } from "@/types/types";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import UploadFile from "@/components/atoms/UploadFile";
import Button from "@/components/atoms/Button";
import { createAttachment } from "@/utils/fileConvert";

interface ModalBrandsProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Brand | null;
  isNew: boolean;
}

const ModalBrands: React.FC<ModalBrandsProps> = ({
  isOpen,
  onClose,
  initialData,
  isNew,
}) => {
  const dispatch = useAppDispatch();

  // Estado local para el formulario
  const [localState, setLocalState] = useState<Brand>({
    id: "",
    name: "",
    description: "",
    logo: null,
  });

  const [imageFile, setImageFile] = useState<File | null>(null); // Archivo seleccionado
  const [imagePreview, setImagePreview] = useState<string | null>(null); // Preview

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (initialData) {
      setLocalState(initialData);

      // Si hay logo (URL), mostrar preview
      if (initialData.logo) {
        setImagePreview(initialData.logo);
      }
    } else {
      setLocalState({
        id: "",
        name: "",
        description: "",
        logo: null,
      });
      setImagePreview(null);
    }

    setImageFile(null);
  }, [initialData, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setImageFile(null);
    }
  }, [isOpen]);

  // ============================================
  // HANDLERS
  // ============================================

  const handleSave = async () => {
    try {
      // ============================================
      // VALIDACIÓN: Campos obligatorios
      // ============================================
      if (!localState.name.trim()) {
        toast.error("El nombre de la marca es obligatorio");
        return;
      }

      if (!localState.description.trim()) {
        toast.error("La descripción de la marca es obligatoria");
        return;
      }

      let logoUrl: string | null = localState.logo; // Mantener URL existente por defecto

      // ============================================
      // MANEJO DE IMAGEN
      // ============================================s
      if (imageFile) {
        // Si hay un nuevo archivo, subirlo
        console.log("📤 Subiendo nueva imagen...");
        try {
          const attachment = await createAttachment(imageFile);
          logoUrl = attachment.id; // Asumiendo que createAttachment devuelve { id, url }
          console.log("✅ Imagen subida:", logoUrl);
        } catch (error) {
          toast.error("Error al subir la imagen");
          throw error;
        }
      } else if (imagePreview === null && localState.logo !== null) {
        // Si se eliminó la imagen existente
        logoUrl = null;
      }

      if (localState.id) {
        // ========== EDITAR MARCA EXISTENTE ==========

        const updateData: Partial<Brand> = {
          name: localState.name,
          description: localState.description,
          logo: logoUrl,
        };

        // Solo incluir logo si cambió
        if (logoUrl !== initialData?.logo) {
          updateData.logo = logoUrl;
        }

        const updatedBrand = await dispatch(
          updateBrand({
            id: localState.id,
            data: updateData,
          })
        ).unwrap();

        console.log("✅ Marca actualizada:", updatedBrand);
        toast.success("Marca actualizada exitosamente");
      } else {
        // ========== CREAR NUEVA MARCA ==========

        const createData: Omit<Brand, "id"> = {
          name: localState.name,
          description: localState.description,
          logo: logoUrl,
        };

        const createdBrand = await dispatch(createBrand(createData)).unwrap();

        console.log("✅ Marca creada:", createdBrand);
        toast.success("Marca creada exitosamente");
      }

      onClose();
    } catch (error: unknown) {
      console.error("❌ Error guardando marca:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Error al guardar la marca";
      toast.error(errorMessage);
    }
  };

  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      setImageFile(selectedFile);

      // Crear preview local
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setImageFile(null);
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setLocalState({ ...localState, logo: null });
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={localState.id ? "Editar Marca" : "Nueva Marca"}
      size="xl"
    >
      <div className="space-y-4">
        <InputField
          label="Nombre"
          value={localState.name}
          onChange={(e) =>
            setLocalState({ ...localState, name: e.target.value })
          }
          placeholder="Ej: Thermo Fisher"
        />

        <InputField
          label="Descripción"
          value={localState.description}
          onChange={(e) =>
            setLocalState({ ...localState, description: e.target.value })
          }
          placeholder="Descripción de la marca"
        />

        <div className="space-y-2">
          <label className="block text-sm font-medium">Logo</label>
          <UploadFile onFileChange={handleFile} />

          {/* Preview de la imagen */}
          {imagePreview && (
            <div className="relative inline-block mt-2">
              <img
                src={imagePreview}
                alt="Preview"
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-300"
              />
              <button
                type="button"
                onClick={handleRemoveImage}
                className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                title="Eliminar imagen"
              >
                ×
              </button>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave}>
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalBrands;
