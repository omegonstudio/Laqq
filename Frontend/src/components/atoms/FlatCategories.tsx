import { useEffect, useState } from "react";
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
  /**
   * Productos: la categoría asignada debe tener level >= 1
   * (no se puede quedar solo en la raíz).
   */
  requireLeaf?: boolean;
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
  requireLeaf = false,
}: CascadeSelectProps) {
  const { list: categories } = useAppSelector(
    (state: RootState) => state.categories
  );

  const ancestry = getCategoryAncestry(value, categories);
  const ancestryIds = [
    ancestry[0]?.id,
    ancestry[1]?.id,
    ancestry[2]?.id,
    ancestry[3]?.id,
  ] as (string | undefined)[];

  const [draft, setDraft] = useState<(string | undefined)[]>(ancestryIds);

  useEffect(() => {
    setDraft([
      ancestry[0]?.id,
      ancestry[1]?.id,
      ancestry[2]?.id,
      ancestry[3]?.id,
    ]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, categories]);

  const [sel0, sel1, sel2, sel3] = draft;

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

  const levelOf = (id?: string) => {
    if (!id) return undefined;
    return categories.find((c) => norm(c.id) === norm(id))?.level;
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

  const commitPath = (next: (string | undefined)[]) => {
    setDraft(next);
    const deepest = [...next].reverse().find(Boolean);
    if (!deepest) {
      onChange(undefined);
      return;
    }
    if (requireLeaf) {
      const lvl = levelOf(deepest);
      const isRoot =
        typeof lvl === "number" ? lvl < 1 : parentKeyOf(
          categories.find((c) => norm(c.id) === norm(deepest))?.parent
        ) === null;
      if (isRoot) {
        onChange(undefined);
        return;
      }
    }
    onChange(deepest);
  };

  const rootPending = requireLeaf && Boolean(sel0 && !sel1);

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
          if (v === "none") {
            commitPath([undefined, undefined, undefined, undefined]);
            return;
          }
          commitPath([v, undefined, undefined, undefined]);
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
        {sel0 && (level1.length > 0 || requireLeaf) && (
          <Select
            value={sel1 || "none"}
            onValueChange={(v) => {
              if (v === "none") {
                if (requireLeaf) return;
                commitPath([sel0, undefined, undefined, undefined]);
                return;
              }
              commitPath([sel0, v, undefined, undefined]);
            }}
          >
            <SelectTrigger className={triggerClass}>
              <SelectValue placeholder="Seleccionar subcategoría" />
            </SelectTrigger>
            <SelectContent>
              {!requireLeaf && (
                <SelectItem value="none">Sin subcategoría</SelectItem>
              )}
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
              if (v === "none") {
                commitPath([sel0, sel1, undefined, undefined]);
                return;
              }
              commitPath([sel0, sel1, v, undefined]);
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
              if (v === "none") {
                commitPath([sel0, sel1, sel2, undefined]);
                return;
              }
              commitPath([sel0, sel1, sel2, v]);
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
      {rootPending && (
        <p className="text-xs text-amber-700">
          Elegí al menos una subcategoría: no se pueden asignar productos a una
          categoría raíz (nivel 0).
        </p>
      )}
      {requireLeaf && sel0 && level1.length === 0 && (
        <p className="text-xs text-amber-700">
          Esta categoría raíz no tiene subcategorías. Creá una antes de asignar
          productos.
        </p>
      )}
    </div>
  );
}
