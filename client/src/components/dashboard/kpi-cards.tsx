import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DollarSign, Users, CheckSquare, Target, Calendar } from "lucide-react";

interface DashboardMetrics {
  monthlyRevenue: number;
  activeClients: number;
  pendingTasks: number;
  pipelineValue: number;
  overduePayments: number;
  previousMonthRevenue?: number;
  newClientsThisMonth?: number;
  totalOpportunities?: number;
}

interface KpiCardsProps {
  selectedPeriod: string;
  onPeriodChange: (period: string) => void;
}

export default function KpiCards({ selectedPeriod, onPeriodChange }: KpiCardsProps) {
  const { data: metrics, isLoading } = useQuery<DashboardMetrics>({
    queryKey: ["/api/dashboard/metrics", selectedPeriod],
    queryFn: async () => {
      const response = await fetch(`/api/dashboard/metrics?period=${selectedPeriod}`, {
        credentials: 'include'
      });
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }
      return response.json();
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="h-6 bg-slate-200 rounded w-48"></div>
          <div className="h-10 bg-slate-200 rounded w-48"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="kpi-card">
              <CardContent className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-slate-200 rounded w-1/2 mb-4"></div>
                  <div className="h-3 bg-slate-200 rounded w-2/3"></div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  // Calculate real percentage changes and metrics
  const revenueChange = metrics?.previousMonthRevenue && metrics.previousMonthRevenue > 0
    ? ((metrics.monthlyRevenue - metrics.previousMonthRevenue) / metrics.previousMonthRevenue * 100).toFixed(1)
    : null;
  
  const revenueChangeNum = revenueChange ? parseFloat(revenueChange) : 0;

  const kpiData = [
    {
      title: "Faturamento do Período",
      value: `R$ ${(metrics?.monthlyRevenue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: revenueChange ? `${revenueChangeNum > 0 ? '+' : ''}${revenueChange}%` : "Sem dados anteriores",
      changeLabel: "vs. período anterior",
      icon: DollarSign,
      color: "accent",
      bgColor: "bg-accent/10",
      textColor: "text-accent"
    },
    {
      title: "Clientes Ativos",
      value: metrics?.activeClients || 0,
      change: metrics?.newClientsThisMonth ? `+${metrics.newClientsThisMonth}` : "0",
      changeLabel: "novos no período", 
      icon: Users,
      color: "primary",
      bgColor: "bg-primary/10",
      textColor: "text-primary"
    },
    {
      title: "Tarefas Pendentes",
      value: metrics?.pendingTasks || 0,
      change: metrics?.overduePayments || 0,
      changeLabel: "em atraso",
      icon: CheckSquare,
      color: metrics?.overduePayments && metrics.overduePayments > 0 ? "red-500" : "green-500",
      bgColor: metrics?.overduePayments && metrics.overduePayments > 0 ? "bg-red-500/10" : "bg-green-500/10",
      textColor: metrics?.overduePayments && metrics.overduePayments > 0 ? "text-red-500" : "text-green-500"
    },
    {
      title: "Pipeline Valor",
      value: `R$ ${(metrics?.pipelineValue || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
      change: `${metrics?.totalOpportunities || 0} oportunidades`,
      changeLabel: "",
      icon: Target,
      color: "secondary",
      bgColor: "bg-secondary/10", 
      textColor: "text-secondary"
    }
  ];

  return (
    <div className="space-y-6">
      {/* Period Selector */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-slate-900">Métricas do Período</h2>
        <div className="flex items-center space-x-2">
          <Calendar className="h-4 w-4 text-slate-500" />
          <Select value={selectedPeriod} onValueChange={onPeriodChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Selecione o período" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Últimos 7 dias</SelectItem>
              <SelectItem value="30d">Últimos 30 dias</SelectItem>
              <SelectItem value="90d">Últimos 90 dias</SelectItem>
              <SelectItem value="current_month">Mês atual</SelectItem>
              <SelectItem value="last_month">Mês passado</SelectItem>
              <SelectItem value="current_year">Ano atual</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {kpiData.map((kpi, index) => {
          const Icon = kpi.icon;
          return (
            <Card key={index} className="kpi-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">{kpi.title}</p>
                    <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                  </div>
                  <div className={`w-12 h-12 ${kpi.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`${kpi.textColor} text-xl`} />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <span className={`${kpi.textColor} font-medium`}>
                    {typeof kpi.change === 'string' ? kpi.change : `+${kpi.change}`}
                  </span>
                  {kpi.changeLabel && (
                    <span className="text-slate-500 ml-1">{kpi.changeLabel}</span>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}