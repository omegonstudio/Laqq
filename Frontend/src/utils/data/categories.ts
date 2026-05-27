import { Category, CategoryUI } from "@/types/types";

export function buildCategories(categories: readonly Category[]): CategoryUI[] {
  if (!categories.length) return [];

  const metaById = new Map<
    string,
    { displayOrder: number; sourceIndex: number; parentId: string | null }
  >();
  const nodeById = new Map<string, CategoryUI>();
  const rootIds = new Set<string>();
  const warned = new Set<string>();

  const safeParentId = (value?: string) => {
    if (!value) return null;
    const normalized = String(value).trim();
    if (!normalized || normalized === "null" || normalized === "undefined") {
      return null;
    }
    return normalized;
  };

  categories.forEach((cat, sourceIndex) => {
    const parentId = safeParentId(cat.parent);
    const displayOrder = Number.isFinite(cat.display_order) ? cat.display_order : 0;

    if (nodeById.has(cat.id) && !warned.has(`dup-${cat.id}`)) {
      console.warn(
        `[categories] id duplicado detectado: ${cat.id}. Se conserva la primera ocurrencia.`
      );
      warned.add(`dup-${cat.id}`);
      return;
    }

    nodeById.set(cat.id, {
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      href: `/products?category=${cat.id}`,
      subcategories: [],
    });
    metaById.set(cat.id, { displayOrder, sourceIndex, parentId });
    rootIds.add(cat.id);
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

  const sortByOrder = (a: CategoryUI, b: CategoryUI) => {
    const aMeta = metaById.get(a.id);
    const bMeta = metaById.get(b.id);
    const orderDiff = (aMeta?.displayOrder ?? 0) - (bMeta?.displayOrder ?? 0);
    if (orderDiff !== 0) return orderDiff;
    return (aMeta?.sourceIndex ?? 0) - (bMeta?.sourceIndex ?? 0);
  };

  const visited = new Set<string>();
  const toSortedTree = (id: string): CategoryUI | null => {
    if (visited.has(id)) return null;
    visited.add(id);

    const node = nodeById.get(id);
    if (!node) return null;

    const sortedChildren = [...node.subcategories]
      .sort(sortByOrder)
      .map((child) => toSortedTree(child.id))
      .filter((child): child is CategoryUI => child !== null);

    return { ...node, subcategories: sortedChildren };
  };

  const roots = [...rootIds]
    .map((id) => toSortedTree(id))
    .filter((root): root is CategoryUI => root !== null)
    .sort(sortByOrder);

  for (const [id] of nodeById.entries()) {
    if (!visited.has(id)) {
      const safeRoot = toSortedTree(id);
      if (safeRoot) roots.push(safeRoot);
    }
  }

  return roots.sort(sortByOrder);
}
