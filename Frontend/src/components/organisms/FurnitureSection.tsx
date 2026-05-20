"use client";

const features = [
  "Materiales altamente resistentes al ataque químico, al fuego y al uso intensivo.",
  "Campanas extractoras con alta tecnología para un trabajo eficiente y seguro.",
  "Superficies fáciles de limpiar y desinfectar.",
  "Sistema flexible, combinable e intercambiable.",
];

const cards = [
  {
    title: "GABINETES Y MESADAS",
    image: "/Koettermann_Labor_C_09.jpg",
  },
  {
    title: "DUCTOS DE SERVICIOS",
    image: "/instrumental.png",
  },
  {
    title: "CAMPANAS EXTRACTORAS",
    image: "/instrumental.png",
  },
];

const FurnitureSection = () => {
  return (
    <section className="w-full bg-gray-100 dark:bg-neutral-900 py-24">
      <div className="container mx-auto px-6 max-w-7xl">
        {/* HEADER */}
        <div className="mb-16 max-w-4xl">
          <h2 className="text-5xl font-light mb-6 text-gray-900 dark:text-white">
            Mobiliario para laboratorios
          </h2>

          <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed max-w-3xl">
            Soluciones diseñadas para crear espacios funcionales, seguros y
            eficientes, adaptados a las necesidades de cada laboratorio y
            entorno de trabajo.
          </p>
        </div>

        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-10 items-center">
          {/* IMAGE */}
          <div className="relative overflow-hidden rounded-2xl group">
            <img
              src="/Koettermann_Labor_C_09.jpg"
              alt="Laboratorio"
              className="w-full h-[520px] object-cover group-hover:scale-105 transition duration-700"
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-black/10 to-transparent" />
          </div>

          {/* CONTENT */}
          <div className="flex flex-col gap-8">
            {/* TITLE CARD */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 shadow-sm border border-gray-200 dark:border-neutral-700">
              <h3 className="text-3xl md:text-4xl font-light leading-tight text-gray-900 dark:text-white">
                Diseño modular y tecnología aplicada al laboratorio
              </h3>
            </div>

            {/* LOGO */}
            <div className="bg-white dark:bg-neutral-800 rounded-2xl p-8 flex items-center justify-center shadow-sm border border-gray-200 dark:border-neutral-700">
              <img
                src="/kottermann.svg"
                alt="Kottermann"
                className="w-full max-w-[260px] object-contain"
              />
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
        </div>

        {/* FEATURES */}
        <div className="mt-20">
          <div className="mb-10 max-w-4xl">
            <h3 className="text-4xl font-light mb-4 text-gray-900 dark:text-white">
              ¿Por qué elegir KÖTTERMANN?
            </h3>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Soluciones de mobiliario técnico desarrolladas para responder a las exigencias de laboratorios modernos.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 text-center ">
            {features.map((feature, index) => (
              <div
                key={index}
                className="bg-white dark:bg-neutral-800 rounded-2xl p-6 border border-gray-200 dark:border-neutral-700 shadow-sm text-center justify-center"
              >
                <div className="flex items-start gap-4 text-center justify-center">
                  

                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                    {feature}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CARDS */}
        <div className="mt-24">
          <div className="mb-12 max-w-3xl">
            <h3 className="text-4xl font-light mb-4 text-gray-900 dark:text-white">
              Sistemas y componentes
            </h3>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Soluciones integrales pensadas para maximizar seguridad,
              organización y eficiencia en el laboratorio.
            </p>
          </div>

{/*           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {cards.map((card, index) => (
              <div
                key={index}
                className="relative h-[360px] rounded-2xl overflow-hidden group"
              >
                <img
                  src={card.image}
                  alt={card.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-700"
                />

                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <h4 className="text-white text-2xl font-medium leading-tight">
                    {card.title}
                  </h4>
                </div>
              </div>
            ))}
          </div> */}
          {/* CARDS */}
           <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10"> 
            {cards.map((card, index) => ( <div key={index} className="relative overflow-hidden rounded-lg shadow-md group" > 
              <img src={card.image} alt={card.title} className="w-full h-[190px] object-cover transition-transform duration-500 group-hover:scale-105" />
               {/* Overlay */} <div className="absolute inset-0 bg-gradient-to-t from-[#0077ff]/90 via-[#0077ff]/20 to-transparent" /> 
               {/* Title */} <div className="absolute bottom-5 left-0 right-0 text-center px-4"> 
                <h4 className="text-white font-bold text-lg tracking-wide"> {card.title} 
                  </h4> 
                  </div> 
                  </div> ))}
                   </div>
        </div>

        {/* FOOTER */}
        <div className="mt-20">
          <div className="bg-white dark:bg-neutral-800 rounded-3xl p-10 border border-gray-200 dark:border-neutral-700 text-center">
            <h3 className="text-3xl font-light mb-4 text-gray-900 dark:text-white">
              Acompañamiento integral
            </h3>

            <p className="text-lg text-gray-600 dark:text-gray-300 max-w-3xl mx-auto leading-relaxed">
              Nuestro equipo especializado acompaña cada etapa del proyecto,
              desde el diseño inicial hasta la implementación final del espacio
              de trabajo.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FurnitureSection;