import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

declare global {
  interface Window {
    Chart: any;
  }
}

interface ResponsiveChartsProps {
  revenuePeriod: string;
  pipelinePeriod: string;
  clientPeriod: string;
  onPeriodChange: (type: string, period: string) => void;
}

export default function ResponsiveCharts({ 
  revenuePeriod = "6months", 
  pipelinePeriod = "current_month", 
  clientPeriod = "6months",
  onPeriodChange 
}: ResponsiveChartsProps) {
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const pipelineChartRef = useRef<HTMLCanvasElement>(null);
  const clientChartRef = useRef<HTMLCanvasElement>(null);

  const { data: financialData = [] } = useQuery({
    queryKey: ["/api/financial"],
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: opportunities = [] } = useQuery({
    queryKey: ["/api/opportunities"],
  });

  useEffect(() => {
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = initializeCharts;
      document.head.appendChild(script);
    } else {
      initializeCharts();
    }

    return () => {
      if (window.Chart) {
        [revenueChartRef, pipelineChartRef, clientChartRef].forEach(ref => {
          if (ref.current) {
            const chart = window.Chart.getChart(ref.current);
            if (chart) chart.destroy();
          }
        });
      }
    };
  }, [financialData, clients, opportunities, revenuePeriod, pipelinePeriod, clientPeriod]);

  const initializeCharts = () => {
    if (!window.Chart || !revenueChartRef.current || !pipelineChartRef.current || !clientChartRef.current) return;

    // Revenue Chart Logic
    const monthsToShow = revenuePeriod === "12months" ? 12 : 6;
    const months = [];
    const monthlyRevenue = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleDateString('pt-BR', { month: 'short' }));

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRevenue = Array.isArray(financialData) ? financialData
        .filter((record: any) => {
          if (record.status !== 'paid' || !record.paidDate) return false;
          const paidDate = new Date(record.paidDate);
          return paidDate >= monthStart && paidDate <= monthEnd && record.amount > 0;
        })
        .reduce((sum: number, record: any) => sum + Number(record.amount), 0) : 0;

      monthlyRevenue.push(monthRevenue);
    }

    // Revenue Chart
    const revenueCtx = revenueChartRef.current.getContext('2d');
    if (revenueCtx) {
      new window.Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: months,
          datasets: [{
            label: 'Receita (R$)',
            data: monthlyRevenue,
            borderColor: 'hsl(213, 94%, 68%)',
            backgroundColor: 'hsla(213, 94%, 68%, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'R$ ' + value.toLocaleString('pt-BR');
                }
              }
            }
          }
        }
      });
    }

    // Pipeline Chart Logic
    const pipelineData = Array.isArray(opportunities) ? opportunities : [];
    let filteredOpportunities = pipelineData;

    // Filter opportunities based on period
    if (pipelinePeriod !== "all") {
      const now = new Date();
      filteredOpportunities = pipelineData.filter((opp: any) => {
        if (!opp.expectedCloseDate) return pipelinePeriod === "no_due_date";
        
        const closeDate = new Date(opp.expectedCloseDate);
        
        switch (pipelinePeriod) {
          case "current_month":
            return closeDate.getMonth() === now.getMonth() && closeDate.getFullYear() === now.getFullYear();
          case "next_month":
            const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
            return closeDate.getMonth() === nextMonth.getMonth() && closeDate.getFullYear() === nextMonth.getFullYear();
          case "this_quarter":
            const quarterStart = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
            const quarterEnd = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3 + 3, 0);
            return closeDate >= quarterStart && closeDate <= quarterEnd;
          case "overdue":
            return closeDate < now;
          default:
            return true;
        }
      });
    }

    // Pipeline stages data
    const stages = ['prospecting', 'qualification', 'proposal', 'negotiation', 'closed_won'];
    const stageNames = ['Prospecção', 'Qualificação', 'Proposta', 'Negociação', 'Fechado'];
    const stageValues = stages.map(stage => 
      filteredOpportunities
        .filter((opp: any) => opp.stage === stage)
        .reduce((sum: number, opp: any) => sum + (Number(opp.value) || 0), 0)
    );

    // Pipeline Chart
    const pipelineCtx = pipelineChartRef.current.getContext('2d');
    if (pipelineCtx) {
      new window.Chart(pipelineCtx, {
        type: 'bar',
        data: {
          labels: stageNames,
          datasets: [{
            label: 'Valor (R$)',
            data: stageValues,
            backgroundColor: [
              'hsla(210, 40%, 85%, 0.8)',
              'hsla(213, 94%, 68%, 0.8)',
              'hsla(45, 93%, 47%, 0.8)',
              'hsla(262, 83%, 58%, 0.8)',
              'hsla(142, 76%, 36%, 0.8)'
            ],
            borderColor: [
              'hsl(210, 40%, 65%)',
              'hsl(213, 94%, 48%)',
              'hsl(45, 93%, 27%)',
              'hsl(262, 83%, 38%)',
              'hsl(142, 76%, 16%)'
            ],
            borderWidth: 1
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'R$ ' + value.toLocaleString('pt-BR');
                }
              }
            }
          }
        }
      });
    }

    // Client Growth Chart
    const clientMonthsToShow = clientPeriod === "12months" ? 12 : 6;
    const clientMonths = [];
    const clientGrowthData = [];

    for (let i = clientMonthsToShow - 1; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      clientMonths.push(date.toLocaleDateString('pt-BR', { month: 'short' }));

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      
      const clientsThisMonth = Array.isArray(clients) ? clients.filter((client: any) => {
        const createdDate = new Date(client.createdAt);
        return createdDate <= monthStart;
      }).length : 0;

      clientGrowthData.push(clientsThisMonth);
    }

    // Client Chart
    const clientCtx = clientChartRef.current.getContext('2d');
    if (clientCtx) {
      new window.Chart(clientCtx, {
        type: 'line',
        data: {
          labels: clientMonths,
          datasets: [{
            label: 'Clientes',
            data: clientGrowthData,
            borderColor: 'hsl(142, 76%, 36%)',
            backgroundColor: 'hsla(142, 76%, 36%, 0.1)',
            fill: true,
            tension: 0.4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                stepSize: 1
              }
            }
          }
        }
      });
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Revenue Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Receita Mensal</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={revenuePeriod === "6months" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("revenue", "6months")}
            >
              6M
            </Button>
            <Button
              variant={revenuePeriod === "12months" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("revenue", "12months")}
            >
              12M
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <canvas ref={revenueChartRef}></canvas>
          </div>
        </CardContent>
      </Card>

      {/* Pipeline Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Pipeline Comercial</CardTitle>
          <div className="flex gap-1">
            <Button
              variant={pipelinePeriod === "current_month" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("pipeline", "current_month")}
            >
              Mês
            </Button>
            <Button
              variant={pipelinePeriod === "this_quarter" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("pipeline", "this_quarter")}
            >
              Trim
            </Button>
            <Button
              variant={pipelinePeriod === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("pipeline", "all")}
            >
              Todos
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <canvas ref={pipelineChartRef}></canvas>
          </div>
        </CardContent>
      </Card>

      {/* Client Growth Chart */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Crescimento de Clientes</CardTitle>
          <div className="flex gap-2">
            <Button
              variant={clientPeriod === "6months" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("client", "6months")}
            >
              6M
            </Button>
            <Button
              variant={clientPeriod === "12months" ? "default" : "outline"}
              size="sm"
              onClick={() => onPeriodChange("client", "12months")}
            >
              12M
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-[200px]">
            <canvas ref={clientChartRef}></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}