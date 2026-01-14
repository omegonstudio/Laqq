import { useProductFilters } from "@/hooks/useFilters";
import { useAppSelector } from "@/store/hooks";
import { buildCategories } from "@/utils/data/categories";
import { useState } from "react";
import MenuItem from "../atoms/MenuItems";
import { ChevronDown } from "lucide-react";

const NavDropdown = () => {
  const { setFilter } = useProductFilters();
  const { list: categories } = useAppSelector((state) => state.categories);

  const menuItems = buildCategories(categories);

  const [openMap, setOpenMap] = useState<Record<string, boolean>>({});

  const open = (id: string) => setOpenMap((prev) => ({ ...prev, [id]: true }));

  const close = (id: string) =>
    setOpenMap((prev) => ({ ...prev, [id]: false }));

  return (
    <div className="flex gap-4">
      {menuItems.map((item) => (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => open(item.id)}
          onMouseLeave={() => close(item.id)}
        >
          {/* TRIGGER */}
          <button
            className="px-5 h-9 rounded-full border border-border text-sm uppercase flex items-center gap-1.5"
            onClick={() => setFilter("category", item.id)}
          >
            {item.name}
            {item.subcategories.length > 0 && (
              <ChevronDown className="w-3.5 h-3.5" />
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
  );
};

export default NavDropdown;
