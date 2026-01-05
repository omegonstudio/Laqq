import { useEffect, useState } from "react";
import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import { Product, ProductFormState, ProductSpec } from "@/types/types";
import Select from "@/components/atoms/Select";
import UploadFile from "@/components/atoms/UploadFile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Modal from "@/components/common/Modal";
import {
  productToFormState,
  getEmptyProductFormState,
} from "@/utils/productConverters";
import { toast } from "sonner";
import {
  cleanSpecsForSync,
  saveProductEntity,
  syncProductSpecifications,
  uploadProductImage,
} from "@/utils/productSaveFlow";
interface ModalProductProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Product | null;
  isNew: boolean;
}

const ModalProduct: React.FC<ModalProductProps> = ({
  isOpen,
  onClose,
  initialData,
  isNew,
}) => {
  const dispatch = useAppDispatch();
  const { list: categories } = useAppSelector((state) => state.categories);
  const { list: products } = useAppSelector((state) => state.products);
  const { list: brands } = useAppSelector((state) => state.brands);
  // Estado local con tipo específico para formulario
  const [localState, setLocalState] = useState<ProductFormState>(
    getEmptyProductFormState()
  );

  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [selectedRelated, setSelectedRelated] = useState<string>("");

  // ============================================
  // EFFECTS
  // ============================================

  useEffect(() => {
    if (initialData) {
      // Convertir Product a ProductFormState
      const formState = productToFormState(initialData);
      setLocalState(formState);

      // Si hay imagen, cargar preview (asumiendo que es UUID)
      if (initialData.image_attachment) {
        // Aquí podrías cargar la imagen desde el backend si es necesario
        // Por ahora, si es un UUID no tenemos la imagen para preview
        setImagePreview(null);
      }
    } else {
      setLocalState({
        ...getEmptyProductFormState(),
        specs: [
          {
            key: "",
            value: "",
            unit: "",
            is_visible: true,
          },
        ],
      });
      setImagePreview(null);
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setSelectedRelated("");
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
        toast.error("El nombre del producto es obligatorio");
        return;
      }

      if (!localState.product_code.trim()) {
        toast.error("El código del producto es obligatorio");
        return;
      }

      if (!localState.category) {
        toast.error("Debes seleccionar una categoría");
        return;
      }

      if (!localState.brand) {
        toast.error("Debes seleccionar una marca");
        return;
      }

      // ============================================
      // VALIDACIÓN: Filtrar specs vacías
      // ============================================
      const cleanedSpecs = cleanSpecsForSync(localState.specs || []);

      if (localState.id) {
        // ========== EDITAR PRODUCTO EXISTENTE ==========
        if (!initialData) {
          toast.error("No se encontraron datos del producto a editar");
          return;
        }

        const attachmentId = await uploadProductImage(
          localState.image_attachment,
          initialData.image_attachment
        );

        const product = await saveProductEntity({
          dispatch,
          formState: { ...localState, specs: cleanedSpecs },
          initialData,
          attachmentId,
        });

        await syncProductSpecifications({
          dispatch,
          productId: product.id,
          nextSpecs: cleanedSpecs,
          initialSpecs: initialData.specs || [],
        });

        toast.success("Producto actualizado exitosamente");
      } else {
        // ========== CREAR NUEVO PRODUCTO ==========

        const attachmentId = await uploadProductImage(
          localState.image_attachment,
          null
        );

        const product = await saveProductEntity({
          dispatch,
          formState: { ...localState, specs: cleanedSpecs },
          initialData: null,
          attachmentId,
        });

        await syncProductSpecifications({
          dispatch,
          productId: product.id,
          nextSpecs: cleanedSpecs,
          initialSpecs: [],
        });

        toast.success("Producto creado exitosamente");
      }

      onClose();
    } catch (error: unknown) {
      console.error("❌ Error guardando producto:", error);

      // Mensaje de error más específico
      const errorMessage =
        error instanceof Error ? error.message : "Error al guardar el producto";
      toast.error(errorMessage);
    }
  };
  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      setLocalState({ ...localState, image_attachment: selectedFile });

      // Crear preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(selectedFile);
    } else {
      setLocalState({ ...localState, image_attachment: null });
      setImagePreview(null);
    }
  };

  const handleRemoveImage = () => {
    setLocalState({ ...localState, image_attachment: null });
    setImagePreview(null);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalState({ ...localState, category: e.target.value });
  };

  const handleBrandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setLocalState({ ...localState, brand: e.target.value });
  };

  const handleRelatedChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const selectedId = e.target.value;
    if (!selectedId) return;

    const currentRelated = localState.related || [];
    const alreadyExists = currentRelated.some((rel) => rel.id === selectedId);

    if (!alreadyExists) {
      const selectedProduct = products.find((p) => p.id === selectedId);
      if (selectedProduct) {
        setLocalState({
          ...localState,
          related: [
            ...currentRelated,
            {
              id: selectedProduct.id,
              name: selectedProduct.name,
              brand: selectedProduct.brand,
              product_code: selectedProduct.product_code,
            },
          ],
        });
      }
    }

    setSelectedRelated("");
  };

  const handleRemoveRelated = (relatedId: string) => {
    setLocalState({
      ...localState,
      related: (localState.related || []).filter((rel) => rel.id !== relatedId),
    });
  };

  const handleSpecChange = (
    index: number,
    field: keyof ProductSpec,
    value: string | boolean
  ) => {
    const updatedSpecs = localState.specs.map((spec, i) => {
      if (i === index) {
        return { ...spec, [field]: value };
      }
      return spec;
    });

    setLocalState({ ...localState, specs: updatedSpecs });
  };

  const handleAddSpec = () => {
    setLocalState({
      ...localState,
      specs: [
        ...localState.specs,
        { key: "", value: "", unit: "", is_visible: true },
      ],
    });
  };

  const handleRemoveSpec = (index: number) => {
    const specs = [...localState.specs];
    specs.splice(index, 1);
    setLocalState({ ...localState, specs: specs.length ? specs : [{ key: "", value: "", unit: "", is_visible: true }] });
  };

  // Filtrar productos disponibles
  const availableProducts = products.filter((prod) => {
    if (localState.id && prod.id === localState.id) return false;
    const currentRelated = localState.related || [];
    return !currentRelated.some((rel) => rel.id === prod.id);
  });
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={localState.id ? "Editar Producto" : "Nuevo Producto"}
      size="xl"
      //clasName="max-w-4xl"
    >
      <div className="space-y-4">
        <div className="flex gap-5 items-end">
          <InputField
            label="Nombre"
            value={localState.name}
            onChange={(e) =>
              setLocalState({ ...localState, name: e.target.value })
            }
          />
          <InputField
            label="Código de Producto"
            value={localState.product_code}
            onChange={(e) => {
              const valueWithoutSpaces = e.target.value.replace(/\s+/g, "");
              setLocalState({
                ...localState,
                product_code: valueWithoutSpaces,
              });
            }}
          />
          {/* <div className="min-w-[15%] flex justify-end">
            <Toggle
              variant="outline"
              size="lg"
              pressed={active}
              onPressedChange={setLocalState({
                ...localState,
                is_active: active,
              })}
            >
              {active ? "Activo" : "Inactivo"}
            </Toggle>
          </div> */}
        </div>

        <InputField
          label="Descripción"
          value={localState.description}
          onChange={(e) =>
            setLocalState({ ...localState, description: e.target.value })
          }
        />
        <div className="flex gap-5">
          <Select
            label="Categoría"
            value={localState.category}
            onChange={handleCategoryChange}
            options={[
              { value: "", label: "Selecciona una categoría" },
              ...categories.map((cat) => ({
                value: cat.id,
                label: cat.name,
              })),
            ]}
          />
          <Select
            label="Marca"
            value={localState.brand}
            onChange={handleBrandChange}
            options={[
              { value: "", label: "Selecciona una marca" },
              ...brands.map((brand) => ({
                value: brand.id,
                label: brand.name,
              })),
            ]}
          />
        </div>
        {/* ✅ Select de productos relacionados + Lista de seleccionados */}
        <div className="space-y-2">
          <Select
            label="Productos relacionados"
            value={selectedRelated}
            onChange={handleRelatedChange}
            options={[
              { value: "", label: "Agregar producto relacionado" },
              ...availableProducts.map((prod) => ({
                value: prod.id,
                label: prod.name,
              })),
            ]}
          />

          {/* Lista de productos relacionados seleccionados */}
          {localState.related && localState.related.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {localState.related.map((rel) => (
                <div
                  key={rel.id}
                  className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full text-sm"
                >
                  <span>{rel.name}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveRelated(rel.id)}
                    className="text-red-500 hover:text-red-700 font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        <br />
        <label>Especificaciones del producto:</label>
        <div className="space-y-3">
          {localState.specs.map((s, index) => (
            <div
              key={s.id || index}
              className="border border-border rounded-lg p-3 space-y-2"
            >
              <div className="grid md:grid-cols-3 gap-2">
                <InputField
                  label="Nombre"
                  value={s.key || ""}
                  onChange={(e) =>
                    handleSpecChange(index, "key", e.target.value)
                  }
                />
                <InputField
                  label="Valor"
                  value={s.value || ""}
                  onChange={(e) =>
                    handleSpecChange(index, "value", e.target.value)
                  }
                />
                <InputField
                  label="Unidad (opcional)"
                  value={s.unit || ""}
                  onChange={(e) =>
                    handleSpecChange(index, "unit", e.target.value)
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={s.is_visible !== false}
                    onChange={(e) =>
                      handleSpecChange(index, "is_visible", e.target.checked)
                    }
                  />
                  Visualizar
                </label>
                <Button
                  variant="ghost"
                  onClick={() => handleRemoveSpec(index)}
                  className="text-red-500 hover:text-red-600"
                >
                  Eliminar
                </Button>
              </div>
            </div>
          ))}
          <Button variant="outline" onClick={handleAddSpec}>
            Agregar especificación
          </Button>
        </div>
        {/* ✅ Upload de imagen con preview */}
        <div className="space-y-2">
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

          {/* Info del archivo seleccionado */}
          {/* {file && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              <p>
                Archivo: <span className="font-medium">{file.name}</span>
              </p>
              <p>
                Tamaño:{" "}
                <span className="font-medium">
                  {(file.size / 1024).toFixed(2)} KB
                </span>
              </p>
            </div>
          )} */}
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

export default ModalProduct;
