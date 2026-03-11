import { useEffect } from "react";

const CompanySection = () => {
  useEffect(() => {
    const hash = window.location.hash;
    if (hash) {
      const element = document.querySelector(hash);
      if (element) {
        element.scrollIntoView({ behavior: "smooth" });
      }
    }
  }, []);
  return (
    <section className="w-full">
      {/* HERO */}
      <div className="relative w-full h-[70vh] flex items-center justify-center overflow-hidden">
        {/* Imagen */}
        <img
          src="/header.png"
          alt="Laboratorio"
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Overlay */}
        <div className="absolute inset-0 bg-black/40 z-10" />

        {/* Texto */}
        <h1 className="relative z-20 text-white text-4xl md:text-6xl font-bold text-center px-4">
          Asistiendo a la ciencia desde 1952
        </h1>
      </div>

      {/* INTRO INSTITUCIONAL */}
      <div className="container mx-auto px-4 py-20 max-w-5xl">
        <div className="space-y-6 text-lg text-muted-foreground">
          <p>
            Somos una empresa especializada en soluciones integrales para
            laboratorios industriales y de investigación. Combinamos
            asesoramiento técnico, provisión de insumos y equipamiento, y
            soporte posventa confiable.
          </p>

          <p>
            Nuestra misión es asegurar confiabilidad en todo el proceso de
            provisión, contribuyendo al desarrollo científico, tecnológico y
            productivo en sectores como el farmacéutico, químico, energético,
            alimenticio, ambiental y de investigación.
          </p>

          <p>
            Acompañamos a nuestros clientes en cada etapa, desde la detección de
            la necesidad hasta la implementación, garantizando eficiencia,
            seguridad y continuidad operativa.
          </p>
        </div>
      </div>

      {/* SOLUCIONES CONFIABLES */}
      <div className="bg-muted py-20">
        <div className="container mx-auto px-4 max-w-6xl grid md:grid-cols-2 gap-12 items-center">
          {/* Texto */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">
              Soluciones confiables a largo plazo
            </h2>

            <p className="text-muted-foreground">
              Trabajamos con un firme compromiso con la calidad, operando bajo
              sistemas de gestión certificados que garantizan productos,
              servicios y procesos confiables.
            </p>

            <p className="text-muted-foreground">
              El cliente es el eje de nuestra organización: escuchamos,
              acompañamos y respondemos con agilidad, priorizando soluciones
              eficaces y relaciones de largo plazo.
            </p>

            <p className="text-muted-foreground">
              Impulsamos la innovación y la mejora continua, incorporando nuevas
              tecnologías y actuando con responsabilidad, ética y respeto por el
              entorno.
            </p>
          </div>

          {/* Imagen */}
          <div className="relative w-full h-[400px] rounded-2xl overflow-hidden">
            <img
              src="/soluciones.png"
              alt="Equipamiento de laboratorio"
              className="object-cover w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* COMPROMISO SOSTENIDO */}
      <div className="bg-gray-100 dark:bg-neutral-900 py-24">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Título + descripción */}
          <div className="mb-16 max-w-3xl">
            <h2 className="text-5xl font-light mb-6">Compromiso sostenido</h2>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Brindamos soluciones diseñadas a medida, con asesoramiento
              personalizado y acompañamiento continuo en cada etapa del proceso.
            </p>
          </div>

          {/* Cards */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Instrumental", img: "/instrumental.png" },
              { title: "Consumibles", img: "/consumibles.png" },
              { title: "Equipamiento para procesos", img: "/procesos.png" },
              { title: "Mobiliario", img: "/header.png" }, // cambiar si tenés imagen
              { title: "Servicio técnico", img: "/serviciotecnico.png" },
            ].map((item, index) => (
              <div
                key={index}
                className="relative h-[420px] rounded-xl overflow-hidden group"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Overlay SOLO arriba */}
                <div className="absolute top-0 left-0 right-0 h-24 bg-black/60 flex items-center justify-center px-4">
                  <h3 className="text-white text-xl font-medium text-center">
                    {item.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* COBERTURA ESTRATÉGICA */}
      <div className="bg-gray-100 dark:bg-neutral-900 py-24">
        <div className="container mx-auto px-6 max-w-7xl">
          {/* Título + descripción */}
          <div className="mb-16 max-w-3xl">
            <h2 className="text-5xl font-light mb-6 text-gray-900 dark:text-white">
              {" "}
              Cobertura estratégica
            </h2>

            <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
              Abastecemos laboratorios de control, investigación y desarrollo,
              ofreciendo soluciones confiables a industrias y centros de
              investigación de diversos sectores.
            </p>
          </div>

          {/* Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-6">
            {[
              { title: "Farmacéutica", img: "/farma.png" },
              { title: "Energía", img: "/petroleo.png" },
              { title: "Alimentos", img: "/alimentos2.png" },
              { title: "Química", img: "/quimica.jpg" },
              { title: "Metalúrgica", img: "/metalurgia.png" },
              { title: "Minería", img: "/mineria.png" },
              { title: "Agro", img: "/Agro.png" },
              { title: "I+D", img: "/I+D.png" },
              { title: "Automotriz", img: "/automotriz.png" },
              { title: "Medio ambiente", img: "/medioambiente.png" },
            ].map((sector, index) => (
              <div
                key={index}
                className="relative h-[320px] rounded-xl overflow-hidden group"
              >
                <img
                  src={sector.img}
                  alt={sector.title}
                  className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition duration-500"
                />

                {/* Overlay solo arriba */}
                <div className="absolute top-0 left-0 right-0 h-20 bg-black/60 flex items-center justify-center px-4">
                  <h3 className="text-white text-lg font-medium text-center">
                    {sector.title}
                  </h3>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* RESPALDO INTERNACIONAL */}
      <div
        className="container mx-auto px-4 py-20 max-w-6xl"
        id="representaciones"
      >
        <h2 className="text-3xl font-bold mb-12 text-center">
          Respaldo internacional
        </h2>

        <p className="text-center text-muted-foreground mb-10 max-w-3xl mx-auto">
          Representamos fabricantes líderes, acercando al mercado local
          tecnologías y soluciones que cumplen con los más altos estándares de
          calidad y exigencia global.
        </p>

        {/* Logos */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 items-center">
          {[
            "cannon.svg",
            "fisher.svg",
            "hirschmann.svg",
            "honeywell.svg",
            "julabo.svg",
            "kottermann.svg",
            "labconco.svg",
            "memmert.svg",
            "microtrac.svg",
            "retsch.svg",
            "solstice.svg",
            "syrris.svg",
            "tanaka.svg",
            "thalesnano.svg",
            "thermo.svg",
            "velp.svg",
            "wiggens.svg",
          ].map((logo, index) => (
            <div
            key={index}
            className="h-16 flex items-center justify-center 
                       p-3 rounded-lg 
                       dark:bg-white/90"
          >
            <img
              src={`/${logo}`}
              alt={logo.replace(".svg", "")}
              className="max-h-10 object-contain transition duration-300"
            />
          </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
