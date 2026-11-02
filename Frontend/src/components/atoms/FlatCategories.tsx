import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RootState } from "@/store";
import { useAppSelector } from "@/store/hooks";
import { getCategoryAncestry } from "@/utils/data/categories";

type CascadeSelectProps = {
  value?: string;
  onChange: (value: string | undefined) => void;
  error?: string;
  maxLevel?: number; // default 3
  /** Nombre de la categoría (p.ej. del producto) si el id aún no está en el catálogo. */
  valueLabel?: string | null;
};

const norm = (id?: string | null) => (id ?? "").trim().toLowerCase();

const parentKeyOf = (parent?: string | null) => {
  const p = norm(parent);
  if (!p || p === "null" || p === "undefined") return null;
  return p;
};

export function CascadeCategorySelect({
  value,
  onChange,
  error,
  maxLevel = 3,
  valueLabel,
}: CascadeSelectProps) {
  const { list: categories } = useAppSelector(
    (state: RootState) => state.categories
  );

  // Cadena raíz → hoja desde el listado plano (campo parent del API).
  // Más fiable que reconstruir desde el árbol de menú / flatten.
  const ancestry = getCategoryAncestry(value, categories);
  const [sel0, sel1, sel2, sel3] = [
    ancestry[0]?.id,
    ancestry[1]?.id,
    ancestry[2]?.id,
    ancestry[3]?.id,
  ];

  const sortByName = (a: { name: string }, b: { name: string }) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" });

  const level0 = categories
    .filter((c) => parentKeyOf(c.parent) === null)
    .sort(sortByName);

  const childrenOf = (parentId?: string) => {
    if (!parentId) return [];
    const pid = norm(parentId);
    return categories
      .filter((c) => parentKeyOf(c.parent) === pid)
      .sort(sortByName);
  };

  const level1 = childrenOf(sel0);
  const level2 = childrenOf(sel1);
  const level3 = childrenOf(sel2);

  const triggerClass = error ? "border-red-500 focus:ring-red-500" : "";

  const valueInCatalog = Boolean(
    value && getCategoryAncestry(value, categories).length > 0
  );
  const unresolvedLabel =
    !valueInCatalog && (valueLabel?.trim() || value)
      ? valueLabel?.trim() || String(value)
      : null;

  return (
    <div className="flex flex-col gap-2">
      {unresolvedLabel && (
        <p className="text-xs text-muted-foreground">
          Categoría actual:{" "}
          <span className="font-medium text-foreground">{unresolvedLabel}</span>
          {categories.length === 0
            ? " (cargando catálogo…)"
            : " (no está en el catálogo cargado; elegí la ruta abajo para corregirla)"}
        </p>
      )}

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
      </div>
    </div>
  );
}
