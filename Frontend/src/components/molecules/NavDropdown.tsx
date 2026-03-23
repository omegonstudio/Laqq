"use client";

import { useState } from "react";
import { useProductFilters } from "@/hooks/useFilters";
import { useAppSelector } from "@/store/hooks";
import { buildCategories } from "@/utils/data/categories";
import { CategoryUI } from "@/types/types";
import { ChevronDown } from "lucide-react";

const MAX_HEIGHT = "max-h-[300px]";

export default function NavDropdown() {
  const { setFilter } = useProductFilters();
  const { list: categories } = useAppSelector((state) => state.categories);
  const menuItems = buildCategories(categories);

  // Guarda el path activo (nivel 0 → nivel 3)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activeRoot, setActiveRoot] = useState<any | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [activePath, setActivePath] = useState<any[]>([]);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleHover = (level: number, item: any) => {
    setActivePath((prev) => {
      const next = [...prev.slice(0, level), item];
      return next;
    });
  };

  const handleClick = (id: string) => {
    setFilter("category", id);
    setActivePath([]);
  };

  const getColumnItems = (level: number) => {
    if (level === 0) return menuItems;
    return activePath[level - 1]?.subcategories || [];
  };

  return (
    <div className="relative hidden md:block">
      <div className="flex gap-2">
        {menuItems.map((item) => {
          const isActive = activeRoot?.id === item.id;
          const hasChildren = item.subcategories?.length > 0;

          return (
            <div
              key={item.id}
              className="relative"
              onMouseEnter={() => {
                if (!hasChildren) return;
                setActiveRoot(item);
                setActivePath([item]);
              }}
              onMouseLeave={(e) => {
                // Si el mouse sigue dentro del mismo contenedor (por ejemplo entrando al panel), no cerrar
                if (e.currentTarget.contains(e.relatedTarget as Node)) return;

                setActiveRoot(null);
                setActivePath([]);
              }}
            >
              {/* BOTÓN */}
              <button
                className="px-4 h-9 rounded-full border text-sm flex items-center gap-1"
                onClick={() => handleClick(item.id)}
              >
                <span>{item.name}</span>

                {hasChildren && <ChevronDown className="w-3 h-3" />}
              </button>

              {/* PANEL SOLO PARA ESTE BOTÓN */}
              {isActive && hasChildren && (
                <div className="absolute top-full left-0 mt-2 bg-card border rounded-xl shadow-lg z-50 flex">
                  {/* NIVEL 1 */}
                  <Column
                    items={item.subcategories}
                    level={1}
                    onHover={handleHover}
                    onClick={handleClick}
                  />

                  {/* NIVELES SIGUIENTES */}
                  {activePath.slice(1).map((sub, index) => {
                    if (!sub.subcategories?.length) return null;

                    return (
                      <Column
                        key={sub.id}
                        items={sub.subcategories}
                        level={index + 2}
                        onHover={handleHover}
                        onClick={handleClick}
                      />
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* PANEL MULTI-COLUMNA */}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Column = ({ items, level, onHover, onClick }: any) => {
  return (
    <div className="min-w-[220px] border-r last:border-r-0">
      <div className="p-2 max-h-[300px] overflow-y-auto">
        {items.map((item: CategoryUI) => (
          <div
            key={item.id}
            onMouseEnter={() => onHover(level, item)}
            onClick={() => onClick(item.id)}
            className="px-3 py-2 text-sm rounded-md hover:bg-muted cursor-pointer flex justify-between"
          >
            <span>{item.name}</span>
            {item.subcategories?.length > 0 && "›"}
          </div>
        ))}
      </div>
    </div>
  );
};
