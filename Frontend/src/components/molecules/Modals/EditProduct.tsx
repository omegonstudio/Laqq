import { useEffect, useMemo, useState } from "react";
import Button from "@/components/atoms/Button";
import InputField from "@/components/atoms/InputField";
import { Attachment, Product, ProductFormState, SedronarOption } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import UploadFile from "@/components/atoms/UploadFile";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import Modal from "@/components/common/Modal";
import {
  productToFormState,
  getEmptyProductFormState,
  formStateToUpdateRequest,
  hasProductChanges,
} from "@/utils/productConverters";
import { isCategoryUnderConsumibles } from "@/utils/data/categories";
import {
  validateProductForm,
  CreateProduct,
  saveProductEntity,
  syncVariants,
  normalizeVariants,
} from "@/utils/productSaveFlow";
import { attachmentsApi } from "@/lib/api/attachments";
import { Toggle } from "@/components/ui/toggle";
import { refreshProductEverywhere } from "@/store/productSlice";
import { toast } from "@/hooks/use-toast";
import { productsApi } from "@/lib/api/products";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ProductVariantsTable from "@/components/molecules/ProductVariantsTable";
import ProductSpecTableEditor from "@/components/molecules/ProductSpecTableEditor";
import type { Variants } from "@/components/molecules/ProductVariantsTable";
import DescriptionEditor from "@/components/atoms/DescriptionProductEditor";
import { CascadeCategorySelect } from "@/components/atoms/FlatCategories";
import { Label } from "@/components/ui/label";

const SEDRONAR_OPTIONS: SedronarOption[] = [
  "-",
  "Lista 1",
  "Lista 2",
  "Lista 3",
  "Lista 4",
];

const manageProductAttachment = async (
  initialId: string | null | undefined,
  currentFile: File | null,
  currentAttachmentId: string | null | undefined,
  role: Attachment["role"]
): Promise<string | null | undefined> => {
  const userRemoved = initialId && !currentFile && !currentAttachmentId;
  if (userRemoved) {
    await attachmentsApi.remove(initialId);
    return null;
  }
  if (!initialId && currentFile) {
    const attachment = await attachmentsApi.create({
      file: currentFile,
      role,
      attachable_type: "product",
    });
    return attachment.id;
  }
  if (initialId && currentFile) {
    const attachment = await attachmentsApi.update(initialId, {
      file: currentFile,
      role,
    });
    return attachment.id;
  }
  return undefined;
};

interface ModalProductProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Product | null;
  isNew: boolean;
}

const parseApiError = (error: unknown): string => {
  if (!error) return "Error desconocido";

  // Si ya es un string legible
  if (typeof error === "string") return error;

  // Si es un Error de JS
  if (error instanceof Error) {
    // Intentar parsear el mensaje como JSON (algunos interceptores lo serializan)
    try {
      const parsed = JSON.parse(error.message);
      return parseApiError(parsed);
    } catch {
      return error.message;
    }
  }

  // Si es un objeto (respuesta JSON del backend)
  if (typeof error === "object") {
    const obj = error as Record<string, unknown>;

    // Campos con mensajes directos de DRF
    const priorityFields = ["detail", "non_field_errors", "message"];
    for (const field of priorityFields) {
      if (obj[field]) {
        const val = obj[field];
        if (Array.isArray(val)) return val[0] as string;
        if (typeof val === "string") return val;
      }
    }

    // Errores de campos específicos: { brand_id: ["Brand is required..."] }
    const fieldMessages: string[] = [];
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        fieldMessages.push(`${key}: ${val[0]}`);
      } else if (typeof val === "string") {
        fieldMessages.push(`${key}: ${val}`);
      }
    }
    if (fieldMessages.length > 0) return fieldMessages.join(" | ");
  }

  return "Error inesperado al guardar";
};

