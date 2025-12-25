import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { MenuItem } from "@/types/types";
import { cn } from "@/lib/utils";

interface NavDropdownProps {
  item: MenuItem;
}

const NavDropdown = ({ item }: NavDropdownProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="relative"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      <button className="px-5 h-9 rounded-full bg-card border border-border text-sm text-foreground hover:bg-muted transition-colors uppercase tracking-wide">
        {item.name}
      </button>

      {isOpen && item.subcategories && (
        <div className="absolute top-full left-0 mt-2 bg-card border border-border rounded-2xl shadow-lg z-50 min-w-[240px]">
          <div className="p-2">
            {item.subcategories.map((sub) => (
              <Link
                key={sub.id}
                to={`/products?category=${sub.id}`}
                className="block px-4 py-2.5 rounded-xl text-sm hover:bg-muted transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NavDropdown;
