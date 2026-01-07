import { Category, CategoryUI } from "@/types/types";

export function buildCategories(categories: readonly Category[]): CategoryUI[] {
  const categoryMap = new Map<string, CategoryUI>();
  const roots: CategoryUI[] = [];

  // Inicializamos todas
  categories.forEach((cat) => {
    categoryMap.set(cat.id, {
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      href: `/products?category=${cat.id}`,
      subcategories: [],
    });
  });

  // Relacionamos parent → children
  categories.forEach((cat) => {
    const current = categoryMap.get(cat.id);
    if (!current) return;

    if (cat.parent) {
      const parent = categoryMap.get(cat.parent);
      if (parent) {
        parent.subcategories.push(current);
      }
    } else {
      roots.push(current);
    }
  });

  return roots;
}
