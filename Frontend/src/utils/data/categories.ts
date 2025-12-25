import { Category, MenuItem } from "../../types/types";

export const categories: Category[] = [
  {
    id: "insumos",
    name: "Insumos",
    subcategories: [
      { id: "glassware", name: "Cristalería" },
      { id: "plasticware", name: "Material Plástico" },
      { id: "pipettes", name: "Pipetas y Puntas" },
      { id: "filters", name: "Filtros" },
      { id: "reagents", name: "Reactivos" },
    ],
  },
  {
    id: "equipos",
    name: "Equipos",
    subcategories: [
      { id: "microscopes", name: "Microscopios" },
      { id: "centrifuges", name: "Centrífugas" },
      { id: "incubators", name: "Incubadoras" },
      { id: "balances", name: "Balanzas" },
      { id: "spectrophotometers", name: "Espectrofotómetros" },
    ],
  },
  {
    id: "procesos",
    name: "Procesos",
    subcategories: [
      { id: "cell-culture", name: "Cultivo Celular" },
      { id: "chromatography", name: "Cromatografía" },
      { id: "molecular-biology", name: "Biología Molecular" },
      { id: "sample-prep", name: "Preparación de Muestras" },
      { id: "sterilization", name: "Esterilización" },
    ],
  },
  {
    id: "mobiliario",
    name: "Mobiliario",
    subcategories: [
      { id: "benches", name: "Mesas de trabajo" },
      { id: "cabinets", name: "Gabinetes" },
      { id: "fume-hoods", name: "Campanas de Extracción" },
      { id: "storage", name: "Almacenamiento" },
      { id: "seating", name: "Sillas de laboratorio" },
    ],
  },
  {
    id: "servicio-tecnico",
    name: "Servicio Técnico",
    subcategories: [
      { id: "mantenimiento", name: "Mantenimiento preventivo" },
      { id: "reparaciones", name: "Reparaciones" },
      { id: "calibraciones", name: "Calibraciones" },
      { id: "soporte", name: "Soporte técnico" },
    ],
  },
  {
    id: "nosotros",
    name: "Nosotros",
    subcategories: [
      { id: "certificados", name: "Certificados" },
      { id: "empresa", name: "Empresa" },
      { id: "representaciones", name: "Representaciones" },
      { id: "contacto", name: "Contacto" },
    ],
  },
];

export const menuItems: MenuItem[] = [
  {
    id: "insumos",
    name: "Insumos",
    href: "/products?category=insumos",
    subcategories: categories.find((c) => c.id === "insumos")?.subcategories,
  },
  {
    id: "equipos",
    name: "Equipos",
    href: "/products?category=equipos",
    subcategories: categories.find((c) => c.id === "equipos")?.subcategories,
  },
  {
    id: "procesos",
    name: "Procesos",
    href: "/products?category=procesos",
    subcategories: categories.find((c) => c.id === "procesos")?.subcategories,
  },
  {
    id: "mobiliario",
    name: "Mobiliario",
    href: "/products?category=mobiliario",
    subcategories: categories.find((c) => c.id === "mobiliario")?.subcategories,
  },
  {
    id: "servicio-tecnico",
    name: "Servicio Técnico",
    href: "/support",
    subcategories: categories.find((c) => c.id === "servicio-tecnico")
      ?.subcategories,
  },
  {
    id: "nosotros",
    name: "Nosotros",
    href: "/empresa",
    subcategories: categories.find((c) => c.id === "nosotros")?.subcategories,
  },
];
