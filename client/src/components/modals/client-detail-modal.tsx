import { useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { X, Brain, Edit, FileText, Calendar } from "lucide-react";
import type { Client, Task, FinancialRecord } from "@shared/schema";

interface ClientDetailModalProps {
  client: Client;
  isOpen: boolean;
  onClose: () => void;
}

declare global {
  interface Window {
    Chart: any;
  }
}

export default function ClientDetailModal({ client, isOpen, onClose }: ClientDetailModalProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);

  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks", { clientId: client.id }],
    enabled: isOpen,
  });

  const { data: financialRecords } = useQuery<FinancialRecord[]>({
    queryKey: ["/api/financial", { clientId: client.id }],
    enabled: isOpen,
  });

  const { data: performance } = useQuery<{
    totalSpend: number;
    totalRevenue: number;
    totalImpressions: number;
    totalClicks: number;
    totalConversions: number;
    roas: number;
    ctr: number;
    cpc: number;
    conversionRate: number;
  }>({
    queryKey: ["/api/clients/" + client.id + "/performance"],
    enabled: isOpen,
  });

  const { data: integrations } = useQuery<any[]>({
    queryKey: ["/api/integrations/client/" + client.id],
    enabled: isOpen,
  });

  useEffect(() => {
    if (!isOpen || !chartRef.current) return;

    // Load Chart.js if not already loaded
    if (!window.Chart) {
      const script = document.createElement('script');
      script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
      script.onload = initializeChart;
      document.head.appendChild(script);
    } else {
      initializeChart();
    }

    return () => {
      if (window.Chart && chartRef.current) {
        const existingChart = window.Chart.getChart(chartRef.current);
        if (existingChart) {
          existingChart.destroy();
        }
      }
    };
  }, [isOpen]);

  const initializeChart = () => {
    if (!window.Chart || !chartRef.current) return;

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    // Sample data - in a real app, this would come from props or API
    new window.Chart(ctx, {
      type: 'line',
      data: {
        labels: ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun'],
        datasets: [{
          label: 'Conversões',
          data: [45, 52, 68, 84, 92, 127],
          borderColor: 'hsl(158, 64%, 52%)',
          backgroundColor: 'hsla(158, 64%, 52%, 0.1)',
          tension: 0.4,
          fill: true
        }, {
          label: 'Leads',
          data: [320, 380, 450, 520, 580, 647],
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
            position: 'bottom'
          }
        },
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  };

  const getClientInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "status-active";
      case "prospect":
        return "status-pending";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "prospect":
        return "Prospect";
      default:
        return "Inativo";
    }
  };

  const activeTasks = tasks?.filter(task => task.status !== 'completed') || [];
  const paidRecords = financialRecords?.filter(record => record.status === 'paid') || [];
  const totalPaid = paidRecords.reduce((sum, record) => sum + Number(record.amount), 0);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-200 pb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-16 h-16 client-avatar rounded-xl flex items-center justify-center text-white font-bold text-xl">
                {getClientInitials(client.name)}
              </div>
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{client.name}</h2>
                <p className="text-slate-600">
                  {client.industry && `${client.industry} • `}
                  Cliente desde {client.startDate ? 
                    new Date(client.startDate).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) :
                    client.createdAt ? new Date(client.createdAt).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' }) : 'Data não disponível'
                  }
                </p>
                <div className="flex items-center mt-2 space-x-4">
                  <Badge className={getStatusColor(client.status || 'inactive')}>
                    {getStatusLabel(client.status || 'inactive')}
                  </Badge>
                  {client.monthlyValue && (
                    <span className="text-slate-500 text-sm">
                      Contrato: R$ {Number(client.monthlyValue).toLocaleString('pt-BR')}/mês
                    </span>
                  )}
                </div>
              </div>
            </div>

          </div>
        </DialogHeader>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Performance Charts */}
              <Card className="bg-slate-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Performance e Resultados</h3>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-600">ROAS</p>
                        <p className="text-2xl font-bold text-accent">
                          {performance?.roas ? (performance.roas * 100).toFixed(0) + '%' : 'N/A'}
                        </p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="p-4">
                        <p className="text-sm text-slate-600">Conversões</p>
                        <p className="text-2xl font-bold text-primary">
                          {performance?.totalConversions?.toLocaleString('pt-BR') || '0'}
                        </p>
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-full h-64">
                    <canvas ref={chartRef} className="w-full h-full"></canvas>
                  </div>
                </CardContent>
              </Card>

              {/* Current Tasks */}
              <Card className="bg-slate-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Tarefas Ativas</h3>
                  <div className="space-y-3">
                    {activeTasks.length > 0 ? (
                      activeTasks.map((task) => (
                        <Card key={task.id}>
                          <CardContent className="p-4 flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className={`w-3 h-3 rounded-full ${
                                task.status === 'pending' ? 'bg-amber-500' :
                                task.status === 'in_progress' ? 'bg-blue-500' : 'bg-accent'
                              }`}></div>
                              <div>
                                <p className="font-medium text-slate-900">{task.title}</p>
                                {task.assignedTo && (
                                  <p className="text-sm text-slate-500">Atribuído para: {task.assignedTo}</p>
                                )}
                              </div>
                            </div>
                            {task.dueDate && (
                              <span className="text-sm text-slate-500">
                                {new Date(task.dueDate).toLocaleDateString('pt-BR')}
                              </span>
                            )}
                          </CardContent>
                        </Card>
                      ))
                    ) : (
                      <p className="text-slate-500 text-center py-4">Nenhuma tarefa ativa</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              {/* Contact Info */}
              <Card className="bg-slate-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Informações de Contato</h3>
                  <div className="space-y-3">
                    {client.contactPerson && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">Responsável</p>
                        <p className="text-slate-900">{client.contactPerson}</p>
                      </div>
                    )}
                    {client.email && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">Email</p>
                        <p className="text-slate-900">{client.email}</p>
                      </div>
                    )}
                    {client.phone && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">Telefone</p>
                        <p className="text-slate-900">{client.phone}</p>
                      </div>
                    )}
                    {client.company && (
                      <div>
                        <p className="text-sm font-medium text-slate-600">Empresa</p>
                        <p className="text-slate-900">{client.company}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Financial Info */}
              <Card className="bg-slate-50">
                <CardContent className="p-6">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Informações Financeiras</h3>
                  <div className="space-y-3">
                    {client.monthlyValue && (
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Valor Mensal</span>
                        <span className="font-medium text-slate-900">
                          R$ {Number(client.monthlyValue).toLocaleString('pt-BR')}
                        </span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Status Pagamento</span>
                      <Badge className="status-active">Em dia</Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-slate-600">Valor Total Pago</span>
                      <span className="font-medium text-slate-900">
                        R$ {totalPaid.toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Marketing Performance */}
              {performance && (
                <Card className="bg-slate-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Métricas de Marketing</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Total Gasto</span>
                        <span className="font-medium text-slate-900">
                          R$ {performance.totalSpend.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Receita Gerada</span>
                        <span className="font-medium text-slate-900">
                          R$ {performance.totalRevenue.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Impressões</span>
                        <span className="font-medium text-slate-900">
                          {performance.totalImpressions.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">Cliques</span>
                        <span className="font-medium text-slate-900">
                          {performance.totalClicks.toLocaleString('pt-BR')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">CTR</span>
                        <span className="font-medium text-slate-900">
                          {performance.ctr.toFixed(2)}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-sm text-slate-600">CPC</span>
                        <span className="font-medium text-slate-900">
                          R$ {performance.cpc.toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Integrations Status */}
              {integrations && integrations.length > 0 && (
                <Card className="bg-slate-50">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-semibold text-slate-900 mb-4">Integrações Ativas</h3>
                    <div className="space-y-2">
                      {integrations.map((integration) => (
                        <div key={integration.id} className="flex justify-between items-center">
                          <span className="text-sm text-slate-600 capitalize">
                            {integration.platform === 'google' ? 'Google Ads' : 
                             integration.platform === 'facebook' ? 'Facebook Ads' :
                             integration.platform === 'google_analytics' ? 'Google Analytics' :
                             integration.platform === 'instagram' ? 'Instagram Business' :
                             integration.platform === 'facebook_page' ? 'Facebook Page' :
                             integration.platform}
                          </span>
                          <Badge className={integration.isActive ? 'status-active' : 'bg-slate-100 text-slate-600'}>
                            {integration.isActive ? 'Ativo' : 'Inativo'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <div className="space-y-3">
                <Button className="w-full bg-secondary hover:bg-secondary/90">
                  <Brain className="mr-2 h-4 w-4" />
                  Gerar Estratégia IA
                </Button>
                <Button variant="outline" className="w-full">
                  <Edit className="mr-2 h-4 w-4" />
                  Editar Cliente
                </Button>
                <Button variant="outline" className="w-full">
                  <FileText className="mr-2 h-4 w-4" />
                  Gerar Relatório
                </Button>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
