import { Link } from "react-router-dom";
import Button from "../atoms/Button";
import SearchBar from "../molecules/SearchBar";
import { useNavigate } from "react-router-dom";
import heroImage from "@/assets/hero-lab.jpg";
import { useProductFilters } from "@/hooks/useFilters";

const HeroSection = () => {
  const { setFilter } = useProductFilters();

  const handleViewAllResults = (query: string) => {
    setFilter("search", query);
  };
  return (
    <section className="relative min-h-[600px] flex items-center justify-center bg-gradient-to-b from-background to-muted/20">
      {/* Background image with gradient overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={heroImage}
          alt="Laboratorio moderno"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-white/80 via-white/70 to-white/90 dark:from-background/90 dark:via-background/80 dark:to-background/95" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-3xl mx-auto text-center">
          <h1 className="text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            Equipos y Consumibles
            <br />
            <span className="text-foreground">para </span>
            <span className="text-primary">Laboratorio Científico</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
            Proveedor especializado en equipo de laboratorio, material de
            consumo y servicios técnicos para la industria científica
          </p>

          <div className="max-w-2xl mx-auto">
            {" "}
            <SearchBar
              debounceMs={300}
              maxResults={10}
              onViewAllResults={handleViewAllResults}
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 pt-4">
            <Link to="/products">
              <Button size="lg" className="px-8">
                Explorar Productos
              </Button>
            </Link>
            <Link to="/contact">
              <Button
                variant="outline"
                size="lg"
                className="px-8 bg-white/80 dark:bg-background/80 backdrop-blur-sm"
              >
                Contactar
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
