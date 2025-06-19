import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

declare global {
  interface Window {
    Chart: any;
  }
}

interface RealTimeChartsProps {
  revenuePeriod: string;
  pipelinePeriod: string;
  clientPeriod: string;
}

export default function RealTimeCharts({ revenuePeriod = "6months", pipelinePeriod = "current_month", clientPeriod = "6months" }: RealTimeChartsProps) {
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const clientChartRef = useRef<HTMLCanvasElement>(null);
  const pipelineChartRef = useRef<HTMLCanvasElement>(null);

  const { data: financialData } = useQuery({
    queryKey: ["/api/financial"],
  });

  const { data: clients } = useQuery({
    queryKey: ["/api/clients"],
  });

  const { data: opportunities } = useQuery({
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
        if (revenueChartRef.current) {
          const revenueChart = window.Chart.getChart(revenueChartRef.current);
          if (revenueChart) revenueChart.destroy();
        }
        if (clientChartRef.current) {
          const clientChart = window.Chart.getChart(clientChartRef.current);
          if (clientChart) clientChart.destroy();
        }
        if (pipelineChartRef.current) {
          const pipelineChart = window.Chart.getChart(pipelineChartRef.current);
          if (pipelineChart) pipelineChart.destroy();
        }
      }
    };
  }, [financialData, clients, opportunities, revenuePeriod, pipelinePeriod, clientPeriod]);

  const initializeCharts = () => {
    if (!window.Chart || !revenueChartRef.current || !clientChartRef.current || !pipelineChartRef.current) return;

    // Calculate periods based on props
    const monthsToShow = revenuePeriod === "12months" ? 12 : 6;
    const currentDate = new Date();
    const months = [];
    const monthlyRevenue = [];

    for (let i = monthsToShow - 1; i >= 0; i--) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthName = date.toLocaleDateString('pt-BR', { month: 'short' });
      months.push(monthName.charAt(0).toUpperCase() + monthName.slice(1));

      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);

      const monthRevenue = Array.isArray(financialData) ? financialData.filter((record: any) => {
        if (record.status !== 'paid' || !record.paidDate) return false;
        const paidDate = new Date(record.paidDate);
        return paidDate >= monthStart && paidDate <= monthEnd && record.amount > 0;
      }).reduce((sum: number, record: any) => sum + Number(record.amount), 0) : 0;

      monthlyRevenue.push(monthRevenue);
    }

    // Revenue Chart with real data
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
            tension: 0.4,
            fill: true
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              display: false
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              ticks: {
                callback: function(value: any) {
                  return 'R$ ' + Number(value).toLocaleString('pt-BR');
                }
              }
            }
          }
        }
      });
    }

    // Client status distribution chart with real data
    const activeClients = clients?.filter((c: any) => c.status === 'active').length || 0;
    const prospectClients = clients?.filter((c: any) => c.status === 'prospect').length || 0;
    const inactiveClients = clients?.filter((c: any) => c.status !== 'active' && c.status !== 'prospect').length || 0;

    const clientCtx = clientChartRef.current.getContext('2d');
    if (clientCtx) {
      if (activeClients === 0 && prospectClients === 0 && inactiveClients === 0) {
        // No data state
        new window.Chart(clientCtx, {
          type: 'doughnut',
          data: {
            labels: ['Sem dados'],
            datasets: [{
              data: [1],
              backgroundColor: ['hsl(213, 94%, 68%)'],
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      } else {
        // Real data
        new window.Chart(clientCtx, {
          type: 'doughnut',
          data: {
            labels: ['Ativos', 'Prospects', 'Inativos'].filter((_, index) => 
              [activeClients, prospectClients, inactiveClients][index] > 0
            ),
            datasets: [{
              data: [activeClients, prospectClients, inactiveClients].filter(count => count > 0),
              backgroundColor: [
                'hsl(158, 64%, 52%)',
                'hsl(43, 96%, 56%)', 
                'hsl(0, 84%, 60%)'
              ].slice(0, [activeClients, prospectClients, inactiveClients].filter(count => count > 0).length),
              borderWidth: 0
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom'
              }
            }
          }
        });
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
      <Card className="chart-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Receita Mensal</CardTitle>
            <Select defaultValue="6months">
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="6months">Últimos 6 meses</SelectItem>
                <SelectItem value="12months">Últimos 12 meses</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64">
            <canvas ref={revenueChartRef} className="w-full h-full"></canvas>
          </div>
        </CardContent>
      </Card>

      <Card className="chart-container">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">Status dos Clientes</CardTitle>
            <span className="text-sm text-slate-500">
              {clients?.length || 0} total
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="w-full h-64">
            <canvas ref={clientChartRef} className="w-full h-full"></canvas>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}