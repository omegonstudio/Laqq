import { Brand } from "@/types/types";

interface BrandCardProps {
  brand: Brand;
}

const BrandCard = ({ brand }: BrandCardProps) => {
  return (
    <div className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow cursor-pointer">
      <div className="h-20 flex items-center justify-center mb-4">
        <span className="text-2xl font-bold text-secondary">{brand.name}</span>
      </div>
      <p className="text-sm text-muted-foreground text-center">
        {brand.description}
      </p>
    </div>
  );
};

export default BrandCard;
