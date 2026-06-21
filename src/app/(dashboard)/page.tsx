import {
  Users,
  FileText,
  ShoppingCart,
  FlaskConical,
  Wallet,
  MapPin,
  TrendingUp,
  CircleDollarSign,
  Receipt,
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
      title: "Valor Faturado",
      value: formatCurrency(stats.invoicedAmountMonth, "BRL"),
      description: "Total faturado no mês",
      icon: CircleDollarSign,
      color: "text-green-600 bg-green-50",
    },
    {
      title: "Valor em Orçamento",
      value: formatCurrency(stats.openQuotesAmount, "BRL"),
      description: "Cotações abertas ou enviadas",
      icon: Receipt,
      color: "text-orange-600 bg-orange-50",
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
      description: "Rotas e retornos nos próximos 7 dias",
      icon: MapPin,
      color: "text-cyan-600 bg-cyan-50",
    },
  ];

  return (
    <div className="min-w-0 max-w-full">
      <PageHeader
        title="Dashboard"
        description="Visão geral da operação comercial da sua empresa."
      />

      <div className="grid min-w-0 gap-4 sm:grid-cols-2 xl:grid-cols-3">
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

      <div className="mt-6 grid min-w-0 gap-4 lg:grid-cols-2 lg:items-stretch">
        <Card className="flex min-w-0 flex-col overflow-hidden lg:h-full">
          <CardHeader className="min-h-[6.75rem] shrink-0">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 shrink-0 text-brand-600" />
              <CardTitle>Atividade Recente</CardTitle>
            </div>
            <CardDescription>
              Últimas cotações, pedidos, amostras e clientes
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto min-w-0 shrink-0 p-6 pt-0">
            <DashboardRecentActivity items={activity} />
          </CardContent>
        </Card>

        <Card className="flex min-w-0 flex-col overflow-hidden lg:h-full">
          <CardHeader className="min-h-[6.75rem] shrink-0">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 shrink-0 text-brand-600" />
              <CardTitle>Agenda Comercial</CardTitle>
            </div>
            <CardDescription>
              Rotas, visitas e follow-up nos próximos 7 dias
            </CardDescription>
          </CardHeader>
          <CardContent className="mt-auto min-w-0 shrink-0 p-6 pt-0">
            <DashboardAgenda items={agenda} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
