import { Product } from "../../types/types";

export const mockProducts: Product[] = [
  {
    id: "celstir",
    name: "Frascos para cultivo celular Celstir",
    brand: "WHEATON",
    brand_id: "brand-wheaton",
    category: "cell-culture",
    category_id: "cat-cell",
    description:
      "Frascos para suspensiones de cultivo celular con agitación magnética. Ideales para cultivos en suspensión con control preciso.",
    specs: [
      { key: "Código", value: "356873" },
      { key: "Volumen", value: "25 ml" },
      { key: "Dimensiones", value: "38 x 122 mm" },
      { key: "Tapa", value: "38-430" },
      { key: "Salida", value: "15-415" },
    ],
    related: [
      {
        id: "bioMIX1",
        product_code: "bioMIX 1",
        brand: "2mag",
        name: "Agitador magnético bioMIX 1",
      },
      {
        id: "bioMIXdrive",
        product_code: "bioMIXdrive",
        brand: "2mag",
        name: "Sistema de agitación múltiple",
      },
    ],
    image: "/src/assets/celstir.png",
  },
  {
    id: "celstir-jacketed",
    name: "Frascos para cultivo celular Celstir Enchaquetados",
    brand: "WHEATON",
    brand_id: "brand-wheaton",
    category: "cell-culture",
    category_id: "cat-cell",
    description:
      "Frascos con chaqueta térmica para control de temperatura en cultivos celulares. Permite mantener condiciones óptimas durante todo el proceso.",
    specs: [
      { key: "Código", value: "356879" },
      { key: "Volumen", value: "250 ml" },
      { key: "Dimensiones", value: "85 x 175 mm" },
      { key: "Salida", value: "45 mm" },
    ],
    related: [
      {
        id: "bioMIXdrive",
        product_code: "bioMIXdrive",
        brand: "2mag",
        name: "Agitador magnético multiposición",
      },
      {
        id: "TC-150",
        product_code: "TC-150",
        brand: "LabTech",
        name: "Controlador de temperatura para chaquetas térmicas",
      },
    ],
    image: "/src/assets/celstir-jacketed.png",
  },
  {
    id: "micropipettes",
    name: "Micropipetas de Volumen Variable",
    brand: "Eppendorf",
    brand_id: "brand-eppendorf",
    category: "consumables",
    category_id: "cat-consumables",
    description:
      "Micropipetas de alta precisión para aplicaciones de laboratorio. Ergonómicas y confiables.",
    specs: [
      { key: "Rango", value: "0.5-10 µL", unit: "µL" },
      { key: "Precisión", value: "±1.0%" },
      { key: "Código", value: "EP-010" },
      { key: "Rango alto", value: "10-100 µL" },
    ],
    related: [
      {
        id: "TIP-10",
        product_code: "TIP-10",
        brand: "Eppendorf",
        name: "Puntas 0.5-10 µL",
      },
      {
        id: "TIP-1000",
        product_code: "TIP-1000",
        brand: "Eppendorf",
        name: "Puntas 100-1000 µL",
      },
    ],
    image: "/src/assets/celstir.png",
  },
];
