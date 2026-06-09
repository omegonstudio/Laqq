import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RootState } from "@/store";
import { useAppSelector } from "@/store/hooks";
import { CategoryUI } from "@/types/types";
import { buildCategories } from "@/utils/data/categories";

type FlatCategory = {
  id: string;
  name: string;
  level: number;
  parent?: string;
};

type CascadeSelectProps = {
  // flatCategories: FlatCategory[];
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  maxLevel?: number; // default 3
};

const flattenCategories = (
  categories: CategoryUI[],
  level = 0,
  acc: FlatCategory[] = [],
  parentId?: string
): FlatCategory[] => {
  for (const cat of categories) {
    acc.push({
      id: cat.id,
      name: cat.name,
      level,
      parent: parentId,
    });

    if (cat.subcategories?.length) {
      flattenCategories(cat.subcategories, level + 1, acc, cat.id);
    }
  }

  return acc;
};

export function CascadeCategorySelect({
  // flatCategories,

  value,
  onChange,
  error,
  maxLevel,
}: CascadeSelectProps) {
  const { list: categories } = useAppSelector(
    (state: RootState) => state.categories
  );
  const menuItems = buildCategories(categories);
  const flatCategories = flattenCategories(menuItems);
  const level0 = flatCategories.filter((c) => c.level === 0);
  // Reconstruir selecciones actuales a partir del value
  const buildSelections = (selectedId?: string): (string | undefined)[] => {
    if (!selectedId) return [undefined, undefined, undefined, undefined];

    const chain: string[] = [];
    let current: FlatCategory | undefined = flatCategories.find(
      (c) => c.id === selectedId
    );

    while (current) {
      chain.unshift(current.id);
      current = current.parent
        ? flatCategories.find((c) => c.id === current!.parent)
        : undefined;
    }

    // Rellenar hasta 4 niveles
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    while (chain.length < 4) chain.push(undefined as any);
    return chain;
  };

  const [sel0, sel1, sel2, sel3] = buildSelections(value);

  const level1 = sel0
    ? flatCategories.filter((c) => c.level === 1 && c.parent === sel0)
    : [];
  const level2 = sel1
    ? flatCategories.filter((c) => c.level === 2 && c.parent === sel1)
    : [];
  const level3 = sel2
    ? flatCategories.filter((c) => c.level === 3 && c.parent === sel2)
    : [];

  const handleChange = (level: number, selectedValue: string) => {
    const val = selectedValue === "none" ? undefined : selectedValue;
    // El valor real es el último seleccionado
    onChange(val);
  };

  const triggerClass = error ? "border-red-500 focus:ring-red-500" : "";

  return (
    <div className="flex flex-col gap-2">
      {/* Nivel 0 - siempre visible */}
      <Select
        value={sel0 || "none"}
        onValueChange={(v) => {
          onChange(v === "none" ? undefined : v);
        }}
      >
        <SelectTrigger className={triggerClass}>
          <SelectValue placeholder="Sin categoría padre" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">Sin categoría</SelectItem>
          {level0.map((cat) => (
            <SelectItem key={cat.id} value={cat.id}>
              {cat.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <div className="flex gap-5">
        {/* Nivel 1 - visible si hay sel0 y hay hijos */}
        {sel0 && level1.length > 0 && (
          <Select
            value={sel1 || "none"}
            onValueChange={(v) => {
              onChange(v === "none" ? sel0 : v);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Seleccionar subcategoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin subcategoría</SelectItem>
              {level1.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Nivel 2 */}
        {sel1 && level2.length > 0 && (
          <Select
            value={sel2 || "none"}
            onValueChange={(v) => {
              onChange(v === "none" ? sel1 : v);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Seleccionar subcategoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin subcategoría</SelectItem>
              {level2.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        {/* Nivel 3 */}
        {sel2 && level3.length > 0 && maxLevel >= 3 && (
          <Select
            value={sel3 || "none"}
            onValueChange={(v) => {
              onChange(v === "none" ? sel2 : v);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Seleccionar subcategoría" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Sin subcategoría</SelectItem>
              {level3.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
      </div>{" "}
    </div>
  );
}
