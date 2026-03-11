import { useState } from "react";
import { CategoryUI } from "@/types/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAppSelector } from "@/store/hooks";
import { buildCategories } from "@/utils/data/categories";
import { RootState } from "@/store";

interface FlatCategory {
  id: string;
  name: string;
  level: number;
}
interface CategoryFormState {
  id?: string;
  name: string;
  parent?: string;
  display_order: number;
  description: string;
  level: number;
}

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

interface SelectCategoriesProps {
  editProductModal: boolean;
  onChange: (categoryId: string | undefined) => void;
}

const SelectCategories: React.FC<SelectCategoriesProps> = ({
  editProductModal,
  onChange,
}) => {
  const { list: categories } = useAppSelector(
    (state: RootState) => state.categories
  );
  const menuItems = buildCategories(categories);
  const flatCategories = flattenCategories(menuItems);

  const [localState, setLocalState] = useState<CategoryFormState>({
    id: undefined,
    name: "",
    parent: undefined,
    display_order: 0,
    description: "",
    level: 0,
  });
  const isDisabled = (cat: FlatCategory) => {
    if (cat.id === localState.id) return true;
    if (cat.id === localState.parent) return false;
    return cat.level >= localState.level;
  };
  const placeholder = editProductModal
    ? "Selecciona una categoría"
    : "Sin categoría padre";
  return (
    <div>
      <label className="text-sm font-medium">Categorías</label>
      <Select
        value={localState.parent || "none"}
        onValueChange={(value) => {
          const parent = value === "none" ? undefined : value;

          setLocalState((prev) => ({
            ...prev,
            parent,
          }));

          onChange(parent);
        }}
      >
        <SelectTrigger id="parent">
          <SelectValue placeholder={placeholder} />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">{placeholder}</SelectItem>

          {flatCategories.map((cat) => {
            const disabled = editProductModal
              ? !editProductModal
              : isDisabled(cat);

            return (
              <SelectItem key={cat.id} value={cat.id} disabled={disabled}>
                <span
                  className={`
                block
                ${disabled ? "opacity-50" : ""}
                ${cat.level === 0 ? "uppercase text-sm font-bold" : ""}
                ${cat.level === 1 ? "text-sm pl-3 font-semibold" : ""}
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
    </div>
  );
};

export default SelectCategories;