const ModalProduct: React.FC<ModalProductProps> = ({
  isOpen,
  onClose,
  initialData,
  isNew,
}) => {
  const dispatch = useAppDispatch();
  const { list: products } = useAppSelector((state) => state.products);
  const { list: brands } = useAppSelector((state) => state.brands);
  const { list: categories } = useAppSelector((state) => state.categories);

  const [localState, setLocalState] = useState<ProductFormState>(
    getEmptyProductFormState()
  );
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [espPreview, setEspPreview] = useState<string | null>(null);
  const [hdsPreview, setHdsPreview] = useState<string | null>(null);
  const [carrouselPreview, setCarrouselPreview] = useState<Array<{
    url: string;
    type: "existing" | "new";
    id?: string;
    file?: File;
    fileType?: string;
  }> | null>(null);

  const [selectedRelated, setSelectedRelated] = useState<string>("");
  const [carrouselDeleteIds, setCarrouselDeleteIds] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("general");
  const [disabled, setDisabled] = useState<boolean>(false);
  const handleVariantsChange = (vars: Variants[]) => {
    setLocalState((prev) => ({
      ...prev,
      variants: vars,
    }));
  };
  const handleSpecTableChange = (spec_table: ProductFormState["spec_table"]) => {
    setLocalState((prev) => ({
      ...prev,
      spec_table,
    }));
  };

  // ============================================
  // EFFECTS
  // ============================================
  useEffect(() => {
    if (!isNew && initialData) {
      const formState = productToFormState(initialData);

      setLocalState({
        ...formState,
        variants: initialData.variants ?? [],
        attachments_existing: (initialData.attachments ?? []).map((att) => ({
          ...att,
          role: att.role as Attachment["role"],
        })),
        attachments_files: [],
      });
      setCarrouselPreview(
        (initialData.attachments ?? []).map((att) => ({
          url: att.url || att.file,
          type: "existing" as const,
          id: att.id,
          fileType: att.content_type_str,
        }))
      );
      setImagePreview(initialData.image_url);
      setEspPreview(initialData.esp_url ?? null);
      setHdsPreview(initialData.hds_url ?? null);
    } else {
      setLocalState({
        ...getEmptyProductFormState(),
        variants: [],
      });
      setCarrouselPreview(null);
      setEspPreview(null);
      setHdsPreview(null);
    }
  }, [initialData, isNew]);
  useEffect(() => {
    if (!isOpen) {
      setImagePreview(null);
      setEspPreview(null);
      setHdsPreview(null);
      setSelectedRelated("");
      setCarrouselDeleteIds([]);
      setActiveTab("general");

      if (initialData) {
        const formState = productToFormState(initialData);
        setLocalState(formState);
      } else {
        setLocalState({
          ...getEmptyProductFormState(),
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
    () =>
      validateProductForm(localState, {
        skipBrandAndCategory: !localState.is_active,
      }),
    [localState]
  );

  const isConsumiblesCategory = useMemo(
    () =>
      localState.category
        ? isCategoryUnderConsumibles(localState.category, categories)
        : false,
    [localState.category, categories]
  );
  // useEffect(() => {
  // }, [initialData, localState]);

  const haveAttachmentsChanged = (
    existing: Attachment[] = [],
    initial: Attachment[] = [],
    newFiles: File[] = []
  ): boolean => {
    const initialIds = initial.map((a) => a.id).sort();
    const currentIds = existing.map((a) => a.id).sort();
    const removed = JSON.stringify(initialIds) !== JSON.stringify(currentIds);
    if (removed) return true;
    if (newFiles.length > 0) return true;
    if (carrouselDeleteIds.length > 0) return true;
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

    const imageChanged =
      localState.image_file !== null ||
      localState.image_attachment_id !== initialData.image_attachment;

    const attachmentsChanged = haveAttachmentsChanged(
      localState.attachments_existing ?? [],
      initialData.attachments ?? [],
      localState.attachments_files ?? []
    );

    const variantsChanged =
      JSON.stringify(normalizeVariants(localState.variants || [])) !==
      JSON.stringify(normalizeVariants(initialData?.variants || []));

    const insumoFieldsChanged =
      localState.articulo !== (initialData.articulo ?? "") ||
      localState.cas !== (initialData.cas ?? "") ||
      localState.sedronar !== (initialData.sedronar ?? "-");

    const espChanged =
      localState.esp_file !== null ||
      localState.esp_attachment_id !==
        (initialData.esp_attachment_id ?? null);

    const hdsChanged =
      localState.hds_file !== null ||
      localState.hds_attachment_id !==
        (initialData.hds_attachment_id ?? null);

    return (
      productChanged ||
      imageChanged ||
      attachmentsChanged ||
      variantsChanged ||
      insumoFieldsChanged ||
      espChanged ||
      hdsChanged
    );
  }, [localState, initialData, carrouselDeleteIds]);

  useEffect(() => {
    setDisabled(validation.isValid && (!initialData || hasChanges));
  }, [validation.isValid, initialData, hasChanges]);

  const handleSave = async () => {
    setDisabled(false);
    try {
      const initialImage = initialData?.image_attachment ?? null;
      const currentImage = localState.image_file ?? null;

      if (!validation.isValid) {
        toast({
          title: validation.errorMessage || "Formulario inválido",
          variant: "destructive",
        });
        return;
      }

      if (isConsumiblesCategory) {
        if (!localState.articulo?.trim()) {
          toast({
            title: "El campo Artículo es obligatorio para Consumibles",
            variant: "destructive",
          });
          return;
        }
        if (!localState.cas?.trim()) {
          toast({
            title: "El campo CAS es obligatorio para Consumibles",
            variant: "destructive",
          });
          return;
        }
      }

      let product: Product;

      if (isNew) {
        // ========== CREAR PRODUCTO ==========
        try {
          let attachmentId: string | null = localState.image_attachment_id;

          if (currentImage) {
            const attachment = await attachmentsApi.create({
              file: currentImage,
              role: "image",
              attachable_type: "product",
            });
            attachmentId = attachment.id;
          }

          let espAttachmentId: string | null | undefined =
            localState.esp_attachment_id;
          if (localState.esp_file) {
            const attachment = await attachmentsApi.create({
              file: localState.esp_file,
              role: "datasheet",
              attachable_type: "product",
            });
            espAttachmentId = attachment.id;
          }

          let hdsAttachmentId: string | null | undefined =
            localState.hds_attachment_id;
          if (localState.hds_file) {
            const attachment = await attachmentsApi.create({
              file: localState.hds_file,
              role: "manual",
              attachable_type: "product",
            });
            hdsAttachmentId = attachment.id;
          }

          product = await CreateProduct({
            dispatch,
            formState: {
              ...localState,
            },
            attachmentId: attachmentId,
            espAttachmentId,
            hdsAttachmentId,
          });
          const variantsToCreate = (localState.variants || []).filter((v) =>
            v.code?.trim()
          );
          if (variantsToCreate.length > 0) {
            await Promise.all(
              variantsToCreate.map((v) =>
                productsApi.createVariants({
                  ...v,
                  product: product.id,
                })
              )
            );
          }
          if (carrouselPreview?.length > 0) {
            const newImages = carrouselPreview.filter(
              (item) => item.type === "new"
            );
            if (newImages.length > 0) {
              try {
                const formData = new FormData();
                newImages.forEach((item) => {
                  if (item.file) formData.append("files", item.file);
                });
                formData.append("role", "image");
                await productsApi.uploadAttachments(product.id, formData);
              } catch (carruselError) {
                console.error(
                  "Error subiendo imágenes del carrusel:",
                  carruselError
                );
                toast({
                  title:
                    "Producto creado pero hubo un error al subir algunas imágenes",
                  variant: "destructive",
                });
              }
            }
          }

          dispatch(refreshProductEverywhere(product.id));
          toast({ title: "Producto creado exitosamente" });
        } catch (createError) {
          console.error("Error creando producto:", createError);
          toast({
            title: parseApiError(createError),
            variant: "destructive",
          });
          return;
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

          // 1. GESTIÓN DE CARRUSEL
          try {
            if (carrouselPreview?.length > 0) {
              const newImages = carrouselPreview.filter(
                (item) => item.type === "new"
              );
              if (newImages.length > 0) {
                const formData = new FormData();
                newImages.forEach((item) => {
                  if (item.file) formData.append("files", item.file);
                });
                formData.append("role", "image");
                await productsApi.uploadAttachments(initialData.id, formData);
              }
            }

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
          }

          // 2b. GESTIÓN DE ESP / HDS
          let espAttachmentId: string | null | undefined;
          let hdsAttachmentId: string | null | undefined;
          try {
            espAttachmentId = await manageProductAttachment(
              initialData.esp_attachment_id,
              localState.esp_file,
              localState.esp_attachment_id,
              "datasheet"
            );
            hdsAttachmentId = await manageProductAttachment(
              initialData.hds_attachment_id,
              localState.hds_file,
              localState.hds_attachment_id,
              "manual"
            );
          } catch (insumoFileError) {
            console.error("Error gestionando documentos de insumo:", insumoFileError);
            toast({
              title: "Error al actualizar documentación del insumo",
              variant: "destructive",
            });
          }

          // 3. ACTUALIZAR PRODUCTO
          const updatedFormState = { ...localState };

          product = await saveProductEntity({
            dispatch,
            formState: updatedFormState,
            initialData: initialData,
            attachmentId: attachmentId,
            espAttachmentId,
            hdsAttachmentId,
          });
          await syncVariants(
            initialData.id,
            localState.variants || [],
            initialData.variants || []
          );
          // 4. Sincronizar specs

          dispatch(refreshProductEverywhere(initialData.id));
          toast({ title: "Producto actualizado exitosamente" });
        } catch (updateError) {
          console.error("Error actualizando producto:", updateError);
          toast({
            title: parseApiError(updateError),
            variant: "destructive",
          });
          return;
        }
      }

      onClose();
      setDisabled(true);
    } catch (error: unknown) {
      console.error("Error inesperado:", error);
      toast({
        title: parseApiError(error),
        variant: "destructive",
      });
    }
  };
  const handleFile = (selectedFile: File | null) => {
    if (selectedFile) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        setLocalState({ ...localState, image_file: selectedFile });
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
          ? [...prev, { url: base64, type: "new", file, fileType: file.type }]
          : [{ url: base64, type: "new", file, fileType: file.type }]
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

  const handleInsumoFile = (
    selectedFile: File | null,
    field: "esp_file" | "hds_file",
    setPreview: (url: string | null) => void
  ) => {
    if (selectedFile) {
      setLocalState((prev) => ({ ...prev, [field]: selectedFile }));
      setPreview(URL.createObjectURL(selectedFile));
    } else {
      setLocalState((prev) => ({ ...prev, [field]: null }));
      setPreview(null);
    }
  };

  const handleRemoveInsumoFile = (
    fileField: "esp_file" | "hds_file",
    attachmentField: "esp_attachment_id" | "hds_attachment_id",
    setPreview: (url: string | null) => void
  ) => {
    setLocalState((prev) => ({
      ...prev,
      [fileField]: null,
      [attachmentField]: null,
    }));
    setPreview(null);
  };

  const renderDocumentPreview = (
    preview: string | null,
    label: string,
    onRemove: () => void
  ) => {
    if (!preview) return null;
    const isPdf =
      preview.toLowerCase().endsWith(".pdf") ||
      preview.startsWith("blob:") ||
      preview.includes("application/pdf");

    return (
      <div className="relative inline-block mt-2">
        {isPdf ? (
          <div className="flex items-center justify-center w-32 h-32 rounded-lg border bg-gray-100 text-sm font-medium text-gray-500">
            PDF
          </div>
        ) : (
          <img
            src={preview}
            alt={label}
            className="w-32 h-32 object-cover rounded-lg border-2 border-gray-100"
          />
        )}
        <a
          href={preview}
          target="_blank"
          rel="noopener noreferrer"
          className="block text-xs text-primary mt-1 truncate max-w-32"
        >
          Ver archivo
        </a>
        <button
          type="button"
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-red-600 transition-colors"
          title="Eliminar archivo"
        >
          ×
        </button>
      </div>
    );
  };

  const handleRemoveCarouselItem = (index: number) => {
    const itemToRemove = carrouselPreview?.[index];

    if (itemToRemove?.type === "existing" && itemToRemove.id) {
      setCarrouselDeleteIds((prev) => [...prev, itemToRemove.id!]);
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

  const handleCategoryChange = (e: string) => {
    setLocalState({ ...localState, category: e });
  };

  const handleRelatedChange = (selectedId: string) => {
    if (!selectedId) return;
    const currentRelated = localState.related || [];
    const alreadyExists = currentRelated.some((rel) => rel.id === selectedId);
    if (alreadyExists) {
      setSelectedRelated("");
      return;
    }
    const selectedProduct = products.find((p) => p.id === selectedId);
    if (!selectedProduct) return;
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
    setSelectedRelated("");
  };

  const handleRemoveRelated = (relatedId: string) => {
    setLocalState({
      ...localState,
      related: (localState.related || []).filter((rel) => rel.id !== relatedId),
    });
  };

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
    >
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="general" className="flex-1">
            General
          </TabsTrigger>
          <TabsTrigger value="especificaciones" className="flex-1">
            Especificaciones
          </TabsTrigger>
          <TabsTrigger value="variedades" className="flex-1">
            Tabla de Variedades
          </TabsTrigger>
        </TabsList>

        {/* Tab: General (contenido original) */}
        <TabsContent value="general">
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
                    setLocalState({ ...localState, is_active: pressed })
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
            <DescriptionEditor
              value={localState.description}
              onChange={(value) =>
                setLocalState({
                  ...localState,
                  description: value,
                })
              }
            />
            <div className="flex gap-5">
              <div className="w-[80%]">
                <label className="text-sm font-medium">
                  Categoría
                  {localState.is_active && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <CascadeCategorySelect
                  // flatCategories={flatCategories}
                  value={localState.category}
                  onChange={handleCategoryChange}
                  maxLevel={3} // <-- agregás esta prop
                />
                {/* <SelectCategories
                  editProductModal
                  onChange={handleCategoryChange}
                  value={localState.category}
                /> */}
              </div>
              <div className="w-[50%]">
                <label className="text-sm font-medium">
                  Marca
                  {localState.is_active && (
                    <span className="text-red-500 ml-1">*</span>
                  )}
                </label>
                <Select
                  value={localState.brand || ""}
                  onValueChange={(value) =>
                    setLocalState((prev) => ({ ...prev, brand: value }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona una marca" />
                  </SelectTrigger>
                  <SelectContent>
                    {brands.map((brand) => (
                      <SelectItem key={brand.id} value={brand.id}>
                        {brand.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Productos relacionados */}
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Productos relacionados
              </label>
              <Select
                value={selectedRelated || ""}
                onValueChange={(value) => {
                  if (!value) return;
                  handleRelatedChange(value);
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Agregar producto relacionado" />
                </SelectTrigger>
                <SelectContent>
                  {availableProducts.map((prod) => (
                    <SelectItem key={prod.id} value={prod.id}>
                      {prod.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

            {isConsumiblesCategory && (
              <>
                <div className="space-y-4 pt-2">
                  <h3 className="text-lg font-medium">Información del Insumo</h3>
                  <div className="flex gap-5">
                    <div>
                      <label className="text-sm font-medium">
                        Artículo
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <InputField
                        label=""
                        value={localState.articulo ?? ""}
                        onChange={(e) =>
                          setLocalState({ ...localState, articulo: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">
                        CAS
                        <span className="text-red-500 ml-1">*</span>
                      </label>
                      <InputField
                        label=""
                        value={localState.cas ?? ""}
                        onChange={(e) =>
                          setLocalState({ ...localState, cas: e.target.value })
                        }
                      />
                    </div>
                    <div className="w-[50%]">
                      <label className="text-sm font-medium">SEDRONAR</label>
                      <Select
                        value={localState.sedronar ?? "-"}
                        onValueChange={(value: SedronarOption) =>
                          setLocalState({ ...localState, sedronar: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Seleccionar lista" />
                        </SelectTrigger>
                        <SelectContent>
                          {SEDRONAR_OPTIONS.map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Documentación</h3>
                  <div className="grid grid-cols-2 gap-10">
                    <div>
                      <UploadFile
                        label="Especificaciones (ESP)"
                        allowedTypes={["application/pdf"]}
                        helpText="Click o arrastrá un archivo PDF"
                        onFileChange={(file) =>
                          handleInsumoFile(
                            file as File | null,
                            "esp_file",
                            setEspPreview
                          )
                        }
                      />
                      {renderDocumentPreview(espPreview, "ESP", () =>
                        handleRemoveInsumoFile(
                          "esp_file",
                          "esp_attachment_id",
                          setEspPreview
                        )
                      )}
                    </div>
                    <div>
                      <UploadFile
                        label="Hoja de Seguridad (HDS)"
                        allowedTypes={["application/pdf"]}
                        helpText="Click o arrastrá un archivo PDF"
                        onFileChange={(file) =>
                          handleInsumoFile(
                            file as File | null,
                            "hds_file",
                            setHdsPreview
                          )
                        }
                      />
                      {renderDocumentPreview(hdsPreview, "HDS", () =>
                        handleRemoveInsumoFile(
                          "hds_file",
                          "hds_attachment_id",
                          setHdsPreview
                        )
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            <br />

            <br />
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
                  Carrousel de archivos.
                </span>
                <UploadFile
                  multiple
                  onFileChange={(files) => {
                    const filesArray = files as File[];
                    filesArray.forEach((file) => handleCarouselFile(file));
                  }}
                />
                <span className="mb-2 block text-sm font-medium">
                  Los archivos de tipo texto se van a mostrar en la sección
                  "Descargas / Documentos", mientras que los archivos de tipo
                  imagen se van a mostrar en el carrusel de imágenes.
                </span>
                <div className="grid grid-cols-3 gap-2">
                  {carrouselPreview?.map((item, index) => (
                    <div
                      key={item.type === "existing" ? item.id : index}
                      className="relative inline-block mt-2 w-32 h-32"
                    >
                      {item.fileType === "application/pdf" ||
                      item.url?.toLowerCase().endsWith(".pdf") ? (
                        <div className="flex items-center justify-center w-32 h-32 rounded-lg border bg-gray-100 text-sm font-medium text-gray-500">
                          PDF
                        </div>
                      ) : (
                        <img
                          src={item.url}
                          alt="Preview"
                          className="w-32 h-32 object-cover rounded-lg border-2 border-gray-100"
                        />
                      )}
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
            </div>
          </div>
        </TabsContent>

        <TabsContent value="especificaciones">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Tabla independiente de la descripción y de las variedades. Se
              muestra en la ficha pública, antes de las variantes, si tiene
              contenido.
            </p>
            <ProductSpecTableEditor
              key={`${isOpen}-${localState.id ?? "new"}`}
              value={localState.spec_table}
              onChange={handleSpecTableChange}
            />
          </div>
        </TabsContent>

        {/* Tab: Tabla de Variedades (nueva funcionalidad) */}
        <TabsContent value="variedades">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Crea una tabla dinámica para definir las variedades del producto.
              Puedes agregar columnas personalizadas y filas para cada variedad.
            </p>
            <ProductVariantsTable
              onChange={handleVariantsChange}
              initialData={localState.variants ?? []}
            />
          </div>
        </TabsContent>

        {/* Botones de acción (siempre visibles) */}
        <div className="flex justify-end gap-2 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSave} disabled={!disabled}>
            Guardar
          </Button>
        </div>
      </Tabs>
    </Modal>
  );
};

export default ModalProduct;
