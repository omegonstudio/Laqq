import { Category, CategoryUI } from "@/types/types";

const CONSUMIBLES_ROOT_NAME = "Consumibles";
const REACTIVOS_QUIMICOS_NAME = "Reactivos Químicos";

type CategoryParentRef = {
  id: string;
  name: string;
  parent?: string | null;
};

const namesMatch = (a: string, b: string) =>
  a.trim().toLowerCase() === b.trim().toLowerCase();

/** True si la categoría es Consumibles o cuelga de ella (cualquier nivel). */
export function isCategoryUnderConsumibles(
  categoryId: string,
  categories: CategoryParentRef[]
): boolean {
  const byId = new Map(categories.map((c) => [normId(c.id), c]));
  let current = byId.get(normId(categoryId));
  while (current) {
    if (namesMatch(current.name, CONSUMIBLES_ROOT_NAME)) return true;
    const parentKey = normId(current.parent);
    current =
      parentKey && parentKey !== "null" && parentKey !== "undefined"
        ? byId.get(parentKey)
        : undefined;
  }
  return false;
}

/**
 * True si la categoría es "Reactivos Químicos" (o cuelga de ella) y a su vez
 * está bajo la raíz Consumibles. Es el criterio del listado/ABM de insumos.
 */
export function isCategoryUnderReactivosQuimicos(
  categoryId: string,
  categories: CategoryParentRef[]
): boolean {
  const ancestry = getCategoryAncestry(categoryId, categories);
  if (!ancestry.length) return false;
  const underConsumibles = namesMatch(ancestry[0].name, CONSUMIBLES_ROOT_NAME);
  const underReactivos = ancestry.some((c) =>
    namesMatch(c.name, REACTIVOS_QUIMICOS_NAME)
  );
  return underConsumibles && underReactivos;
}

export type CatalogCrumb = {
  label: string;
  href?: string;
};

export function categoryListingHref(category: {
  id: string;
  name: string;
}): string {
  if (category.name.trim().toLowerCase() === "mobiliario") {
    return "/furniture";
  }
  return `/products?category=${category.id}`;
}

const normId = (id?: string | null) => (id ?? "").trim().toLowerCase();

/** Cadena raíz → hoja. Vacía si el id no está en la lista. */
export function getCategoryAncestry(
  categoryId: string | null | undefined,
  categories: CategoryParentRef[]
): CategoryParentRef[] {
  if (!categoryId) return [];
  // Match case-insensitive: Radix/API a veces difieren en mayúsculas del UUID.
  const byId = new Map(categories.map((c) => [normId(c.id), c]));
  const chain: CategoryParentRef[] = [];
  const seen = new Set<string>();
  let current = byId.get(normId(categoryId));
  while (current && !seen.has(normId(current.id))) {
    seen.add(normId(current.id));
    chain.push(current);
    const parentKey = normId(current.parent);
    current =
      parentKey && parentKey !== "null" && parentKey !== "undefined"
        ? byId.get(parentKey)
        : undefined;
  }
  return chain.reverse();
}

export function buildCatalogCrumbs({
  categories,
  categoryId,
  productName,
}: {
  categories: CategoryParentRef[];
  categoryId?: string | null;
  productName?: string | null;
}): CatalogCrumb[] {
  const crumbs: CatalogCrumb[] = [
    { label: "Inicio", href: "/" },
    { label: "Catálogo", href: "/products" },
  ];

  for (const cat of getCategoryAncestry(categoryId, categories)) {
    crumbs.push({
      label: cat.name,
      href: categoryListingHref(cat),
    });
  }

  if (productName?.trim()) {
    crumbs.push({ label: productName.trim() });
  }

  const last = crumbs[crumbs.length - 1];
  crumbs[crumbs.length - 1] = { label: last.label };
  return crumbs;
}

