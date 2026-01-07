export interface BackofficeUser {
  id: string;
  nombre: string;
  apellido: string;
  nick: string;
  email: string;
  tipo: string;
  estado: string;
}

export const mockUsers: BackofficeUser[] = [
  {
    id: "1",
    nombre: "Juan",
    apellido: "Pérez",
    nick: "jperez",
    email: "jperez@laqq.com",
    tipo: "Administrador",
    estado: "Activo"
  },
  {
    id: "2",
    nombre: "María",
    apellido: "González",
    nick: "mgonzalez",
    email: "mgonzalez@laqq.com",
    tipo: "Editor",
    estado: "Activo"
  },
  {
    id: "3",
    nombre: "Carlos",
    apellido: "Rodríguez",
    nick: "crodriguez",
    email: "crodriguez@laqq.com",
    tipo: "Vendedor",
    estado: "Activo"
  },
  {
    id: "4",
    nombre: "Ana",
    apellido: "Martínez",
    nick: "amartinez",
    email: "amartinez@laqq.com",
    tipo: "Editor",
    estado: "Inactivo"
  },
  {
    id: "5",
    nombre: "Luis",
    apellido: "Fernández",
    nick: "lfernandez",
    email: "lfernandez@laqq.com",
    tipo: "Vendedor",
    estado: "Activo"
  }
];
