import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
}

const Logo = ({ className }: LogoProps) => {
  return (
    <Link to="/" className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center">
        <span className="text-2xl font-bold text-secondary">La</span>
        <span className="text-2xl font-bold text-primary">QQ</span>
      </div>
    </Link>
  );
};

export default Logo;
