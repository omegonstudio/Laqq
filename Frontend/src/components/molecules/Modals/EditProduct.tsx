import { useEffect, useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import {
  Product,
  ProductFixedSpec,
  ProductFormState,
  ProductSpec,
} from "@/types/types";
import Select from "@/components/atoms/Select";
import UploadFile from "@/components/atoms/UploadFile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Modal from "@/components/common/Modal";
import {
  productToFormState,
  getEmptyProductFormState,
  formStateToUpdateRequest,
  hasProductChanges,
  haveSpecsChanged,
  haveFixedSpecsChanged,
} from "@/utils/productConverters";
import {
  cleanFixedSpecsForSync,
  cleanSpecsForSync,
  saveProductEntity,
  syncProductFixedSpecifications,
  syncProductSpecifications,
  validateProductForm,
  fixedSpecInitialData,
} from "@/utils/productSaveFlow";
import { deleteFixedSpec } from "@/store/fixedSpecsSlice";
import { attachmentsApi } from "@/lib/api/attachments";
import { Toggle } from "@/components/ui/toggle";
import { refreshProductEverywhere } from "@/store/productSlice";
import { toast } from "@/hooks/use-toast";

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
    if (!isNew) {
      // Convertir Product a ProductFormState
      const formState = productToFormState(initialData);
      setLocalState(formState);

      // Si hay imagen, cargar preview (asumiendo que es UUID)
      if (initialData.image_url) {
        // Aquí podrías cargar la imagen desde el backend si es necesario
        // Por ahora, si es un UUID no tenemos la imagen para preview
        setImagePreview(initialData.image_url);
      }
    } else {
      setLocalState({
        ...getEmptyProductFormState(),
      });

      setImagePreview(null);
    }
  }, [initialData, isNew]);

  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setSelectedRelated("");

      // ✅ Restaurar al estado inicial
      if (initialData) {
        const formState = productToFormState(initialData);
        setLocalState(formState);
      } else {
        setLocalState({
          ...getEmptyProductFormState(),
          fixed_specs: [fixedSpecInitialData],
          specs: [
            {
              key: "",
              value: "",
              unit: "",
              is_visible: true,
              product: initialData.id,
            },
          ],
        });
      }
    }
  }, [isOpen, initialData]);
  // ============================================
  // HANDLERS
  // ============================================

  const handleCancel = () => {
    onClose(); // El useEffect se encargará de resetear el estado
  };
  const validation = useMemo(
    () => validateProductForm(localState),
    [localState]
  );
  const hasChanges = useMemo(() => {
    if (!initialData) return true;

    const productUpdate = formStateToUpdateRequest(
      localState,
      initialData,
      undefined
    );

    const productChanged = hasProductChanges(productUpdate);

    const specsChanged = haveSpecsChanged(
      localState.specs,
      initialData.specs || initialData.specifications || []
    );

    const fixedSpecsChanged = haveFixedSpecsChanged(
      localState.fixed_specs,
      initialData.fixed_specs
    );
    const imageChanged =
      localState.image_file !== null ||
      localState.image_attachment_id !== initialData.image_attachment;

    return productChanged || specsChanged || fixedSpecsChanged || imageChanged;
  }, [localState, initialData]);

  // ✅ Botón habilitado solo si: formulario válido Y (es nuevo O tiene cambios)
  const isSaveEnabled = useMemo(() => {
    return validation.isValid && (!initialData || hasChanges);
  }, [validation.isValid, initialData, hasChanges]);

  const handleSave = async () => {
    try {
      const initialImage = initialData?.image_attachment ?? null;
      const currentImage = localState.image_file ?? null;
      // ============================================
      // VALIDACIÓN: Campos obligatorios
      // ============================================
      if (!validation.isValid) {
        toast({
          title: validation.errorMessage || "Formulario inválido",
          variant: "destructive",
        });
        return;
      }

      // ============================================
      // VALIDACIÓN: Filtrar specs vacías
      // ============================================
      const cleanedSpecs: ProductSpec[] = cleanSpecsForSync(
        localState.specs || []
      );
      const cleanedFixedSpecs = cleanFixedSpecsForSync(
        localState.fixed_specs || []
      );

      if (isNew) {
        // ========== CREAR PRODUCTO EXISTENTE ==========
        let attachmentId: string | null = localState.image_attachment_id;
        if (currentImage) {
          const attachment = await attachmentsApi.create({
            file: currentImage,
            role: "image",
            attachable_type: "product",
          });

          attachmentId = attachment.id;
        }

        const product = await saveProductEntity({
          dispatch,
          formState: { ...localState, specs: cleanedSpecs },
          initialData: null,
          attachmentId: attachmentId,
          isNew,
        });

        await syncProductSpecifications({
          dispatch,
          productId: product.id,
          nextSpecs: cleanedSpecs,
          initialSpecs: initialData.specs || [],
        });
        //dispatch(refreshProductEverywhere(product.id));
        await dispatch(refreshProductEverywhere(product.id)).unwrap();

        if (localState.fixed_specs.length === 0) {
          dispatch(deleteFixedSpec(product.fixed_specs[0].id!));
        } else {
          await syncProductFixedSpecifications({
            dispatch,
            productId: product.id,
            nextSpecs: cleanedFixedSpecs,
            initialSpecs: initialData.fixed_specs || [],
          });
        }

        toast({ title: "Producto creado exitosamente" });
      } else {
        if (!initialData) {
          toast({
            title: "No se encontraron datos del producto a editar",
            variant: "destructive",
          });
          return;
        }
        // ========== EDITAR PRODUCTO ==========
        let attachmentId;
        if (initialImage && !currentImage) {
          await attachmentsApi.remove(initialImage);
          attachmentId = null;
        }
        if (!initialImage && currentImage) {
          const attachment = await attachmentsApi.create({
            file: currentImage,
            role: "image",
            attachable_type: "product",
          });
          attachmentId = attachment.id;
        }
        if (initialImage && currentImage) {
          const attachment = await attachmentsApi.update(initialImage, {
            file: currentImage,
            role: "image",
          });
          attachmentId = attachment.id;
        }
        const product = await saveProductEntity({
          dispatch,
          formState: { ...localState, specs: cleanedSpecs },
          initialData: initialData,
          attachmentId: attachmentId,
          isNew,
        });
        await syncProductSpecifications({
          dispatch,
          productId: product.id,
          nextSpecs: cleanedSpecs,
          initialSpecs: initialData.specs,
        });
        await syncProductFixedSpecifications({
          dispatch,
          productId: product.id,
          nextSpecs: cleanedFixedSpecs,
          initialSpecs: initialData.fixed_specs,
        });
        dispatch(refreshProductEverywhere(initialData.id));
        toast({ title: "Producto actualizado exitosamente" });
      }

      onClose();
    } catch (error: unknown) {
      // Mensaje de error más específico
      const errorMessage =
        error instanceof Error ? error.message : "Error al guardar el producto";
      toast({ title: errorMessage, variant: "destructive" });
    }
  };

  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;

        // Crear el objeto en el formato que espera tu base de datos
        // const fileData: AttachmentCreatePayload = {
        //   file: selectedFile,
        //   role: "image",
        //   attachable_type: "product",
        // };

        setLocalState({ ...localState, image_file: selectedFile });

        // Usar la misma base64 para el preview
        setImagePreview(base64String);
      };

      reader.readAsDataURL(selectedFile);
    } else {
      setLocalState({ ...localState, image_file: null });
      setImagePreview(null);
    }
  };
  const handleRemoveImage = () => {
    setLocalState({
      ...localState,
      image_file: null,
      image_attachment_id: null,
    });
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
  const handleFixedSpecChange = (
    index: number,
    field: keyof ProductFixedSpec,
    value: string
  ) => {
    const updatedSpecs = localState.fixed_specs.map((spec, i) => {
      if (i === index) {
        return { ...spec, [field]: value };
      }
      return spec;
    });

    setLocalState({ ...localState, fixed_specs: updatedSpecs });
  };

  const handleAddSpec = () => {
    setLocalState({
      ...localState,
      specs: [
        ...localState.specs,
        {
          key: "",
          value: "",
          unit: "",
          is_visible: true,
          product: localState.id,
        },
      ],
    });
  };

  const handleRemoveSpec = (index: number) => {
    setLocalState((prev) => ({
      ...prev,
      specs: prev.specs.filter((_, i) => i !== index),
    }));
  };

  const handleRemoveFixedSpec = () => {
    setLocalState({
      ...localState,
      fixed_specs: [],
    });
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
          <div className="min-w-[10%] flex justify-end">
            <Toggle
              pressed={localState.is_active}
              onPressedChange={(pressed) =>
                setLocalState({
                  ...localState,
                  is_active: pressed,
                })
              }
            >
              {localState.is_active ? "Activo" : "Inactivo"}
            </Toggle>
          </div>
        </div>
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-2 text-lg text-muted-foreground">
            <input
              type="checkbox"
              checked={localState.is_featured !== false}
              onChange={(e) =>
                setLocalState({
                  ...localState,
                  is_featured: e.target.checked,
                })
              }
            />
            Destacar
          </label>
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
        {localState.fixed_specs.map((s, index) => (
          <div key={s.id || index} className="flex flex-col gap-5 items-end">
            <div className="grid grid-cols-3 gap-2 w-full">
              <InputField
                label="Código"
                value={s.code}
                onChange={(e) =>
                  handleFixedSpecChange(index, "code", e.target.value)
                }
              />
              <InputField
                label="Volumen"
                value={s.volume}
                onChange={(e) =>
                  handleFixedSpecChange(index, "volume", e.target.value)
                }
              />
              <InputField
                label="Dimensiones"
                value={s.dimensions}
                onChange={(e) =>
                  handleFixedSpecChange(index, "dimensions", e.target.value)
                }
              />
              <InputField
                label="Tapa"
                value={s.cap}
                onChange={(e) =>
                  handleFixedSpecChange(index, "cap", e.target.value)
                }
              />
              <InputField
                label="Salida"
                value={s.outlet}
                onChange={(e) =>
                  handleFixedSpecChange(index, "outlet", e.target.value)
                }
              />
              <InputField
                label="Precisión"
                value={s.accuracy}
                onChange={(e) =>
                  handleFixedSpecChange(index, "accuracy", e.target.value)
                }
              />
            </div>
            <Button
              variant="ghost"
              onClick={() => handleRemoveFixedSpec()}
              className="text-red-500 hover:text-red-600 border"
            >
              Eliminar especificaciones
            </Button>
            {/* <InputField
              label="Adicionales"
              value={s.additional_specs}
              onChange={(e) =>
                handleFixedSpecChange(index, "additional_specs", e.target.value)
              }
            /> */}
          </div>
        ))}
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
                className="w-32 h-32 object-cover rounded-lg border-2 border-gray-100"
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
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={handleSave}
            disabled={!isSaveEnabled}
          >
            Guardar
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ModalProduct;
