export interface BackofficeQuote {
  id: string;
  numero: string;
  empresa: string;
  pais: string;
  email: string;
  usuario: string;
  fecha: string;
  tipo: string;
  estado: string;
}

export const mockQuotes: BackofficeQuote[] = [
  {
    id: "1",
    numero: "COT-2024-001",
    empresa: "Laboratorio San Martín",
    pais: "Argentina",
    email: "contacto@labsanmartin.com",
    usuario: "Ana López",
    fecha: "2024-01-15",
    tipo: "Equipamiento",
    estado: "Pendiente"
  },
  {
    id: "2",
    numero: "COT-2024-002",
    empresa: "Hospital Central",
    pais: "Chile",
    email: "compras@hospitalcentral.cl",
    usuario: "Pedro Ruiz",
    fecha: "2024-01-14",
    tipo: "Insumos",
    estado: "Enviada"
  },
  {
    id: "3",
    numero: "COT-2024-003",
    empresa: "BioLab Research",
    pais: "Uruguay",
    email: "info@biolabresearch.uy",
    usuario: "María Silva",
    fecha: "2024-01-13",
    tipo: "Procesos",
    estado: "Confirmada"
  },
  {
    id: "4",
    numero: "COT-2024-004",
    empresa: "Clínica Norte",
    pais: "Paraguay",
    email: "adquisiciones@clinicanorte.py",
    usuario: "Jorge Méndez",
    fecha: "2024-01-12",
    tipo: "Mobiliario",
    estado: "Pendiente"
  },
  {
    id: "5",
    numero: "COT-2024-005",
    empresa: "Universidad Tecnológica",
    pais: "Argentina",
    email: "laboratorio@utn.edu.ar",
    usuario: "Laura Díaz",
    fecha: "2024-01-11",
    tipo: "Equipamiento",
    estado: "Enviada"
  }
];
