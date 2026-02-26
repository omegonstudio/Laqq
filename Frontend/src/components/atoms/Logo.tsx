import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

interface LogoProps {
  className?: string;
  variant?: "auto" | "light" | "dark";
  showLink?: boolean;
}

const Logo = ({
  className,
  variant = "auto",
  showLink = true,
}: LogoProps) => {
  const { resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  let logoSrc = "/laqq_marca_color_pos.svg"; // default claro

  if (variant === "light") {
    logoSrc = "/laqq_marca_color_pos.svg";
  } else if (variant === "dark") {
    logoSrc = "/laqq_marca_color_neg.svg";
  } else if (variant === "auto" && mounted) {
    logoSrc =
      resolvedTheme === "dark"
        ? "/laqq_marca_color_neg.svg"
        : "/laqq_marca_color_pos.svg";
  }

  const logo = (
    <img
      src={logoSrc}
      alt="La Química Quirúrgica"
      className={cn("h-9 w-auto transition-opacity duration-200", className)}
      draggable={false}
    />
  );

  if (!showLink) return logo;

  return (
    <Link to="/" className="flex items-center">
      {logo}
    </Link>
  );
};

export default Logo;