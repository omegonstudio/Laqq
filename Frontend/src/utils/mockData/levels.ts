export interface Level {
  id: string;
  name: string;
  permissions: string[];
}

export const levels: Level[] = [
  { 
    id: "1", 
    name: "Acceso Total", 
    permissions: ["read", "write", "delete", "admin"] 
  },
  { 
    id: "2", 
    name: "Solo Pedidos", 
    permissions: ["read", "create_quote"] 
  },
  { 
    id: "3", 
    name: "Consulta", 
    permissions: ["read"] 
  },
];
