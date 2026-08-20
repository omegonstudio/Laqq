import { MessageCircle } from "lucide-react";

const PHONE = "5491131040495"; 
const MESSAGE = "Hola! Quisiera recibir información sobre sus soluciones para laboratorios e industrias.";

const WhatsAppFloat = () => {
  const url = `https://wa.me/${PHONE}?text=${encodeURIComponent(MESSAGE)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-2 rounded-full shadow-lg transition-all duration-300 hover:scale-110 min-h-11 min-w-11 inline-flex items-center justify-center"
      aria-label="Contactar por WhatsApp"
    >
   <img
     src="/WhatsApp.webp"
     alt=""
     width={40}
     height={40}
     loading="lazy"
     decoding="async"
     className="h-10 w-10 object-contain opacity-80 transition-opacity group-hover:opacity-100"
   />    
    </a>
  );
};

export default WhatsAppFloat;
