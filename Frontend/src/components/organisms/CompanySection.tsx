import { useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { useAppSelector } from "@/store/hooks";
import { ensureHttpsUrl } from "@/utils/secureUrl";

const CompanySection = () => {
  const { list, loading, error } = useAppSelector((state) => state.brands);
  const sortedBrands = useMemo(
    () =>
      [...list].sort((a, b) =>
        a.name.localeCompare(b.name, "es", { sensitivity: "base" })
      ),
    [list]
  );

  // #region agent log
  useEffect(() => {
    const withLogo = sortedBrands.filter((b) => !!b.logo_url).length;
    const names = sortedBrands.map((b) => b.name);
    const hasOmegon = names.some((n) => /omegon/i.test(n));
    const branch =
      loading && list.length === 0 ? "skeleton" : "brands-map";
    fetch("http://127.0.0.1:7282/ingest/ab0e328b-2eba-4587-bb8f-7d705e5fa936", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5407fd",
      },
      body: JSON.stringify({
        sessionId: "5407fd",
        runId: "pre-fix",
        hypothesisId: "A",
        location: "CompanySection.tsx:render-state",
        message: "Company representaciones brands state",
        data: {
          listLen: list.length,
          sortedLen: sortedBrands.length,
          loading,
          error,
          withLogo,
          hasOmegon,
          branch,
          namesSample: names.slice(0, 8),
          pathname: window.location.pathname,
          hash: window.location.hash,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [list, loading, error, sortedBrands]);
  // #endregion

  // #region agent log
  useEffect(() => {
    const grid = document.querySelector("#representaciones .grid");
    const links = grid?.querySelectorAll("a")?.length ?? -1;
    const imgs = grid?.querySelectorAll("img")?.length ?? -1;
    const skeleton = grid?.querySelectorAll(".animate-pulse")?.length ?? -1;
    fetch("http://127.0.0.1:7282/ingest/ab0e328b-2eba-4587-bb8f-7d705e5fa936", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Debug-Session-Id": "5407fd",
      },
      body: JSON.stringify({
        sessionId: "5407fd",
        runId: "pre-fix",
        hypothesisId: "C",
        location: "CompanySection.tsx:dom",
        message: "Company representaciones DOM counts",
        data: { links, imgs, skeleton, gridExists: !!grid },
        timestamp: Date.now(),
      }),
    }).catch(() => {});
  }, [sortedBrands, loading, list.length]);
  // #endregion

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
          src="/header.webp"
          alt="Laboratorio"
          width={1600}
          height={1066}
          fetchPriority="high"
          decoding="async"
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
            asesoramiento técnico, provisión de consumibles y equipamiento, y
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
              src="/soluciones.webp"
              alt="Equipamiento de laboratorio"
              width={1065}
              height={1080}
              loading="lazy"
              decoding="async"
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
              { title: "Equipos", img: "/instrumental.webp" },
              { title: "Consumibles", img: "/consumibles.webp" },
              { title: "Equipamiento para procesos", img: "/procesos.webp" },
              { title: "Mobiliario", img: "/header.webp" },
              { title: "Servicio técnico", img: "/serviciotecnico.webp" },
            ].map((item, index) => (
              <div
                key={index}
                className="relative h-[420px] rounded-xl overflow-hidden group"
              >
                <img
                  src={item.img}
                  alt={item.title}
                  width={900}
                  height={600}
                  loading="lazy"
                  decoding="async"
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
              { title: "Farmacéutica", img: "/farma.webp" },
              { title: "Energía", img: "/petroleo.webp" },
              { title: "Alimentos", img: "/alimentos2.webp" },
              { title: "Química", img: "/quimica.webp" },
              { title: "Metalúrgica", img: "/metalurgia.webp" },
              { title: "Minería", img: "/mineria.webp" },
              { title: "Agro", img: "/Agro.webp" },
              { title: "I+D", img: "/I+D.webp" },
              { title: "Automotriz", img: "/automotriz.webp" },
              { title: "Medio ambiente", img: "/medioambiente.webp" },
            ].map((sector, index) => (
              <div
                key={index}
                className="relative h-[320px] rounded-xl overflow-hidden group"
              >
                <img
                  src={sector.img}
                  alt={sector.title}
                  width={800}
                  height={500}
                  loading="lazy"
                  decoding="async"
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
          {loading && list.length === 0
            ? Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 flex items-center justify-center p-3 rounded-lg"
                >
                  <div className="h-10 w-[120px] animate-pulse rounded-md bg-muted" />
                </div>
              ))
            : sortedBrands.map((brand) => (
                <Link
                  key={brand.id}
                  to={
                    brand.slug
                      ? `/marcas/${brand.slug}`
                      : `/products?brand=${brand.id}`
                  }
                  aria-label={`Ver productos de ${brand.name}`}
                  className="h-16 flex items-center justify-center p-3 rounded-lg dark:bg-white/90"
                >
                  {brand.logo_url ? (
                    <img
                      src={ensureHttpsUrl(brand.logo_url)}
                      alt={brand.name}
                      width={160}
                      height={40}
                      loading="lazy"
                      decoding="async"
                      className="max-h-10 object-contain transition duration-300"
                    />
                  ) : (
                    <span className="text-sm font-medium text-muted-foreground text-center">
                      {brand.name}
                    </span>
                  )}
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
