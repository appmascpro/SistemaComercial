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
  DashboardAgenda,
  DashboardRecentActivity,
} from "@/components/dashboard/dashboard-panels";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getDashboardData } from "@/lib/dashboard/queries";
import { formatCurrency } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const { stats, activity, agenda } = await getDashboardData();

  const statCards = [
    {
      title: "Total de Clientes",
      value: String(stats.activeCustomers),
      description: "Clientes ativos no tenant",
      icon: Users,
      color: "text-blue-600 bg-blue-50",
    },
    {
      title: "Cotações Abertas",
      value: String(stats.openQuotes),
      description: "Abertas ou enviadas",
      icon: FileText,
      color: "text-amber-600 bg-amber-50",
    },
    {
      title: "Pedidos Faturados",
      value: String(stats.finalizedOrdersMonth),
      description: "No mês atual",
      icon: ShoppingCart,
      color: "text-emerald-600 bg-emerald-50",
    },
    {
      title: "Amostras Pendentes",
      value: String(stats.pendingSamples),
      description: "Aguardando envio",
      icon: FlaskConical,
      color: "text-purple-600 bg-purple-50",
    },
    {
      title: "Comissões Previstas",
      value: formatCurrency(stats.expectedCommissions, "BRL"),
      description: "Comissões com status prevista",
      icon: Wallet,
      color: "text-rose-600 bg-rose-50",
    },
    {
      title: "Próximas Visitas",
      value: String(stats.upcomingVisits),
      description: "Rotas nos próximos 7 dias",
      icon: MapPin,
      color: "text-cyan-600 bg-cyan-50",
    },
  ];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação comercial da sua empresa."
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {statCards.map((stat) => {
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
              Últimas cotações, pedidos, amostras e clientes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardRecentActivity items={activity} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-brand-600" />
              <CardTitle>Agenda Comercial</CardTitle>
            </div>
            <CardDescription>
              Rotas e follow-up de amostras nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent>
            <DashboardAgenda items={agenda} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
