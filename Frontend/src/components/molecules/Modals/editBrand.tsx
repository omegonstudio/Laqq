import { toast } from "sonner";
import { createBrand, updateBrand } from "@/store/brandSlice";
import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { Brand } from "@/types/types";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import UploadFile from "@/components/atoms/UploadFile";
import Button from "@/components/atoms/Button";
import { attachmentsApi } from "@/lib/api/attachments";

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
    logo_attachment: null,
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
      if (initialData.logo_attachment) {
        setImagePreview(initialData.logo_attachment);
      }
    } else {
      setLocalState({
        id: "",
        name: "",
        description: "",
        logo_attachment: null,
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
    const initialImage = initialData.logo_attachment ?? null;
    const currentImage = localState.logo_attachment ?? null;
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

      let attachmentId: string | null = localState.logo_attachment; // Mantener URL existente por defecto

      // ============================================
      // MANEJO DE IMAGEN
      // ============================================s

      if (!isNew) {
        // ========== EDITAR MARCA EXISTENTE ==========
        if (imageFile && !initialImage) {
          // Si hay un nuevo archivo, subirlo
          console.log("📤 Subiendo nueva imagen...");
          console.log("CREANDO ATTACHMENT PARA MARCA:", localState.name);
          try {
            const attachment = await attachmentsApi.create({
              file: imageFile,
              role: "image",
              attachable_type: "product",
            });
            attachmentId = attachment.id; // Asumiendo que createAttachment devuelve { id, url }
            console.log("✅ Imagen subida:", attachmentId);
          } catch (error) {
            toast.error("Error al subir la imagen");
            throw error;
          }
        } else if (initialImage && !currentImage) {
          console.log("BORRANDO ATTACHMENT PARA MARCA:", localState.name);

          const attachment = await attachmentsApi.remove(initialImage);
          console.log("✅ Imagen eliminada:", attachment);
          attachmentId = null;
        } else if (initialImage && currentImage) {
          console.log("ACTUALIZANDO ATTACHMENT PARA MARCA:", localState.name);

          const attachment = await attachmentsApi.update(initialImage, {
            file: imageFile,
          });
          console.log("✅ Imagen eliminada:", attachment);
          attachmentId = attachment.id;
        }
        const updateData: Partial<Brand> = {
          name: localState.name,
          description: localState.description,
          logo_attachment: attachmentId,
        };

        // Solo incluir logo si cambió
        if (attachmentId !== initialData?.logo_attachment) {
          updateData.logo_attachment = attachmentId;
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
        if (imageFile) {
          // Si hay un nuevo archivo, subirlo
          console.log("CREANDO ATTACHMENT PARA MARCA NUEVA:", localState.name);
          try {
            const attachment = await attachmentsApi.create({
              file: imageFile,
              role: "image",
              attachable_type: "product",
            });
            attachmentId = attachment.id; // Asumiendo que createAttachment devuelve { id, url }
            console.log("✅ Imagen subida:", attachmentId);
          } catch (error) {
            toast.error("Error al subir la imagen");
            throw error;
          }
        }
        const createData: Omit<Brand, "id"> = {
          name: localState.name,
          description: localState.description,
          logo_attachment: attachmentId,
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
    setLocalState({ ...localState, logo_attachment: null });
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
