export interface RRHHRecord {
  id: string;
  fecha: string;
  nombre: string;
  apellido: string;
  telefono: string;
  email: string;
  puesto: string;
  departamento: string;
}

export const rrhhData: RRHHRecord[] = [
  {
    id: "1",
    fecha: "2024-01-15",
    nombre: "María",
    apellido: "González",
    telefono: "+54 11 4567-8901",
    email: "mgonzalez@laqq.com.ar",
    puesto: "Gerente de Ventas",
    departamento: "Comercial",
  },
  {
    id: "2",
    fecha: "2024-02-20",
    nombre: "Juan",
    apellido: "Pérez",
    telefono: "+54 11 4567-8902",
    email: "jperez@laqq.com.ar",
    puesto: "Técnico de Soporte",
    departamento: "Técnico",
  },
  {
    id: "3",
    fecha: "2024-03-10",
    nombre: "Ana",
    apellido: "Martínez",
    telefono: "+54 11 4567-8903",
    email: "amartinez@laqq.com.ar",
    puesto: "Analista de Compras",
    departamento: "Logística",
  },
  {
    id: "4",
    fecha: "2024-04-05",
    nombre: "Carlos",
    apellido: "Rodríguez",
    telefono: "+54 11 4567-8904",
    email: "crodriguez@laqq.com.ar",
    puesto: "Especialista en Productos",
    departamento: "Comercial",
  },
];
