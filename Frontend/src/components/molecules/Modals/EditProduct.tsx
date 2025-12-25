import { useEffect, useState } from "react";
import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import {
  Product,
  ProductFormState,
  ProductSpec,
  ProductUpdateRequest,
} from "@/types/types";
import Select from "@/components/atoms/Select";
import UploadFile from "@/components/atoms/UploadFile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { createProduct, updateProduct } from "@/store/productSlice";
import Modal from "@/components/common/Modal";
import { createSpec, updateSpect } from "@/store/specsSlice";
import { createAttachment } from "@/utils/fileConvert";
import {
  productToFormState,
  formStateToCreateRequest,
  formStateToUpdateRequest,
  getEmptyProductFormState,
} from "@/utils/productConverters";
import { toast } from "sonner";
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
  const [active, setActive] = useState(initialData.is_active);
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
      setLocalState(initialData);

      // Si hay imagen, cargar preview (asumiendo que es UUID)
      if (initialData.image_attachment) {
        // Aquí podrías cargar la imagen desde el backend si es necesario
        // Por ahora, si es un UUID no tenemos la imagen para preview
        setImagePreview(null);
      }
    } else {
      setLocalState(getEmptyProductFormState());
      setImagePreview(null);
    }
  }, [initialData]);

  useEffect(() => {
    setLocalState(initialData);
  }, [onClose]);

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
      const isSpecEmpty = (spec: ProductSpec) => {
        return (
          !spec.volume?.trim() &&
          !spec.code?.trim() &&
          !spec.dimensions?.trim() &&
          !spec.cap?.trim() &&
          !spec.outlet?.trim() &&
          !spec.accuracy?.trim() &&
          !spec.precision?.trim() &&
          !spec.additional_specs?.trim()
        );
      };

      // Filtrar solo specs que tengan al menos un campo con valor
      const validSpecs =
        localState.specs?.filter((spec) => !isSpecEmpty(spec)) || [];

      if (localState.id) {
        // ========== EDITAR PRODUCTO EXISTENTE ==========

        let attachmentId: string | null | undefined = undefined;

        // Manejar imagen
        if (localState.image_attachment instanceof File) {
          console.log("📤 Subiendo nueva imagen...");
          try {
            const attachment = await createAttachment(
              localState.image_attachment
            );
            attachmentId = attachment.id;
            console.log("✅ Imagen subida:", attachmentId);
          } catch (error) {
            toast.error("Error al subir la imagen");
            throw error;
          }
        } else if (
          typeof localState.image_attachment === "string" &&
          localState.image_attachment !== initialData.image_attachment
        ) {
          // Si cambió el UUID
          attachmentId = localState.image_attachment;
        } else if (
          localState.image_attachment === null &&
          initialData.image_attachment !== null
        ) {
          // Si se eliminó la imagen
          attachmentId = null;
        }

        // Convertir formState a updateRequest
        const updateRequest: ProductUpdateRequest = formStateToUpdateRequest(
          localState,
          initialData,
          attachmentId
        );

        console.log("📤 UPDATE REQUEST:", updateRequest);

        // Actualizar producto
        const updatedProduct = await dispatch(
          updateProduct({
            id: localState.id,
            data: updateRequest,
          })
        ).unwrap();

        console.log("✅ Producto actualizado:", updatedProduct);

        // ============================================
        // PROCESAR SPECS (solo si hay válidas)
        // ============================================
        if (validSpecs.length > 0) {
          const specIds: string[] = [];

          for (const spec of validSpecs) {
            try {
              if (spec.id) {
                // Actualizar spec existente
                const updatedSpec = await dispatch(
                  updateSpect({
                    id: spec.id,
                    data: {
                      ...spec,
                      product: updatedProduct.id,
                    },
                  })
                ).unwrap();
                specIds.push(updatedSpec.id);
              } else {
                // Crear nuevo spec
                const newSpec = await dispatch(
                  createSpec({
                    ...spec,
                    product: updatedProduct.id,
                  })
                ).unwrap();
                specIds.push(newSpec.id);
              }
            } catch (error) {
              console.error("Error procesando spec:", error);
              toast.error("Error al guardar especificaciones");
              throw error;
            }
          }

          // Actualizar producto con specs
          await dispatch(
            updateProduct({
              id: localState.id,
              data: {
                specs: specIds,
              },
            })
          ).unwrap();

          console.log("✅ Specs actualizadas:", specIds);
        }

        toast.success("Producto actualizado exitosamente");
        console.log("✅ Producto y specs actualizados");
      } else {
        // ========== CREAR NUEVO PRODUCTO ==========

        let attachmentId: string | null = null;

        // Si hay archivo, subirlo primero
        if (localState.image_attachment instanceof File) {
          console.log("📤 Subiendo imagen...");
          try {
            const attachment = await createAttachment(
              localState.image_attachment
            );
            attachmentId = attachment.id;
            console.log("✅ Imagen subida:", attachmentId);
          } catch (error) {
            toast.error("Error al subir la imagen");
            throw error;
          }
        }

        // Convertir formState a createRequest
        const createRequest = formStateToCreateRequest(
          localState,
          attachmentId
        );

        console.log("📤 CREATE REQUEST:", createRequest);

        // Crear producto
        const createdProduct = await dispatch(
          createProduct(createRequest)
        ).unwrap();

        console.log("✅ Producto creado:", createdProduct);

        // ============================================
        // CREAR SPECS (solo si hay válidas)
        // ============================================
        if (validSpecs.length > 0) {
          const specIds: string[] = [];

          for (const spec of validSpecs) {
            try {
              const newSpec = await dispatch(
                createSpec({
                  ...spec,
                  product: createdProduct.id,
                })
              ).unwrap();
              specIds.push(newSpec.id);
            } catch (error) {
              console.error("Error creando spec:", error);
              toast.error("Error al crear especificaciones");
              throw error;
            }
          }

          // Actualizar producto con specs
          await dispatch(
            updateProduct({
              id: createdProduct.id,
              data: {
                specs: specIds,
              },
            })
          ).unwrap();

          console.log("✅ Specs creadas y vinculadas:", specIds);
        }

        toast.success("Producto creado exitosamente");
        console.log("✅ Producto y specs creados exitosamente");
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
    value: string
  ) => {
    const updatedSpecs = localState.specs.map((spec, i) => {
      if (i === index) {
        return { ...spec, [field]: value };
      }
      return spec;
    });

    setLocalState({ ...localState, specs: updatedSpecs });
  };

  // Filtrar productos disponibles
  const availableProducts = products.filter((prod) => {
    if (localState.id && prod.id === localState.id) return false;
    const currentRelated = localState.related || [];
    return !currentRelated.some((rel) => rel.id === prod.id);
  });
  console.log(localState, "LOCAL STATE");
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
        {localState.specs.map((s, index) => (
          <div key={s.id || index}>
            <div className="grid grid-cols-3 gap-2">
              <InputField
                label="Volumen"
                value={s.volume}
                onChange={(e) =>
                  handleSpecChange(index, "volume", e.target.value)
                }
              />
              <InputField
                label="Código"
                value={s.code}
                onChange={(e) =>
                  handleSpecChange(index, "code", e.target.value)
                }
              />
              <InputField
                label="Dimensiones"
                value={s.dimensions}
                onChange={(e) =>
                  handleSpecChange(index, "dimensions", e.target.value)
                }
              />
              <InputField
                label="Tapa"
                value={s.cap}
                onChange={(e) => handleSpecChange(index, "cap", e.target.value)}
              />
              <InputField
                label="Salida"
                value={s.outlet}
                onChange={(e) =>
                  handleSpecChange(index, "outlet", e.target.value)
                }
              />
              <InputField
                label="Precisión"
                value={s.accuracy}
                onChange={(e) =>
                  handleSpecChange(index, "accuracy", e.target.value)
                }
              />
            </div>
            <InputField
              label="Adicionales"
              value={s.additional_specs}
              onChange={(e) =>
                handleSpecChange(index, "additional_specs", e.target.value)
              }
            />
          </div>
        ))}
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
