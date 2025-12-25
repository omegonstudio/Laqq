export interface Contact {
  id: number;
  empresa: string;
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  pais: string;
  mensaje: string;
  fecha: string;
  estado: string;
}

export const mockContacts: Contact[] = [
  {
    id: 1,
    empresa: "Hospital San Juan",
    nombre: "María",
    apellido: "González",
    email: "mgonzalez@hsanjuan.com",
    telefono: "+54 11 4567-8901",
    pais: "Argentina",
    mensaje: "Consulta sobre equipamiento para laboratorio",
    fecha: "2024-01-15",
    estado: "Nuevo"
  },
  {
    id: 2,
    empresa: "Lab Tech SA",
    nombre: "Carlos",
    apellido: "Rodríguez",
    email: "crodriguez@labtech.com",
    telefono: "+54 11 4567-8902",
    pais: "Argentina",
    mensaje: "Necesito información sobre agitadores magnéticos",
    fecha: "2024-01-14",
    estado: "Respondido"
  },
  {
    id: 3,
    empresa: "Universidad Nacional",
    nombre: "Ana",
    apellido: "Martínez",
    email: "amartinez@univ.edu",
    telefono: "+54 11 4567-8903",
    pais: "Argentina",
    mensaje: "Cotización para material de vidrio",
    fecha: "2024-01-13",
    estado: "Nuevo"
  },
  {
    id: 4,
    empresa: "Clínica del Valle",
    nombre: "Roberto",
    apellido: "López",
    email: "rlopez@clinicavalle.com",
    telefono: "+54 11 4567-8904",
    pais: "Argentina",
    mensaje: "Consulta sobre mobiliario de laboratorio",
    fecha: "2024-01-12",
    estado: "En proceso"
  }
];
