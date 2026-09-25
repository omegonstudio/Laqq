import { Fragment } from "react";
import { Link } from "react-router-dom";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import type { CatalogCrumb } from "@/utils/data/categories";
import { cn } from "@/lib/utils";

interface CatalogBreadcrumbProps {
  items: CatalogCrumb[];
  className?: string;
}

const CatalogBreadcrumb = ({ items, className }: CatalogBreadcrumbProps) => {
  if (!items.length) return null;

  return (
    <Breadcrumb className={cn("mb-6", className)}>
      <BreadcrumbList>
        {items.map((item, index) => (
          <Fragment key={`${item.label}-${index}`}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {item.href ? (
                <BreadcrumbLink asChild>
                  <Link to={item.href}>{item.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage className="max-w-[40ch] truncate">
                  {item.label}
                </BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  );
};

export default CatalogBreadcrumb;
