export interface BackofficeMessage {
  id: string;
  empresa: string;
  apellido: string;
  nombre: string;
  pais: string;
  fecha: string;
  mensaje: string;
  estado: string;
}

export const mockMessages: BackofficeMessage[] = [
  {
    id: "1",
    empresa: "Laboratorio Central",
    apellido: "García",
    nombre: "Roberto",
    pais: "Argentina",
    fecha: "2024-01-20",
    mensaje: "Consulta sobre disponibilidad de pipetas automáticas",
    estado: "Nuevo"
  },
  {
    id: "2",
    empresa: "Hospital Provincial",
    apellido: "Sánchez",
    nombre: "Elena",
    pais: "Chile",
    fecha: "2024-01-19",
    mensaje: "Solicitud de catálogo actualizado de mobiliario",
    estado: "Respondido"
  },
  {
    id: "3",
    empresa: "Instituto de Investigación",
    apellido: "Torres",
    nombre: "Miguel",
    pais: "Uruguay",
    fecha: "2024-01-18",
    mensaje: "Consulta técnica sobre equipos de cromatografía",
    estado: "Nuevo"
  },
  {
    id: "4",
    empresa: "Clínica San José",
    apellido: "Ramírez",
    nombre: "Patricia",
    pais: "Paraguay",
    fecha: "2024-01-17",
    mensaje: "Solicitud de presupuesto para reactivos",
    estado: "Respondido"
  },
  {
    id: "5",
    empresa: "Universidad Nacional",
    apellido: "Morales",
    nombre: "Diego",
    pais: "Argentina",
    fecha: "2024-01-16",
    mensaje: "Consulta sobre certificaciones ISO",
    estado: "Nuevo"
  }
];
