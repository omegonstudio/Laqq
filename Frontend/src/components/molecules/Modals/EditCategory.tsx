import { useState, useEffect, useMemo } from "react";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { Category, CategoryUI } from "@/types/types";
import { buildCategories } from "@/utils/data/categories";
import {
  createCategory,
  fetchAllCategories,
  updateCategory,
} from "@/store/categoriesSlice";
import { DialogDescription } from "@radix-ui/react-dialog";

interface CategoryFormState {
  id?: string;
  name: string;
  parent?: string;
  display_order: number;
  description: string;
  level: number;
}

interface ModalCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Category | null;
  isNew: boolean;
  categories?: Category[];
}

interface FlatCategory {
  id: string;
  name: string;
  level: number;
}

interface FormErrors {
  name?: string;
  parent?: string;
  display_order?: string;
}

const getEmptyCategoryFormState = (): CategoryFormState => ({
  name: "",
  parent: undefined,
  display_order: 0,
  description: "",
  level: 10,
});

const categoryToFormState = (category: Category): CategoryFormState => ({
  id: category.id,
  name: category.name,
  parent: category.parent,
  display_order: category.display_order,
  description: category.description,
  level: category.level,
});

const flattenCategories = (
  categories: CategoryUI[],
  level = 0,
  acc: FlatCategory[] = []
): FlatCategory[] => {
  for (const cat of categories) {
    acc.push({
      id: cat.id,
      name: cat.name,
      level,
    });

    if (cat.subcategories?.length) {
      flattenCategories(cat.subcategories, level + 1, acc);
    }
  }

  return acc;
};

const validateCategoryForm = (formState: CategoryFormState): FormErrors => {
  const errors: FormErrors = {};

  if (!formState.name.trim()) {
    errors.name = "El nombre de la categoría es obligatorio";
  }
  if (formState.level !== 0) {
    if (formState.parent === undefined || formState.parent === null) {
      errors.parent = "Es obligatorio seleccionar una categoría padre";
    }
  }

  if (formState.display_order < 0) {
    errors.display_order =
      "El orden de visualización debe ser un número positivo";
  }

  return errors;
};

const hasCategoryChanges = (
  formState: CategoryFormState,
  initialData: Category
): boolean => {
  return (
    formState.name !== initialData.name ||
    formState.parent !== initialData.parent ||
    formState.display_order !== initialData.display_order ||
    formState.description !== initialData.description
  );
};

