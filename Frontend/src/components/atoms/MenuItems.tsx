import { CategoryUI } from "@/types/types";
import { ChevronRight } from "lucide-react";

type MenuItemProps = {
  item: CategoryUI;
  open: (id: string) => void;
  close: (id: string) => void;
  openMap: Record<string, boolean>;
  setFilter: (key: string, value: string) => void;
};

const MenuItem = ({ item, open, close, openMap, setFilter }: MenuItemProps) => {
  const isOpen = openMap[item.id];
  const hasChildren = item.subcategories.length > 0;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Siempre navega al hacer clic, tenga o no hijos
    setFilter("category", item.id);
  };

  const handleMouseEnter = () => {
    if (hasChildren) {
      open(item.id);
    }
  };

  const handleMouseLeave = () => {
    if (hasChildren) {
      close(item.id);
    }
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <button
        className="w-full text-left px-4 py-2 text-sm hover:bg-muted rounded-lg flex items-center justify-between group/item"
        onClick={handleClick}
      >
        <span>{item.name}</span>
        {hasChildren && (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {hasChildren && isOpen && (
        <div className="absolute left-full -top-2 pl-2 z-50">
          <div className="bg-card border border-border rounded-xl shadow-lg min-w-[220px]">
            <div className="p-2 space-y-1">
              {item.subcategories.map((child) => (
                <MenuItem
                  key={child.id}
                  item={child}
                  open={open}
                  close={close}
                  openMap={openMap}
                  setFilter={setFilter}
                />
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MenuItem;
