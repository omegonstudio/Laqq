import { Award, Users, Target, TrendingUp } from "lucide-react";

const CompanySection = () => {
  const values = [
    {
      icon: Award,
      title: "Calidad",
      description: "Productos de las mejores marcas internacionales con certificaciones de calidad.",
    },
    {
      icon: Users,
      title: "Experiencia",
      description: "Más de 20 años sirviendo a la comunidad científica con excelencia.",
    },
    {
      icon: Target,
      title: "Precisión",
      description: "Asesoría especializada para que encuentres exactamente lo que necesitas.",
    },
    {
      icon: TrendingUp,
      title: "Innovación",
      description: "Constantemente actualizamos nuestro catálogo con las últimas tecnologías.",
    },
  ];

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold mb-4">Nuestra Empresa</h1>
            <p className="text-xl text-muted-foreground">
              Líderes en distribución de equipo y material de laboratorio
            </p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-8 mb-12">
            <h2 className="text-2xl font-bold mb-4">Quiénes Somos</h2>
            <div className="space-y-4 text-muted-foreground">
              <p>
                La Química Quirúrgica (LaQQ) es una empresa dedicada a la distribución de equipo de laboratorio, material de consumo y servicios técnicos especializados para la industria científica, académica y de investigación.
              </p>
              <p>
                Con más de dos décadas de experiencia, nos hemos consolidado como un proveedor confiable que ofrece productos de las marcas más reconocidas a nivel mundial, respaldados por un servicio técnico de primera clase.
              </p>
              <p>
                Nuestro compromiso es proporcionar soluciones integrales que impulsen la investigación y el desarrollo científico en México y Latinoamérica.
              </p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mb-8 text-center">Nuestros Valores</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => {
              const Icon = value.icon;
              return (
                <div key={index} className="bg-card border border-border rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
