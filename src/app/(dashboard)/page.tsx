import {
  Users,
  FileText,
  ShoppingCart,
  FlaskConical,
  Wallet,
  MapPin,
  TrendingUp,
} from "lucide-react";
import { PageHeader } from "@/components/layout/page-header";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatCurrency } from "@/lib/utils";

const stats = [
  {
    title: "Total de Clientes",
    value: "—",
    description: "Clientes ativos no tenant",
    icon: Users,
    color: "text-blue-600 bg-blue-50",
  },
  {
    title: "Cotações Abertas",
    value: "—",
    description: "Aguardando resposta",
    icon: FileText,
    color: "text-amber-600 bg-amber-50",
  },
  {
    title: "Pedidos Finalizados",
    value: "—",
    description: "No período atual",
    icon: ShoppingCart,
    color: "text-emerald-600 bg-emerald-50",
  },
  {
    title: "Amostras Pendentes",
    value: "—",
    description: "Aguardando feedback",
    icon: FlaskConical,
    color: "text-purple-600 bg-purple-50",
  },
  {
    title: "Comissões Previstas",
    value: formatCurrency(0),
    description: "Pedidos em andamento",
    icon: Wallet,
    color: "text-rose-600 bg-rose-50",
  },
  {
    title: "Próximas Visitas",
    value: "—",
    description: "Nos próximos 7 dias",
    icon: MapPin,
    color: "text-cyan-600 bg-cyan-50",
  },
];

export default function DashboardPage() {
  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação comercial da sua empresa."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} className="transition-shadow hover:shadow-md">
              <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
                <div>
                  <CardTitle className="text-sm font-medium text-slate-600">
                    {stat.title}
                  </CardTitle>
                  <CardDescription className="mt-1">
                    {stat.description}
                  </CardDescription>
                </div>
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${stat.color}`}
                >
                  <Icon className="h-5 w-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-bold tracking-tight text-slate-900">
                  {stat.value}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-brand-600" />
              <CardTitle>Atividade Recente</CardTitle>
            </div>
            <CardDescription>
              Cotações, pedidos e visitas mais recentes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-400">
                Dados serão exibidos após integração com Supabase
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" />
              <CardTitle>Agenda de Visitas</CardTitle>
            </div>
            <CardDescription>Próximas ações comerciais planejadas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-40 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-400">
                Rotas e visitas aparecerão aqui
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
