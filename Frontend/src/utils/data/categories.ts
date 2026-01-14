import { Category, CategoryUI } from "@/types/types";

export function buildCategories(categories: readonly Category[]): CategoryUI[] {
  const map = new Map<string, CategoryUI>();
  const roots: CategoryUI[] = [];

  // 1. Crear todos los nodos
  for (const cat of categories) {
    map.set(cat.id, {
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      href: `/products?category=${cat.id}`,
      subcategories: [],
    });
  }

  // 2. Armar la jerarquía usando parent
  for (const cat of categories) {
    const node = map.get(cat.id);
    if (!node) continue;

    if (cat.parent) {
      const parentNode = map.get(cat.parent);

      // Validación defensiva
      if (!parentNode) {
        console.warn(`Parent ${cat.parent} no encontrado para ${cat.id}`);
        continue;
      }

      // Validación de nivel
      if (cat.level !== undefined) {
        const parentLevel = categories.find((c) => c.id === cat.parent)?.level;

        if (parentLevel !== undefined && cat.level !== parentLevel + 1) {
          console.warn(`Nivel inconsistente en ${cat.name}`);
        }
      }

      parentNode.subcategories.push(node);
    } else {
      // Sin parent → raíz
      roots.push(node);
    }
  }

  // 3. Ordenar recursivamente
  const sortRecursive = (items: CategoryUI[]) => {
    items.sort((a, b) => {
      const da = categories.find((c) => c.id === a.id)?.display_order ?? 0;
      const db = categories.find((c) => c.id === b.id)?.display_order ?? 0;
      return da - db;
    });

    items.forEach((i) => sortRecursive(i.subcategories));
  };

  sortRecursive(roots);

  return roots;
}
