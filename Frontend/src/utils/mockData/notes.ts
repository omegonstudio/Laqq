export interface BackofficeNote {
  id: string;
  titulo: string;
  fecha: string;
  resumen: string;
  tipo: string;
  estado: string;
  autor: string;
}

export const mockNotes: BackofficeNote[] = [
  {
    id: "1",
    titulo: "Nuevos productos Wheaton disponibles",
    fecha: "2024-01-20",
    resumen: "Incorporamos la nueva línea de frascos Celstir con tecnología avanzada para cultivos celulares.",
    tipo: "Producto",
    estado: "Publicado",
    autor: "Admin"
  },
  {
    id: "2",
    titulo: "Actualización de certificaciones ISO",
    fecha: "2024-01-18",
    resumen: "Renovamos nuestras certificaciones ISO 9001 y ISO 14001 para garantizar la calidad.",
    tipo: "Empresa",
    estado: "Publicado",
    autor: "Admin"
  },
  {
    id: "3",
    titulo: "Próxima participación en ExpoLab 2024",
    fecha: "2024-01-15",
    resumen: "Estaremos presentes en la feria ExpoLab 2024 con novedades en equipamiento.",
    tipo: "Evento",
    estado: "Borrador",
    autor: "Admin"
  },
  {
    id: "4",
    titulo: "Promoción especial en reactivos Fisher",
    fecha: "2024-01-12",
    resumen: "Descuentos especiales en toda la línea de reactivos Fisher durante enero.",
    tipo: "Promoción",
    estado: "Publicado",
    autor: "Admin"
  },
  {
    id: "5",
    titulo: "Webinar: Técnicas avanzadas de cultivo celular",
    fecha: "2024-01-10",
    resumen: "Invitamos a un webinar gratuito sobre técnicas de cultivo celular con expertos.",
    tipo: "Capacitación",
    estado: "Publicado",
    autor: "Admin"
  }
];
