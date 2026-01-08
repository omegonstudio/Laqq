import { useProductFilters } from "@/hooks/useFilters";
import { useAppSelector } from "@/store/hooks";
import { buildCategories } from "@/utils/data/categories";
import { useState } from "react";
import { Link } from "react-router-dom";

const NavDropdown = () => {
  const { setFilter } = useProductFilters();
  const { list: categories } = useAppSelector((state) => state.categories);
  const menuItems = buildCategories(categories);

  const [isOpen, setIsOpen] = useState<Record<number, boolean>>({});

  const handleMouseEnter = (index: number) => {
    setIsOpen((prev) => ({ ...prev, [index]: true }));
  };

  const handleMouseLeave = (index: number) => {
    setIsOpen((prev) => ({ ...prev, [index]: false }));
  };
  console.log(menuItems, "MENU ITEMS");
  return (
    <div className="flex gap-5">
      {menuItems.map((item, index) => (
        <div
          key={item.id}
          className="relative"
          onMouseEnter={() => handleMouseEnter(index)}
          onMouseLeave={() => handleMouseLeave(index)}
        >
          <button className="px-5 h-9 rounded-full bg-card border border-border text-sm text-foreground hover:bg-muted transition-colors uppercase tracking-wide">
            {item.name}
          </button>

          {isOpen[index] && item.subcategories && (
            <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-2xl shadow-lg z-50 min-w-[240px]">
              <div className="p-2">
                {item.subcategories.map((sub) => (
                  <Link
                    key={sub.id}
                    onClick={() => setFilter("category", sub.id)}
                    to="/products"
                  >
                    {sub.name}
                  </Link>
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
