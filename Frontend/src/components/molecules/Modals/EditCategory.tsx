"use client";

import type React from "react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Category } from "@/types/types";

import { createCategory, updateCategory } from "@/store/categoriesSlice";
import { useAppDispatch, useAppSelector } from "@/store/hooks";

interface CategoryFormState {
  id?: string;
  name: string;
  parent?: string;
  display_order: number;
  description: string;
}

interface ModalCategoryProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Category | null;
  isNew: boolean;
  categories?: Category[];
}

const getEmptyCategoryFormState = (): CategoryFormState => ({
  name: "",
  parent: undefined,
  display_order: 0,
  description: "",
});

const categoryToFormState = (category: Category): CategoryFormState => ({
  id: category.id,
  name: category.name,
  parent: category.parent,
  display_order: category.display_order,
  description: category.description,
});

const validateCategoryForm = (formState: CategoryFormState) => {
  if (!formState.name.trim()) {
    return {
      isValid: false,
      errorMessage: "El nombre de la categoría es obligatorio",
    };
  }

  if (formState.display_order < 0) {
    return {
      isValid: false,
      errorMessage: "El orden de visualización debe ser un número positivo",
    };
  }

  return { isValid: true, errorMessage: null };
};

const hasCategoryChanges = (
  formState: CategoryFormState,
  initialData: Category
): boolean => {
  return (
    formState.name !== initialData.name ||
    formState.parent !== initialData.parent ||
    formState.display_order !== initialData.display_order
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
  const dispatch = useAppDispatch();
  const { creating, updating } = useAppSelector((state) => state.categories);
  console.log(initialData, "INITIAL DATA");

  useEffect(() => {
    if (initialData) {
      const formState = categoryToFormState(initialData);
      setLocalState(formState);
      setInitialParentId(initialData.parent);
    } else {
      setLocalState(getEmptyCategoryFormState());
      setInitialParentId(undefined);
    }
  }, [initialData]);

  useEffect(() => {
    if (!isOpen) {
      if (initialData) {
        const formState = categoryToFormState(initialData);
        setLocalState(formState);
        setInitialParentId(initialData.parent);
      } else {
        setLocalState(getEmptyCategoryFormState());
        setInitialParentId(undefined);
      }
    }
  }, [isOpen, initialData]);

  const validation = useMemo(
    () => validateCategoryForm(localState),
    [localState]
  );

  const hasChanges = useMemo(() => {
    if (!initialData) return true;
    return hasCategoryChanges(localState, initialData);
  }, [localState, initialData]);

  const isSaveEnabled = useMemo(() => {
    return validation.isValid && (!initialData || hasChanges);
  }, [validation.isValid, initialData, hasChanges]);

  const handleCancel = () => {
    onClose();
  };

  const handleSave = async () => {
    try {
      if (!validation.isValid) {
        toast.error(validation.errorMessage || "Formulario inválido");
        return;
      }

      if (localState.id) {
        const parentChanged = localState.parent !== initialParentId;
        const updatePayload: Partial<CategoryFormState> = {
          name: localState.name,
          display_order: localState.display_order,
        };

        if (parentChanged) {
          updatePayload.parent = localState.parent;
        }

        const result = await dispatch(
          updateCategory({ id: localState.id, data: updatePayload })
        ).unwrap();
        toast.success("Categoría actualizada exitosamente");
      } else {
        const result = await dispatch(createCategory(localState)).unwrap();
        toast.success("Categoría creada exitosamente");
      }

      onClose();
    } catch (error: unknown) {
      console.error("Error guardando categoría:", error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Error al guardar la categoría";
      toast.error(errorMessage);
    }
  };

  const availableParentCategories = categories.filter(
    (cat) => !localState.id || cat.id !== localState.id
  );

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>
            {localState.id ? "Editar Categoría" : "Nueva Categoría"}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nombre</Label>
            <Input
              id="name"
              value={localState.name}
              onChange={(e) =>
                setLocalState({ ...localState, name: e.target.value })
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="name">Descripción</Label>
            <Input
              id="name"
              value={localState.description}
              onChange={(e) =>
                setLocalState({ ...localState, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent">Categoría padre (opcional)</Label>
            <Select
              value={localState.parent || "none"}
              onValueChange={(value) =>
                setLocalState({
                  ...localState,
                  parent: value === "none" ? undefined : value,
                })
              }
            >
              <SelectTrigger id="parent">
                <SelectValue placeholder="Sin categoría padre (raíz)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Sin categoría padre (raíz)</SelectItem>
                {availableParentCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="display_order">Orden de visualización</Label>
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
              placeholder="0"
              min="0"
            />
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
