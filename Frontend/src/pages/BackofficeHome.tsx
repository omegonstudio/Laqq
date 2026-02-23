import { useDashboardSummary } from "@/hooks/useDashboard";
import {
  Package,
  Users,
  FileText,
  Mail,
  TrendingUp,
  Activity,
} from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const StatCard = ({ icon: Icon, label, value, color }: any) => (
  <div className="bg-card p-6 rounded-2xl border border-border hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between">
      <div>
        <p className="text-sm text-muted-foreground mb-1">{label}</p>
        <p className="text-3xl font-bold text-foreground">{value}</p>
      </div>
      <div className={`p-4 rounded-xl ${color}`}>
        <Icon size={28} className="text-white" />
      </div>
    </div>
  </div>
);

const BackofficeHome = () => {
  const { data, isLoading, isError } = useDashboardSummary();

  if (isLoading) {
    return <div className="p-6 text-muted-foreground">Cargando dashboard…</div>;
  }

  if (isError || !data) {
    return (
      <div className="p-6 text-destructive">Error al cargar el dashboard</div>
    );
  }

  const { stats } = data;
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenido al panel de administración de LaQQ
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Users}
          label="Usuarios Activos"
          value={stats.active_users}
          color="bg-primary"
        />
        <StatCard
          icon={Package}
          label="Productos"
          value={stats.products}
          color="bg-blue-500"
        />
        <StatCard
          icon={FileText}
          label="Cotizaciones"
          value={stats.quotes}
          color="bg-green-500"
        />
        <StatCard
          icon={Mail}
          label="Mensajes Nuevos"
          value={stats.new_messages}
          color="bg-purple-500"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* <div className="bg-card p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp className="text-primary" size={24} />
            <h3 className="text-xl font-bold text-foreground">
              Actividad Reciente
            </h3>
          </div>
          <div className="space-y-3">
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground">
                Nueva cotización de <strong>Laboratorio Central</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Hace 2 horas</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground">
                Mensaje nuevo de <strong>Hospital Provincial</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Hace 5 horas</p>
            </div>
            <div className="p-3 bg-muted/30 rounded-lg">
              <p className="text-sm text-foreground">
                Producto actualizado: <strong>Frascos Celstir</strong>
              </p>
              <p className="text-xs text-muted-foreground mt-1">Hace 1 día</p>
            </div>
          </div>
        </div> */}

        <div className="bg-card p-6 rounded-2xl border border-border">
          <div className="flex items-center gap-3 mb-4">
            <Activity className="text-primary" size={24} />
            <h3 className="text-xl font-bold text-foreground">
              Accesos Rápidos
            </h3>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <a
              href="/backoffice/quotes"
              className="p-4 bg-primary/10 hover:bg-primary/20 rounded-xl transition-colors text-center"
            >
              <FileText className="mx-auto mb-2 text-primary" size={24} />
              <p className="text-sm font-medium text-foreground">
                Cotizaciones
              </p>
            </a>
            <a
              href="/backoffice/messages"
              className="p-4 bg-blue-500/10 hover:bg-blue-500/20 rounded-xl transition-colors text-center"
            >
              <Mail className="mx-auto mb-2 text-blue-500" size={24} />
              <p className="text-sm font-medium text-foreground">Mensajes</p>
            </a>
            <a
              href="/backoffice/products"
              className="p-4 bg-green-500/10 hover:bg-green-500/20 rounded-xl transition-colors text-center"
            >
              <Package className="mx-auto mb-2 text-green-500" size={24} />
              <p className="text-sm font-medium text-foreground">Productos</p>
            </a>
            <a
              href="/backoffice/users"
              className="p-4 bg-purple-500/10 hover:bg-purple-500/20 rounded-xl transition-colors text-center"
            >
              <Users className="mx-auto mb-2 text-purple-500" size={24} />
              <p className="text-sm font-medium text-foreground">Usuarios</p>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackofficeHome;
