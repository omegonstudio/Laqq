import { Link } from "react-router-dom";
import { Facebook, Twitter, Linkedin, Instagram } from "lucide-react";
import Logo from "../atoms/Logo";
import { buildCategories } from "@/utils/data/categories";
import { useAppSelector } from "@/store/hooks";
import { useProductFilters } from "@/hooks/useFilters";

const Footer = () => {
  const { list: categories } = useAppSelector((state) => state.categories);
  const { setFilter } = useProductFilters();

  const menuItems = buildCategories(categories);
  return (
    <footer className="bg-secondary text-secondary-foreground pt-16 pb-8">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-4 gap-8 mb-12">
          <div>
            <Logo variant="dark" showLink={false} /> 
                        <p className="text-sm opacity-80">
              Proveedor especializado en equipo de laboratorio y servicios
              técnicos
            </p>
          </div>

          <div>
            <h3 className="font-bold mb-4">Productos</h3>
            <ul className="space-y-2 text-sm">
              {menuItems.map((item) => (
                <li>
                  {" "}
                  <p
                    onClick={() => setFilter("category", item.id)}
                    className="opacity-80 hover:opacity-100 hover:underline transition-opacity cursor-pointer"
                  >
                    {item.name}
                  </p>
                </li>
              ))}
            </ul>
            {/* <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/products?category=consumables"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Material de Consumo
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=equipment"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Equipos
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=processes"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Procesos
                </Link>
              </li>
              <li>
                <Link
                  to="/products?category=furniture"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Mobiliario
                </Link>
              </li>
            </ul> */}
          </div>

          <div>
            <h3 className="font-bold mb-4">Servicios</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/quote"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Cotizaciones
                </Link>
              </li>
              <li>
                <Link
                  to="/support"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Servicio Técnico
                </Link>
              </li>
              <li>
                <Link
                  to="/certificates"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Certificados
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4">Empresa</h3>
            <ul className="space-y-2 text-sm">
              <li>
                <Link
                  to="/company"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Sobre Nosotros
                </Link>
              </li>
              <li>
                <Link
                  to="/contact"
                  className="opacity-80 hover:opacity-100 transition-opacity"
                >
                  Contacto
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-secondary-foreground/20 pt-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm opacity-80">
              © 2025 La Química Quirúrgica. Todos los derechos reservados.
            </p>

            {/*  <div className="flex gap-4">
              <a
                href="#"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="opacity-80 hover:opacity-100 transition-opacity"
              >
                <Instagram className="w-5 h-5" />
              </a>
            </div> */}
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
