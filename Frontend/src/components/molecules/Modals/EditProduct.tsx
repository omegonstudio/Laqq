import { useEffect, useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import {
  Attachment,
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
  CreateProduct,
} from "@/utils/productSaveFlow";
import { deleteFixedSpec } from "@/store/fixedSpecsSlice";
import { attachmentsApi } from "@/lib/api/attachments";
import { Toggle } from "@/components/ui/toggle";
import { refreshProductEverywhere } from "@/store/productSlice";
import { toast } from "@/hooks/use-toast";
import { productsApi } from "@/lib/api/products";

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
  // Cambia la definición del estado para incluir tipo y metadata
  const [carrouselPreview, setCarrouselPreview] = useState<Array<{
    url: string;
    type: "existing" | "new";
    id?: string; // Para imágenes existentes, guardamos el ID
    file?: File; // Para imágenes nuevas, guardamos el archivo
  }> | null>(null);

  const [selectedRelated, setSelectedRelated] = useState<string>("");
  const [carrouselDeleteIds, setCarrouselDeleteIds] = useState<string[]>([]);
  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (!isNew && initialData) {
      // Convertir Product a ProductFormState
      const formState = productToFormState(initialData);
      setLocalState({
        ...formState,
        attachments_existing: (initialData.attachments ?? []).map((att) => ({
          ...att,
          role: att.role as Attachment["role"],
        })),

        attachments_files: [],
      });
      // Si hay imagen, cargar preview (asumiendo que es UUID)
      if (initialData.image_url) {
        setImagePreview(initialData.image_url);
      }
      if (initialData.attachments !== null) {
        setCarrouselPreview(
          initialData.attachments?.map((att) => ({
            url: att.url,
            type: "existing",
            id: att.id,
          })) || null
        );
      }
      setCarrouselDeleteIds([]);
    } else {
      setLocalState({
        ...getEmptyProductFormState(),
      });
      setCarrouselPreview(null);
      setImagePreview(null);
      setCarrouselDeleteIds([]);
    }
  }, [initialData, isNew]);

  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setSelectedRelated("");
      setCarrouselDeleteIds([]); // ← Limpiar eliminaciones pendientes

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
  // useEffect(() => {
  // }, [initialData, localState]);

  const haveAttachmentsChanged = (
    existing: Attachment[] = [], // Attachments existentes actuales (después de eliminaciones)
    initial: Attachment[] = [], // Attachments originales de la BD
    newFiles: File[] = [] // Archivos nuevos agregados
  ): boolean => {
    // 1. Verificar si se eliminaron attachments
    const initialIds = initial.map((a) => a.id).sort();
    const currentIds = existing.map((a) => a.id).sort();

    const removed = JSON.stringify(initialIds) !== JSON.stringify(currentIds);
    if (removed) {
      return true;
    }

    // 2. Verificar si se agregaron archivos nuevos
    const added = newFiles.length > 0;
    if (added) {
      return true;
    }
    // 3. Verificar si hay IDs en carrouselDeleteIds (por si acaso)
    const hasPendingDeletions = carrouselDeleteIds.length > 0;
    if (hasPendingDeletions) {
      return true;
    }
    return false;
  };

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

    const attachmentsChanged = haveAttachmentsChanged(
      localState.attachments_existing ?? [], // Attachments existentes actuales
      initialData.attachments ?? [], // Attachments originales
      localState.attachments_files ?? [] // Archivos nuevos
    );
    return (
      productChanged ||
      specsChanged ||
      fixedSpecsChanged ||
      imageChanged ||
      attachmentsChanged
    );
  }, [localState, initialData, carrouselDeleteIds]);

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

      let product: Product;

      if (isNew) {
        // ========== CREAR PRODUCTO ==========
        try {
          let attachmentId: string | null = localState.image_attachment_id;

          // Subir imagen principal si existe
          if (currentImage) {
            const attachment = await attachmentsApi.create({
              file: currentImage,
              role: "image",
              attachable_type: "product",
            });
            attachmentId = attachment.id;
          }

          // Crear producto
          product = await CreateProduct({
            dispatch,
            formState: {
              ...localState,
              specs: cleanedSpecs,
            },
            attachmentId: attachmentId,
          });

          // Subir imágenes del carrusel (si las hay)
          if (carrouselPreview?.length > 0) {
            const newImages = carrouselPreview.filter(
              (item) => item.type === "new"
            );

            if (newImages.length > 0) {
              try {
                const formData = new FormData();
                newImages.forEach((item) => {
                  if (item.file) {
                    formData.append("files", item.file);
                  }
                });
                formData.append("role", "image");

                await productsApi.uploadAttachments(product.id, formData);
              } catch (carruselError) {
                // Error al subir imágenes del carrusel - NO impide cerrar el modal
                console.error(
                  "Error subiendo imágenes del carrusel:",
                  carruselError
                );
                toast({
                  title:
                    "Producto creado pero hubo un error al subir algunas imágenes",
                  variant: "destructive", // Asumiendo que tienes variante warning
                });
              }
            }
          }

          // Sincronizar especificaciones
          try {
            await syncProductSpecifications({
              dispatch,
              productId: product.id,
              nextSpecs: cleanedSpecs,
              initialSpecs: initialData?.specs || [],
            });
          } catch (specsError) {
            console.error("Error sincronizando especificaciones:", specsError);
            toast({
              title:
                "Producto creado pero hubo un error con las especificaciones",
              variant: "destructive",
            });
          }

          // Sincronizar fixed specs
          try {
            if (
              localState.fixed_specs.length === 0 &&
              product.fixed_specs?.[0]?.id
            ) {
              await dispatch(
                deleteFixedSpec(product.fixed_specs[0].id)
              ).unwrap();
            } else {
              await syncProductFixedSpecifications({
                dispatch,
                productId: product.id,
                nextSpecs: cleanedFixedSpecs,
                initialSpecs: initialData?.fixed_specs || [],
              });
            }
          } catch (fixedSpecsError) {
            console.error("Error sincronizando fixed specs:", fixedSpecsError);
            toast({
              title:
                "Producto creado pero hubo un error con las especificaciones fijas",
              variant: "destructive",
            });
          }

          // Refrescar datos
          dispatch(refreshProductEverywhere(product.id));
          toast({ title: "Producto creado exitosamente" });
        } catch (createError) {
          // Error CRÍTICO: No se pudo crear el producto
          console.error("Error creando producto:", createError);
          toast({
            title:
              createError instanceof Error
                ? createError.message
                : "Error al crear el producto",
            variant: "destructive",
          });
          return; // No cerramos el modal
        }
      } else {
        // ========== EDITAR PRODUCTO ==========
        if (!initialData) {
          toast({
            title: "No se encontraron datos del producto a editar",
            variant: "destructive",
          });
          return;
        }

        try {
          let attachmentId: string | null | undefined =
            localState.image_attachment_id;

          // 1. GESTIÓN DE CARRUSEL (operaciones no críticas)
          try {
            // Subir nuevas imágenes del carrusel
            if (carrouselPreview?.length > 0) {
              const newImages = carrouselPreview.filter(
                (item) => item.type === "new"
              );

              if (newImages.length > 0) {
                const formData = new FormData();
                newImages.forEach((item) => {
                  if (item.file) {
                    formData.append("files", item.file);
                  }
                });
                formData.append("role", "image");

                await productsApi.uploadAttachments(initialData.id, formData);
              }
            }

            // Eliminar imágenes del carrusel
            if (carrouselDeleteIds.length > 0) {
              await Promise.all(
                carrouselDeleteIds.map(async (item) => {
                  try {
                    await attachmentsApi.remove(item);
                  } catch (deleteError) {
                    console.error(
                      `Error eliminando attachment ${item}:`,
                      deleteError
                    );
                    // Continuamos con las demás eliminaciones
                  }
                })
              );
            }
          } catch (carruselError) {
            console.error("Error en operaciones de carrusel:", carruselError);
            toast({
              title:
                "Hubo un problema con las imágenes del carrusel, pero continuamos",
              variant: "destructive",
            });
          }

          // 2. GESTIÓN DE IMAGEN PRINCIPAL
          try {
            const userRemovedPortada =
              initialImage && !currentImage && !localState.image_attachment_id;

            if (userRemovedPortada) {
              await attachmentsApi.remove(initialImage);
              attachmentId = null;
            } else if (!initialImage && currentImage) {
              const attachment = await attachmentsApi.create({
                file: currentImage,
                role: "image",
                attachable_type: "product",
              });
              attachmentId = attachment.id;
            } else if (initialImage && currentImage) {
              const attachment = await attachmentsApi.update(initialImage, {
                file: currentImage,
                role: "image",
              });
              attachmentId = attachment.id;
            }
          } catch (imageError) {
            console.error("Error gestionando imagen principal:", imageError);
            toast({
              title: "Error al actualizar la imagen principal",
              variant: "destructive",
            });
            // Continuamos con attachmentId original
          }

          // 3. ACTUALIZAR PRODUCTO (operación crítica)
          const updatedFormState = {
            ...localState,
            specs: cleanedSpecs,
          };

          product = await saveProductEntity({
            dispatch,
            formState: updatedFormState,
            initialData: initialData,
            attachmentId: attachmentId,
          });

          // 4. Sincronizar especificaciones (operaciones secundarias)
          try {
            await syncProductSpecifications({
              dispatch,
              productId: product.id,
              nextSpecs: cleanedSpecs,
              initialSpecs: initialData.specs,
            });
          } catch (specsError) {
            console.error("Error sincronizando especificaciones:", specsError);
            toast({
              title:
                "Producto actualizado pero hubo un error con las especificaciones",
              variant: "destructive",
            });
          }

          try {
            await syncProductFixedSpecifications({
              dispatch,
              productId: product.id,
              nextSpecs: cleanedFixedSpecs,
              initialSpecs: initialData.fixed_specs,
            });
          } catch (fixedSpecsError) {
            console.error("Error sincronizando fixed specs:", fixedSpecsError);
            toast({
              title:
                "Producto actualizado pero hubo un error con las especificaciones fijas",
              variant: "destructive",
            });
          }

          // Refrescar datos
          dispatch(refreshProductEverywhere(initialData.id));
          toast({ title: "Producto actualizado exitosamente" });
        } catch (updateError) {
          // Error CRÍTICO: No se pudo actualizar el producto
          console.error("Error actualizando producto:", updateError);
          toast({
            title:
              updateError instanceof Error
                ? updateError.message
                : "Error al actualizar el producto",
            variant: "destructive",
          });
          return; // No cerramos el modal
        }
      }

      // ✅ CERRAR MODAL SOLO SI TODO SALIÓ BIEN (o al menos el producto se creó/actualizó)
      onClose();
    } catch (error: unknown) {
      // Error inesperado (catch general)
      console.error("Error inesperado:", error);
      toast({
        title:
          error instanceof Error
            ? error.message
            : "Error inesperado al guardar",
        variant: "destructive",
      });
      // No cerramos el modal en caso de error inesperado
    }
  };
  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      const reader = new FileReader();

      reader.onloadend = () => {
        const base64String = reader.result as string;
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

  const handleCarouselFile = (file: File | null) => {
    if (!file) return;

    const reader = new FileReader();

    reader.onloadend = () => {
      const base64 = reader.result as string;

      setLocalState((prev) => ({
        ...prev,
        attachments_files: [...(prev.attachments_files || []), file],
      }));

      setCarrouselPreview((prev) =>
        prev
          ? [...prev, { url: base64, type: "new", file }]
          : [{ url: base64, type: "new", file }]
      );
    };

    reader.readAsDataURL(file);
  };
  const handleRemoveImage = () => {
    setLocalState({
      ...localState,
      image_file: null,
      image_attachment_id: null,
    });
    setImagePreview(null);
  };
  const handleRemoveCarouselItem = (index: number) => {
    // Obtener el item a eliminar
    const itemToRemove = carrouselPreview?.[index];

    if (itemToRemove?.type === "existing" && itemToRemove.id) {
      // Si es una imagen existente, agregar su ID a carrouselDeleteIds
      setCarrouselDeleteIds((prev) => [...prev, itemToRemove.id!]);

      // IMPORTANTE: Actualizar attachments_existing para eliminar esta imagen
      setLocalState((prev) => ({
        ...prev,
        attachments_existing:
          prev.attachments_existing?.filter(
            (att) => att.id !== itemToRemove.id
          ) || [],
      }));
    }

    setLocalState((prev) => ({
      ...prev,
      attachments_files:
        itemToRemove?.type === "new"
          ? prev.attachments_files?.filter((_, i) => {
              const newFilesCount =
                carrouselPreview?.filter((item) => item.type === "new")
                  .length || 0;
              const newFilesIndex =
                carrouselPreview
                  ?.slice(0, index)
                  .filter((item) => item.type === "new").length || 0;

              return i !== newFilesIndex;
            })
          : prev.attachments_files,
    }));

    setCarrouselPreview((prev) =>
      prev ? prev.filter((_, i) => i !== index) : null
    );
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
        <br></br>
        {/* ✅ Upload de imagen con preview */}
        <div className="grid grid-cols-2 gap-20">
          <div>
            <span className="mb-2 block text-lg font-medium">
              Imágen de portada
            </span>
            <UploadFile onFileChange={handleFile} />
            {imagePreview && (
              <div className="relative inline-block mt-2 w-32 h-32">
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
          <div>
            <span className="mb-2 block text-lg font-medium">
              Carrousel de archivos
            </span>
            <UploadFile onFileChange={handleCarouselFile} />
            <div className="grid grid-cols-3 gap-2">
              {carrouselPreview?.map((item, index) => (
                <div
                  key={item.type === "existing" ? item.id : index}
                  className="relative inline-block mt-2 w-32 h-32"
                >
                  <img
                    src={item.url}
                    alt="Preview"
                    className="w-32 h-32 object-cover rounded-lg border-2 border-gray-100"
                  />
                  {/* Opcional: Mostrar un indicador del tipo de imagen */}
                  {item.type === "existing" && (
                    <span className="absolute top-0 left-0 bg-blue-500 text-white text-xs px-1 rounded">
                      DB
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveCarouselItem(index)}
                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
          {/* Preview de la imagen */}
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
