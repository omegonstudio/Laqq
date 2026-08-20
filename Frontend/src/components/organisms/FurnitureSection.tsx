"use client";

import { useState } from "react";
import { Download } from "lucide-react";

const whyChoose = [
  {
    title: "Durabilidad",
    description:
      "Los gabinetes de acero representan la opción más segura por su resistencia química, robustez y baja carga de fuego.",
  },
  {
    title: "Flexibilidad",
    description:
      "Un sistema modular que se adapta a procesos cambiantes y reconfiguraciones o ampliaciones futuras del laboratorio.",
  },
  {
    title: "Seguridad",
    description:
      "Armarios de almacenamiento de sustancias peligrosas y campanas extractoras de gases que cumplen con normativas internacionales.",
  },
  {
    title: "Eficiencia",
    description:
      "Superficies de trabajo adecuadas al requerimiento químico, y sistemas integrados para una distribución simple y accesible de agua, gases y electricidad.",
  },
];

const cards = [
  {
    title: "GABINETES Y MESADAS",
    image: "/Koettermann_Labor_C_09.webp",
    pdf: "/pdfs/Koettermann_MOBILIARIO.pdf",
  },
  {
    title: "DUCTOS DE SERVICIOS",
    image: "/carrusel1.webp",
    pdf: "/pdfs/Koettermann_SERVICIOS.pdf",
  },
  {
    title: "CAMPANAS EXTRACTORAS",
    image: "/carrusel2.webp",
    pdf: "/pdfs/Koettermann_CAMARAS.pdf",
  },
];

// TODO: reemplazar por las imágenes numeradas "1 Carrousel", "2 Carrousel", etc.
// que Kottermann envió, respetando ese orden.
const carouselImages = ["/carrusel1.webp" , "/carrusel2.webp", "/carrusel3.webp", "/carrusel4.webp"];

const FurnitureSection = () => {
  const [current, setCurrent] = useState(0);

  const goPrev = () =>
    setCurrent((prev) => (prev === 0 ? carouselImages.length - 1 : prev - 1));
  const goNext = () =>
    setCurrent((prev) => (prev === carouselImages.length - 1 ? 0 : prev + 1));

  return (
    <section className="w-full bg-gray-100 dark:bg-neutral-900 py-24">
    <div className="container mx-auto px-6 max-w-7xl">
      {/* HEADER */}
      <div className="mb-16 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="max-w-3xl">
          <h2 className="text-5xl font-light mb-6 text-gray-900 dark:text-white">
            Mobiliario para laboratorios
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
            Soluciones diseñadas para crear espacios funcionales, seguros y
            eficientes, adaptados a las necesidades de cada laboratorio y
            entorno de trabajo.
          </p>
          </div>
          <div className="flex justify-between items-center">
                {/* LOGO */}
          <a
              href="https://www.koettermann.com/es/"
              target="_blank"
              rel="noopener noreferrer"
              className=" dark:bg-neutral-100 rounded-2xl p-8 flex items-center justify-center shadow-sm border border-gray-200 dark:border-neutral-700"
            >
              <img
                src="/kottermann.svg"
                alt="Kottermann"
                width={260}
                height={80}
                className="w-full max-w-[260px] object-contain"
              />
            </a>
            </div>
        </div>

        {/* TOP SECTION */}
        <div className="grid grid-cols- gap-10 items-center">
          {/* CAROUSEL */}
          <div className="relative overflow-hidden rounded-2xl group w-full aspect-[21/8]">
            <img
              src={carouselImages[current]}
              alt="Laboratorio"
              width={1600}
              height={610}
              fetchPriority="high"
              decoding="async"
              className="w-full h-full object-cover object-center transition duration-700"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />

            {carouselImages.length > 1 && (
              <>
                <button
                  onClick={goPrev}
                  aria-label="Imagen anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-gray-900 shadow transition"
                >
                  ‹
                </button>
                <button
                  onClick={goNext}
                  aria-label="Imagen siguiente"
                  className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/80 hover:bg-white rounded-full w-10 h-10 flex items-center justify-center text-gray-900 shadow transition"
                >
                  ›
                </button>
                <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2">
                  {carouselImages.map((_, idx) => (
                    <button
                      key={idx}
                      onClick={() => setCurrent(idx)}
                      aria-label={`Ir a la imagen ${idx + 1}`}
                      className={`w-2.5 h-2.5 rounded-full transition ${
                        idx === current ? "bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          </div>

          {/* CONTENT */}
          <div className="flex flex-col gap-8 my-10">
            {/* TITLE CARD */}
            <div className=" dark:bg-neutral-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-neutral-700">
              <h3 className="text-3xl md:text-4xl font-light leading-tight text-gray-900 dark:text-white">
                Diseño modular y tecnología aplicada al laboratorio
              </h3>
            </div>

      

            {/* TEXT */}
            <div className="space-y-4">
              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Sistemas desarrollados para optimizar el flujo de trabajo,
                priorizando ergonomía, durabilidad y seguridad operativa.
              </p>

              <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                Equipamiento flexible y escalable que acompaña la evolución de
                los procesos científicos y productivos.
              </p>
            </div>
          </div>

        {/* WHY CHOOSE KOTTERMANN */}
        <div className="mt-20">
          <div className="mb-10 max-w-4xl">
            <h3 className="text-4xl font-light mb-4 text-gray-900 dark:text-white">
              ¿Por qué elegir KÖTTERMANN?
            </h3>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {whyChoose.map((item, index) => (
              <div
                key={index}
                className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700 shadow-sm"
              >
                <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  {item.title}
                </h4>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* CARDS */} 
        <div className="mt-24">
           <div className="mb-12 max-w-4xl">
             <h3 className="text-4xl font-light mb-4 text-gray-900 dark:text-white"> Sistemas y componentes </h3> 
        <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed"> Una amplia gama de productos para configurar su laboratorio combinando estética y adaptabilidad. </p> </div></div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
  {cards.map((card, index) => (
    <a
      key={index}
      href={card.pdf}
      download
      className="relative overflow-hidden rounded-lg shadow-md group cursor-pointer"
    >
      <img
        src={card.image}
        alt={card.title}
        width={800}
        height={190}
        loading="lazy"
        decoding="async"
        className="w-full h-[190px] object-cover transition-transform duration-500 group-hover:scale-105"
      />

      <div className="absolute inset-0 bg-gradient-to-t from-orange-500/90 via-orange-500/20 to-transparent transition-opacity" />

      <div className="absolute bottom-5 left-0 right-0 text-center px-4">
        <h4 className="text-white font-bold text-lg tracking-wide">
          {card.title}
        </h4>
      </div>
        <div className="absolute inset-0 bg-black/35 opacity-0 group-hover:opacity-100 transition duration-300 flex flex-col items-center justify-center">

        <Download className="w-9 h-9 text-white mb-3" />

        <span className="text-white font-medium">
            Descargar PDF
        </span>

        </div>

          </a>
        ))}
      </div>

        {/* FOOTER / CTA */}
        <div className="mt-20">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-10 border border-gray-200 dark:border-neutral-700 text-center">
            <h3 className="text-3xl font-light mb-4 text-gray-900 dark:text-white">
              Acompañamiento integral
            </h3>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed mb-8">
              Nuestro equipo especializado acompaña cada etapa del proyecto,
              desde el diseño inicial hasta la implementación final del espacio
              de trabajo.
            </p>

            <a
              href="/quote"
              className="inline-block bg-orange-500 hover:bg-orange-600 text-white font-medium px-8 py-3 rounded-full transition"
            >
              Solicitar cotización
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FurnitureSection;