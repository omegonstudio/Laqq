"use client";

const features = [
  "Materiales altamente resistentes al ataque químico, al fuego y al uso intensivo (gabinetes de acero, mesadas de resina).",
  "Superficies fáciles de limpiar y desinfectar.",
  "Sistema flexible, combinable e intercambiable.",
  "Campanas extractoras con alta tecnología para un trabajo eficiente y seguro.",
];

const cards = [
  {
    title: "GABINETES Y MESADAS",
    image: "/gabinetes.jpg",
  },
  {
    title: "DUCTOS DE SERVICIOS",
    image: "/ductos.jpg",
  },
  {
    title: "CAMPANAS EXTRACTORAS",
    image: "/campanas.jpg",
  },
];

const MobiliarySection = () => {
  return (
    <section className="w-full bg-[#efefef] py-10 px-4 md:px-8">
      <div className="max-w-7xl mx-auto">
        {/* TOP SECTION */}
        <div className="grid grid-cols-1 lg:grid-cols-[1.6fr_0.9fr] gap-8 items-start">
          {/* LEFT IMAGE */}
          <div className="overflow-hidden rounded-lg shadow-md">
            <img
              src="/laboratorio-main.jpg"
              alt="Laboratorio"
              className="w-full h-full object-cover"
            />
          </div>

          {/* RIGHT CONTENT */}
          <div className="flex flex-col gap-8">
            {/* TITLE */}
            <div className="bg-gradient-to-r from-[#4c4c4c] to-[#2f2f2f] rounded-md py-5 px-6 text-center shadow-md">
              <h2 className="text-white text-2xl md:text-4xl font-bold uppercase leading-tight tracking-wide">
                Mobiliario para
                <br />
                Laboratorios
              </h2>
            </div>

            {/* LOGO */}
            <div className="flex justify-center lg:justify-start">
              <img
                src="/kottermann-logo.png"
                alt="Kottermann"
                className="w-full max-w-[320px] object-contain"
              />
            </div>

            {/* TEXT */}
            <p className="text-[#4f4f4f] text-lg leading-relaxed max-w-md">
              Soluciones para hacer de su ambiente de trabajo un espacio
              funcional, seguro y personalizado de acuerdo con sus necesidades.
            </p>
          </div>
        </div>

        {/* FEATURES */}
        <div className="mt-8">
          <h3 className="text-[#0066cc] text-2xl font-bold mb-5">
            ¿Por qué elegir KÖTTERMANN?
          </h3>

          <ul className="space-y-3">
            {features.map((feature, index) => (
              <li
                key={index}
                className="flex items-start gap-3 text-[#0066cc] text-lg leading-relaxed"
              >
                <span className="mt-2 w-2 h-2 rounded-full bg-[#0066cc] flex-shrink-0" />
                <span>{feature}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* CARDS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-10">
          {cards.map((card, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg shadow-md group"
            >
              <img
                src={card.image}
                alt={card.title}
                className="w-full h-[190px] object-cover transition-transform duration-500 group-hover:scale-105"
              />

              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-[#0077ff]/90 via-[#0077ff]/20 to-transparent" />

              {/* Title */}
              <div className="absolute bottom-5 left-0 right-0 text-center px-4">
                <h4 className="text-white font-bold text-lg tracking-wide">
                  {card.title}
                </h4>
              </div>
            </div>
          ))}
        </div>

        {/* FOOTER TEXT */}
        <div className="mt-8 text-center">
          <p className="text-[#0066cc] text-lg leading-relaxed">
            Nuestro equipo especializado lo ayudará a pensar y poner en marcha
            su nuevo proyecto o a remodelar su actual espacio de trabajo.
          </p>
        </div>
      </div>
    </section>
  );
};

export default MobiliarySection;



