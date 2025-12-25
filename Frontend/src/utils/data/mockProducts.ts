import { Product } from "../../types/types";

export const mockProducts: Product[] = [
  {
    id: "celstir",
    name: "Frascos para cultivo celular Celstir",
    brand: "WHEATON",
    category: "cell-culture",
    description:
      "Frascos para suspensiones de cultivo celular con agitación magnética. Ideales para cultivos en suspensión con control preciso.",
    specs: [
      {
        volume: "25 ml",
        dimensions: "38 x 122 mm",
        cap: "38-430",
        outlet: "15-415",
        code: "356873",
      },
      {
        volume: "125 ml",
        dimensions: "65 x 155 mm",
        cap: "51-400",
        outlet: "33-430",
        code: "356876",
      },
      {
        volume: "250 ml",
        dimensions: "75 x 180 mm",
        cap: "51-400",
        outlet: "33-430",
        code: "356878",
      },
    ],
    related: [
      {
        code: "bioMIX 1",
        brand: "2mag",
        description: "Agitador magnético para cultivos celulares y tejidos.",
      },
      {
        code: "bioMIXdrive",
        brand: "2mag",
        description:
          "Sistema de agitación múltiple para aplicaciones de cultivo.",
      },
    ],
    image: "/src/assets/celstir.png",
  },
  {
    id: "celstir-jacketed",
    name: "Frascos para cultivo celular Celstir Enchaquetados",
    brand: "WHEATON",
    category: "cell-culture",
    description:
      "Frascos con chaqueta térmica para control de temperatura en cultivos celulares. Permite mantener condiciones óptimas durante todo el proceso.",
    specs: [
      {
        volume: "250 ml",
        dimensions: "85 x 175 mm",
        cap: "51-400",
        outlet: "33-430",
        code: "356879",
      },
      {
        volume: "500 ml",
        dimensions: "110 x 190 mm",
        cap: "100-400",
        outlet: "45 mm",
        code: "356882",
      },
      {
        volume: "1000 ml",
        dimensions: "135 x 220 mm",
        cap: "100-400",
        outlet: "45 mm",
        code: "356885",
      },
    ],
    related: [
      {
        code: "bioMIXdrive",
        brand: "2mag",
        description: "Agitador magnético multiposición para tejidos.",
      },
      {
        code: "TC-150",
        brand: "LabTech",
        description: "Controlador de temperatura para chaquetas térmicas.",
      },
    ],
    image: "/src/assets/celstir-jacketed.png",
  },
  {
    id: "micropipettes",
    name: "Micropipetas de Volumen Variable",
    brand: "Eppendorf",
    category: "consumables",
    description:
      "Micropipetas de alta precisión para aplicaciones de laboratorio. Ergonómicas y confiables.",
    specs: [
      {
        volume: "0.5-10 µL",
        accuracy: "±2.5%",
        precision: "±1.0%",
        code: "EP-010",
      },
      {
        volume: "10-100 µL",
        accuracy: "±1.0%",
        precision: "±0.6%",
        code: "EP-100",
      },
      {
        volume: "100-1000 µL",
        accuracy: "±0.8%",
        precision: "±0.3%",
        code: "EP-1000",
      },
    ],
    related: [
      {
        code: "TIP-10",
        brand: "Eppendorf",
        description: "Puntas para micropipeta 0.5-10 µL, estériles.",
      },
      {
        code: "TIP-1000",
        brand: "Eppendorf",
        description: "Puntas para micropipeta 100-1000 µL, estériles.",
      },
    ],
    image: "/src/assets/celstir.png",
  },
];
