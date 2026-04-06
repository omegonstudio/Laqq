import { useProductFilters } from "@/hooks/useFilters";
import { useAppSelector } from "@/store/hooks";
import { buildCategories } from "@/utils/data/categories";
import { useEffect, useState } from "react";
import MenuItem from "../atoms/MenuItems";
import { ChevronDown } from "lucide-react";

const NavDropdown = () => {
  const { setFilter, searchParams } = useProductFilters();
  const { list: categories } = useAppSelector((state) => state.categories);
  const menuItems = buildCategories(categories);

  const activeCategoryId = searchParams.get("category");

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile screen
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const open = (id: string) => setOpenMap((prev) => ({ ...prev, [id]: true }));

  const close = (id: string) =>
    setOpenMap((prev) => ({ ...prev, [id]: false }));

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

  return (
    <>
      {/* Desktop Navigation */}
      <div className="hidden md:flex gap-2 lg:gap-4">
        {menuItems.map((item) => (
          <div
            key={item.id}
            className="relative"
            onMouseEnter={() => open(item.id)}
            onMouseLeave={() => close(item.id)}
          >
            {/* TRIGGER */}
            <button
              className={`px-3 lg:px-5 h-9 rounded-full border text-xs lg:text-sm uppercase flex items-center gap-1 lg:gap-1.5 whitespace-nowrap transition-all duration-300 ${
                activeCategoryId === item.id
                  ? "border-primary bg-primary text-primary-foreground shadow-md scale-105"
                  : "border-border hover:border-primary/50 hover:bg-primary/5"
              }`}
              onClick={() => setFilter("category", item.id)}
            >
              {item.name}
              {item.subcategories.length > 0 && (
                <ChevronDown className="w-3 h-3 lg:w-3.5 lg:h-3.5" />
              )}
            </button>

            {/* PANEL */}
            {openMap[item.id] && item.subcategories.length > 0 && (
              <div className="absolute top-full left-0 bg-card border border-border rounded-2xl shadow-lg min-w-[240px] z-50 pt-2">
                <div className="p-2 space-y-1">
                  {item.subcategories.map((sub) => (
                    <MenuItem
                      key={sub.id}
                      item={sub}
                      open={open}
                      close={close}
                      openMap={openMap}
                      setFilter={setFilter}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Mobile Navigation */}
      <div className="flex md:hidden">
        <div className="flex flex-wrap gap-2 justify-center">
          {menuItems.map((item) => (
            <div key={item.id} className="relative">
              {/* TRIGGER */}
              <button
                className={`px-3 h-8 rounded-full border text-xs uppercase flex items-center gap-1 whitespace-nowrap transition-colors ${
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
                <div className="absolute top-full left-0 mt-1 bg-card border border-border rounded-xl shadow-lg min-w-[200px] max-w-[280px] z-50">
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
};

// Mobile-specific MenuItem component
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

export default NavDropdown;
