import { createBrand, updateBrand } from "@/store/brandSlice";
import { useState, useEffect } from "react";
import { useAppDispatch } from "@/store/hooks";
import { Brand, BrandFormState } from "@/types/types";
import Modal from "@/components/common/Modal";
import InputField from "@/components/atoms/InputField";
import UploadFile from "@/components/atoms/UploadFile";
import Button from "@/components/atoms/Button";
import { attachmentsApi } from "@/lib/api/attachments";
import { toast } from "@/hooks/use-toast";

interface ModalBrandsProps {
  isOpen: boolean;
  onClose: () => void;
  initialData: Brand | null;
  isNew: boolean;
  /**
   * Si es false, el control de subida de logo se deshabilita y se evita
   * cualquier llamada a Attachment endpoints. Default: true (compatibilidad).
   */
  canManageAttachments?: boolean;
}

const ModalBrands: React.FC<ModalBrandsProps> = ({
  isOpen,
  onClose,
  initialData,
  isNew,
  canManageAttachments = true,
}) => {
  const dispatch = useAppDispatch();

  // Estado local para el formulario
  const [localState, setLocalState] = useState<Brand>({
    id: "",
    name: "",
    description: "",
    logo_attachment: null,
    logo_url: null,
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
        setImagePreview(initialData.logo_url);
      }
    } else {
      setLocalState({
        id: "",
        name: "",
        description: "",
        logo_attachment: null,
        logo_url: null,
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
        toast({
          title: "El nombre de la marca es obligatorio",
          variant: "destructive",
        });
        return;
      }

      if (!localState.description.trim()) {
        toast({
          title: "La descripción de la marca es obligatoria",
          variant: "destructive",
        });
        return;
      }

      let attachmentId: string | null = localState.logo_attachment; // Mantener URL existente por defecto

      // ============================================
      // MANEJO DE IMAGEN
      // ============================================s

      if (!isNew) {
        // ========== EDITAR MARCA EXISTENTE ==========
        if (canManageAttachments && imageFile && !initialImage) {
          // Si hay un nuevo archivo, subirlo
          try {
            const attachment = await attachmentsApi.create({
              file: imageFile,
              role: "image",
              attachable_type: "product",
            });
            attachmentId = attachment.id; // Asumiendo que createAttachment devuelve { id, url }
          } catch (error) {
            toast({
              title: "Error al subir la imagen",
              variant: "destructive",
            });
            throw error;
          }
        } else if (canManageAttachments && initialImage && !currentImage) {
          const attachment = await attachmentsApi.remove(initialImage);
          attachmentId = null;
        } else if (canManageAttachments && initialImage && currentImage) {
          const attachment = await attachmentsApi.update(initialImage, {
            file: imageFile,
          });
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
        toast({ title: "Marca actualizada exitosamente" });
      } else {
        // ========== CREAR NUEVA MARCA ==========
        if (canManageAttachments && imageFile) {
          // Si hay un nuevo archivo, subirlo
          try {
            const attachment = await attachmentsApi.create({
              file: imageFile,
              role: "image",
              attachable_type: "product",
            });
            attachmentId = attachment.id; // Asumiendo que createAttachment devuelve { id, url }
          } catch (error) {
            toast({
              title: "Error al subir la imagen",
              variant: "destructive",
            });
            throw error;
          }
        }
        const createData: Omit<BrandFormState, "id"> = {
          name: localState.name,
          description: localState.description,
          logo_attachment: attachmentId,
        };

        const createdBrand = await dispatch(createBrand(createData)).unwrap();

        toast({ title: "Marca creada exitosamente" });
      }

      onClose();
    } catch (error: unknown) {
      console.error("❌ Error guardando marca:", error);

      const errorMessage =
        error instanceof Error ? error.message : "Error al guardar la marca";
      toast({ title: errorMessage, variant: "destructive" });
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
          {canManageAttachments ? (
            <>
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
            </>
          ) : (
            <div className="flex items-center gap-2 text-sm text-muted-foreground border border-dashed border-input rounded-md p-3">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Logo actual"
                  className="w-16 h-16 object-cover rounded border border-gray-200"
                />
              ) : (
                <span>Sin logo cargado.</span>
              )}
              <span>
                Solo el administrador puede subir o reemplazar el logo.
              </span>
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
