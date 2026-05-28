"use client";

import { useEffect, useMemo, useState } from "react";
import { useProductFilters } from "@/hooks/useFilters";
import { useAppDispatch, useAppSelector } from "@/store/hooks";
import { CategoryUI } from "@/types/types";
import { ChevronDown } from "lucide-react";
import { SkeletonMenu } from "../atoms/SkeletonMenu";
import { fetchAllCategories } from "@/store/categoriesSlice";
import { buildCategories } from "@/utils/data/categories";
import {
  selectCategoryMenuItems,
  selectCategoriesUiState,
} from "@/store/selectors/categoriesSelectors";

export default function NavDropdown() {
  const dispatch = useAppDispatch();
  const { setFilter } = useProductFilters();
  const menuItems = useAppSelector(selectCategoryMenuItems);
  const categoriesUi = useAppSelector(selectCategoriesUiState);
  const menuReady = !categoriesUi.loading && menuItems.length > 0;

  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);
  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

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

  const toggle = (id: string) =>
    setOpenMap((prev) => ({ ...prev, [id]: !prev[id] }));

  const closeAll = () => setOpenMap({});
  const handleCategoryClick = (item: (typeof menuItems)[0]) => {
    if (isMobile && item.subcategories.length > 0) {
      toggle(item.id);
    } else {
      setFilter("category", item.id);
      closeAll();
    }
  };
  const handleRetry = () => {
    dispatch(fetchAllCategories({ retries: 2, retryDelayMs: 350 }));
  };

  if (categoriesUi.loading) {
    return <SkeletonMenu />;
  }

  if (categoriesUi.isError) {
    return (
      <div className="w-full flex items-center justify-center gap-2 py-2 text-xs">
        <span className="text-destructive">No se pudo cargar categorías.</span>
        <button
          className="px-2 py-1 rounded-md border border-border hover:bg-muted transition-colors"
          onClick={handleRetry}
        >
          Reintentar
        </button>
      </div>
    );
  }

  if (!menuReady) {
    return (
      <div className="w-full flex items-center justify-center py-2 text-xs text-muted-foreground">
        No hay categorías disponibles.
      </div>
    );
  }

  return (
    <>
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
                  <div className="absolute top-full left-0 bg-card border rounded-xl shadow-lg z-50 flex">
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
      <div className="gap-2 justify-center w-full flex md:hidden">
        {menuItems.map((item) => (
          <div key={item.id} className="relative">
            {/* TRIGGER */}
            <button
              className={`px-3 h-8 rounded-full border text-xs w-full flex items-center gap-1 whitespace-nowrap truncate min-w-0 transition-colors ${
                openMap[item.id]
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border"
              }`}
              onClick={() => handleCategoryClick(item)}
            >
              {item.name}
              {item.subcategories.length > 0 && (
                <ChevronDown
                  className={`w-3 h-3 transition-transform ${
                    openMap[item.id] ? "rotate-180" : ""
                  }`}
                />
              )}
            </button>

            {/* MOBILE PANEL */}
            {openMap[item.id] && item.subcategories.length > 0 && (
              <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg min-w-[200px] max-w-[280px] z-50 ">
                <div className="p-2 space-y-1 max-h-[300px] overflow-y-auto">
                  {/* Ver todo button */}
                  <button
                    className="w-full text-left px-3 py-2 text-xs font-medium text-primary hover:bg-muted rounded-lg transition-colors"
                    onClick={() => {
                      setFilter("category", item.id);
                      closeAll();
                    }}
                  >
                    Ver todo en {item.name}
                  </button>
                  <div className="border-t border-border my-1" />
                  {item.subcategories.map((sub) => (
                    <MobileMenuItem
                      key={sub.id}
                      item={sub}
                      openMap={openMap}
                      toggle={toggle}
                      setFilter={setFilter}
                      closeAll={closeAll}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Backdrop for mobile */}
      {isMobile && Object.values(openMap).some(Boolean) && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          onClick={closeAll}
          aria-hidden="true"
        />
      )}
    </>
  );
}
interface MobileMenuItemProps {
  item: {
    id: string;
    name: string;
    subcategories: MobileMenuItemProps["item"][];
  };
  openMap: Record<string, boolean>;
  toggle: (id: string) => void;
  setFilter: (key: string, value: string) => void;
  closeAll: () => void;
  depth?: number;
}

const MobileMenuItem = ({
  item,
  openMap,
  toggle,
  setFilter,
  closeAll,
  depth = 0,
}: MobileMenuItemProps) => {
  const hasChildren = item.subcategories.length > 0;
  const isOpen = openMap[item.id];

  return (
    <div>
      <button
        className={`w-full text-left px-3 py-2 text-xs hover:bg-muted rounded-lg transition-colors flex items-center justify-between ${
          depth > 0 ? "pl-5" : ""
        }`}
        onClick={() => {
          if (hasChildren) {
            toggle(item.id);
          } else {
            setFilter("category", item.id);
            closeAll();
          }
        }}
      >
        <span>{item.name}</span>
        {hasChildren && (
          <ChevronDown
            className={`w-3 h-3 transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        )}
      </button>

      {isOpen && hasChildren && (
        <div className="ml-2 border-l border-border pl-2 space-y-1">
          {item.subcategories.map((sub) => (
            <MobileMenuItem
              key={sub.id}
              item={sub}
              openMap={openMap}
              toggle={toggle}
              setFilter={setFilter}
              closeAll={closeAll}
              depth={depth + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
};
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