export function buildCategories(categories: readonly Category[]): CategoryUI[] {
  if (!categories.length) return [];

  const metaById = new Map<
    string,
    { displayOrder: number; sourceIndex: number; parentId: string | null }
  >();
  const nodeById = new Map<string, CategoryUI>();
  const rootIds = new Set<string>();
  const warned = new Set<string>();

  const safeParentId = (value?: string | null) => {
    if (!value) return null;
    const normalized = normId(value);
    if (!normalized || normalized === "null" || normalized === "undefined") {
      return null;
    }
    return normalized;
  };

  categories.forEach((cat, sourceIndex) => {
    const idKey = normId(cat.id);
    const parentId = safeParentId(cat.parent);
    const displayOrder = Number.isFinite(cat.display_order) ? cat.display_order : 0;

    if (nodeById.has(idKey) && !warned.has(`dup-${idKey}`)) {
      console.warn(
        `[categories] id duplicado detectado: ${cat.id}. Se conserva la primera ocurrencia.`
      );
      warned.add(`dup-${idKey}`);
      return;
    }

    nodeById.set(idKey, {
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      href: `/products?category=${cat.id}`,
      subcategories: [],
    });
    metaById.set(idKey, { displayOrder, sourceIndex, parentId });
    rootIds.add(idKey);
  });

  const hasCycle = (nodeId: string, parentId: string) => {
    let current: string | null = parentId;
    let guard = 0;
    while (current && guard < categories.length + 1) {
      if (current === nodeId) return true;
      current = metaById.get(current)?.parentId ?? null;
      guard += 1;
    }
    return false;
  };

  for (const [nodeId, node] of nodeById.entries()) {
    const meta = metaById.get(nodeId);
    if (!meta) continue;
    const parentId = meta.parentId;

    if (!parentId) continue;

    const parentNode = nodeById.get(parentId);
    if (!parentNode) {
      if (!warned.has(`orphan-${nodeId}`)) {
        console.warn(
          `[categories] parent inexistente (${parentId}) para ${nodeId}. Se renderiza como raíz.`
        );
        warned.add(`orphan-${nodeId}`);
      }
      continue;
    }

    if (parentId === nodeId || hasCycle(nodeId, parentId)) {
      if (!warned.has(`cycle-${nodeId}`)) {
        console.warn(
          `[categories] ciclo detectado en ${nodeId}. Se renderiza como raíz para evitar loop.`
        );
        warned.add(`cycle-${nodeId}`);
      }
      continue;
    }

    parentNode.subcategories = [...parentNode.subcategories, node];
    rootIds.delete(nodeId);
  }

  // Orden para raíces (nivel 0): por display_order, luego por sourceIndex
  const sortByOrder = (a: CategoryUI, b: CategoryUI) => {
    const aMeta = metaById.get(normId(a.id));
    const bMeta = metaById.get(normId(b.id));
    const orderDiff = (aMeta?.displayOrder ?? 0) - (bMeta?.displayOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return (aMeta?.sourceIndex ?? 0) - (bMeta?.sourceIndex ?? 0);
  };

  // Orden alfabético para subcategorías (nivel 1, 2, 3+)
  const sortByName = (a: CategoryUI, b: CategoryUI) =>
    a.name.localeCompare(b.name, "es", { sensitivity: "base" });

  const visited = new Set<string>();
  const toSortedTree = (id: string): CategoryUI | null => {
    const idKey = normId(id);
    if (visited.has(idKey)) return null;
    visited.add(idKey);

    const node = nodeById.get(idKey);
    if (!node) return null;

    const sortedChildren = [...node.subcategories]
      .sort(sortByName) // Subcategorías se ordenan alfabéticamente
      .map((child) => toSortedTree(child.id))
      .filter((child): child is CategoryUI => child !== null);

    return { ...node, subcategories: sortedChildren };
  };

  const roots = [...rootIds]
    .map((id) => toSortedTree(id))
    .filter((root): root is CategoryUI => root !== null)
    .sort(sortByOrder); // Raíces siguen por display_order

  for (const [id] of nodeById.entries()) {
    if (!visited.has(id)) {
      const safeRoot = toSortedTree(id);
      if (safeRoot) roots.push(safeRoot);
    }
  }

  return roots.sort(sortByOrder);
}
