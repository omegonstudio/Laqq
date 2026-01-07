export interface Type {
  id: string;
  name: string;
  category: string;
}

export const types: Type[] = [
  { id: "1", name: "Plástico", category: "Material" },
  { id: "2", name: "Vidrio", category: "Material" },
  { id: "3", name: "Metal", category: "Material" },
  { id: "4", name: "Electrónico", category: "Equipamiento" },
  { id: "5", name: "Mecánico", category: "Equipamiento" },
  { id: "6", name: "Químico", category: "Reactivo" },
  { id: "7", name: "Biológico", category: "Reactivo" },
];
