export interface Accessory {
  id: string;
  codigo: string;
  marca: string;
  modelo: string;
  descripcion: string;
  categoria: string;
  precio?: number;
}

export const accessories: Accessory[] = [
  {
    id: "1",
    codigo: "ACC-001",
    marca: "Thermo Fisher",
    modelo: "TS-100",
    descripcion: "Tapa para tubo centrífuga 50ml",
    categoria: "Consumibles",
  },
  {
    id: "2",
    codigo: "ACC-002",
    marca: "Eppendorf",
    modelo: "EP-200",
    descripcion: "Adaptador para micropipeta 10μl",
    categoria: "Pipeteo",
  },
  {
    id: "3",
    codigo: "ACC-003",
    marca: "Corning",
    modelo: "CRN-450",
    descripcion: "Filtro HEPA para campana",
    categoria: "Seguridad",
  },
  {
    id: "4",
    codigo: "ACC-004",
    marca: "Mettler Toledo",
    modelo: "MT-350",
    descripcion: "Cable de calibración para balanza",
    categoria: "Equipamiento",
  },
  {
    id: "5",
    codigo: "ACC-005",
    marca: "VWR",
    modelo: "VWR-780",
    descripcion: "Set de juntas para autoclave",
    categoria: "Mantenimiento",
  },
];
