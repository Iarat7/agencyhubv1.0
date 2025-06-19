import { useEffect, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

declare global {
  interface Window {
    Chart: any;
  }
}

export default function Charts() {
  const revenueChartRef = useRef<HTMLCanvasElement>(null);
  const clientChartRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    // Load Chart.js
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = initializeCharts;
      document.head.appendChild(script);
    } else {
      initializeCharts();
    }

    return () => {
      // Cleanup charts on unmount
      if (window.Chart) {
        const charts = window.Chart.getChart;
        if (charts) {
          if (revenueChartRef.current) {
            const revenueChart = window.Chart.getChart(revenueChartRef.current);
            if (revenueChart) revenueChart.destroy();
          }
          if (clientChartRef.current) {
            const clientChart = window.Chart.getChart(clientChartRef.current);
            if (clientChart) clientChart.destroy();
          }
        }
      }
    };
  }, []);

  const initializeCharts = () => {
    if (!window.Chart || !revenueChartRef.current || !clientChartRef.current) return;

    // Revenue Chart
    const revenueCtx = revenueChartRef.current.getContext('2d');
    if (revenueCtx) {
      new window.Chart(revenueCtx, {
        type: 'line',
        data: {
          labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
          datasets: [{
            label: 'Receita (R$)',
            data: [0, 0, 0, 0, 0, 5000],
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
                  return 'R$ ' + (value/1000) + 'k';
                }
              }
            }
          }
        }
      });
    }

    // Client Performance Chart
    const clientCtx = clientChartRef.current.getContext('2d');
    if (clientCtx) {
      new window.Chart(clientCtx, {
        type: 'doughnut',
        data: {
          labels: ['Sem dados'],
          datasets: [{
            data: [1],
            backgroundColor: [
              'hsl(213, 94%, 68%)'
            ],
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
            <CardTitle className="text-lg font-semibold text-slate-900">Performance de Clientes</CardTitle>
            <button className="text-sm text-primary hover:text-primary/80">Ver todos</button>
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