const ModalCategory: React.FC<ModalCategoryProps> = ({
  isOpen,
  onClose,
  initialData,
  isNew,
  categories = [],
}) => {
  const [localState, setLocalState] = useState<CategoryFormState>(
    getEmptyCategoryFormState()
  );
  const [initialParentId, setInitialParentId] = useState<string | undefined>(
    undefined
  );
  const [errors, setErrors] = useState<FormErrors>({});
  const [touched, setTouched] = useState<Set<string>>(new Set());
  const menuItems = buildCategories(categories);
  const flatCategories = flattenCategories(menuItems);

  const dispatch = useAppDispatch();
  const { creating, updating } = useAppSelector((state) => state.categories);

  useEffect(() => {
    if (isOpen) {
      if (!isNew && initialData) {
        const formState = categoryToFormState(initialData);
        setLocalState(formState);
        setInitialParentId(initialData.parent);
      } else {
        setLocalState(getEmptyCategoryFormState());
        setInitialParentId(undefined);
      }
      // Resetear errores y campos tocados al abrir
      setErrors({});
      setTouched(new Set());
    }
  }, [isOpen, initialData, isNew]);

  // Validar en tiempo real
  useEffect(() => {
    const validationErrors = validateCategoryForm(localState);
    setErrors(validationErrors);
  }, [localState]);

  const hasChanges = useMemo(() => {
    if (!initialData) return true;
    return hasCategoryChanges(localState, initialData);
  }, [localState, initialData]);

  const isFormValid = useMemo(() => {
    return Object.keys(errors).length === 0;
  }, [errors]);

  const isSaveEnabled = useMemo(() => {
    return isFormValid && (!initialData || hasChanges);
  }, [isFormValid, initialData, hasChanges]);

  const handleCancel = () => {
    onClose();
  };

  const handleBlur = (field: string) => {
    setTouched((prev) => new Set(prev).add(field));
  };

  const handleSave = async () => {
    // Marcar todos los campos como tocados al intentar guardar
    setTouched(new Set(["name", "parent", "display_order"]));

    if (!isFormValid) {
      const firstError = Object.values(errors)[0];
      toast({
        title: "Formulario incompleto",
        description: firstError,
        variant: "destructive",
      });
      return;
    }

    try {
      if (localState.id) {
        const parentChanged = localState.parent !== initialParentId;
        const updatePayload: Partial<CategoryFormState> = {
          name: localState.name,
          display_order: localState.display_order,
          description: localState.description,
        };

        if (parentChanged) {
          updatePayload.parent = localState.parent;
        }

        await dispatch(
          updateCategory({ id: localState.id, data: updatePayload })
        ).unwrap();
        toast({ title: "Categoría actualizada exitosamente" });
      } else {
        await dispatch(createCategory(localState)).unwrap();
        toast({ title: "Categoría creada exitosamente" });
      }

      onClose();
    } catch (error: unknown) {
      console.error("Error guardando categoría:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al guardar la categoría";
      toast({ title: errorMessage, variant: "destructive" });
    }
  };

  useEffect(() => {
    dispatch(fetchAllCategories({}));
  }, [dispatch]);

  const isDisabled = (cat: FlatCategory) => {
    if (cat.id === localState.id) return true;
    if (cat.id === localState.parent) return false;
    return cat.level >= localState.level;
  };

  const showError = (field: string) => {
    return touched.has(field) && errors[field as keyof FormErrors];
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {localState.id ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
          <DialogDescription>Edición de categorías</DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Campo Nombre */}
          <div className="space-y-2">
            <Label htmlFor="name" className={errors.name ? "text-red-600" : ""}>
              Nombre {errors.name && <span className="text-red-600">*</span>}
            </Label>
            <Input
              id="name"
              value={localState.name}
              onChange={(e) =>
                setLocalState({ ...localState, name: e.target.value })
              }
              onBlur={() => handleBlur("name")}
              className={
                showError("name")
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }
            />
            {showError("name") && (
              <p className="text-sm text-red-600">{errors.name}</p>
            )}
          </div>

          {/* Campo Descripción */}
          <div className="space-y-2">
            <Label htmlFor="description">Descripción</Label>
            <Input
              id="description"
              value={localState.description ?? ""}
              onChange={(e) =>
                setLocalState({ ...localState, description: e.target.value })
              }
            />
          </div>

          {/* Campo Categoría Padre */}
          {localState.level > 0 && (
            <div className="space-y-2">
              <Label
                htmlFor="parent"
                className={errors.parent ? "text-red-600" : ""}
              >
                Categoría padre{" "}
                {errors.parent && <span className="text-red-600">*</span>}
              </Label>
              <Select
                value={localState.parent || "none"}
                onValueChange={(value) => {
                  setLocalState({
                    ...localState,
                    parent: value === "none" ? undefined : value,
                  });
                  handleBlur("parent");
                }}
              >
                <SelectTrigger
                  id="parent"
                  className={
                    showError("parent")
                      ? "border-red-500 focus:ring-red-500"
                      : ""
                  }
                >
                  <SelectValue placeholder="Sin categoría padre" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Sin categoría padre</SelectItem>

                  {flatCategories.map((cat) => {
                    const disabled = isDisabled(cat) || cat.level >= 3;

                    return (
                      <SelectItem
                        key={cat.id}
                        value={cat.id}
                        disabled={disabled}
                      >
                        <span
                          className={`
                            block
                            ${disabled ? "opacity-50" : ""}
                            ${
                              cat.level === 0
                                ? "uppercase text-sm font-bold"
                                : ""
                            }
                            ${
                              cat.level === 1
                                ? "text-sm pl-3 font-semibold"
                                : ""
                            }
                            ${cat.level === 2 ? "text-xs pl-6" : ""}
                          `}
                        >
                          {cat.name}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
              {showError("parent") && (
                <p className="text-sm text-red-600">{errors.parent}</p>
              )}
            </div>
          )}

          {/* Campo Orden */}
          <div className="space-y-2">
            <Label
              htmlFor="display_order"
              className={errors.display_order ? "text-red-600" : ""}
            >
              Orden de visualización
            </Label>
            <Input
              id="display_order"
              type="number"
              value={localState.display_order.toString()}
              onChange={(e) =>
                setLocalState({
                  ...localState,
                  display_order: Number.parseInt(e.target.value) || 0,
                })
              }
              onBlur={() => handleBlur("display_order")}
              placeholder="0"
              min="0"
              className={
                showError("display_order")
                  ? "border-red-500 focus-visible:ring-red-500"
                  : ""
              }
            />
            {showError("display_order") && (
              <p className="text-sm text-red-600">{errors.display_order}</p>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancelar
          </Button>
          <Button
            onClick={handleSave}
            disabled={!isSaveEnabled || creating || updating}
          >
            {creating || updating ? "Guardando..." : "Guardar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ModalCategory;
