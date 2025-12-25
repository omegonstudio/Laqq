export interface State {
  id: string;
  name: string;
  description: string;
}

export const states: State[] = [
  { id: "1", name: "Activo", description: "Elemento activo y disponible" },
  { id: "2", name: "Inactivo", description: "Elemento temporalmente inactivo" },
  { id: "3", name: "Suspendido", description: "Elemento suspendido por revisión" },
  { id: "4", name: "Descontinuado", description: "Elemento descontinuado" },
];
