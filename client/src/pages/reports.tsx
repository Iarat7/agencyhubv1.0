import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { FileText, Download, TrendingUp, DollarSign, Users, Calendar } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface FinancialReport {
  id: number;
  name: string;
  type: string;
  period: string;
  startDate: string;
  endDate: string;
  generatedBy: string;
  createdAt: string;
  filePath?: string;
}

interface ReportSummary {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  clientCount: number;
}

export default function Reports() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedDateRange, setSelectedDateRange] = useState<any>(null);
  const [selectedReportType, setSelectedReportType] = useState("income_statement");
  const [selectedClient, setSelectedClient] = useState<string>("");

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Logging in again...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
  }, [isAuthenticated, isLoading, toast]);

  const { data: reports = [], isLoading: isLoadingReports } = useQuery<any[]>({
    queryKey: ["/api/reports"],
  });

  const { data: clients = [] } = useQuery<any[]>({
    queryKey: ["/api/clients"],
  });

  const generateReportMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao gerar relatório");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Relatório gerado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/reports"] });
    },
    onError: () => {
      toast({ title: "Erro ao gerar relatório", variant: "destructive" });
    },
  });

  const downloadReportMutation = useMutation({
    mutationFn: async (reportId: number) => {
      const response = await fetch(`/api/reports/${reportId}/download`);
      if (!response.ok) throw new Error("Erro ao baixar relatório");
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `relatorio_${reportId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    },
    onSuccess: () => {
      toast({ title: "Relatório baixado com sucesso!" });
    },
    onError: () => {
      toast({ title: "Erro ao baixar relatório", variant: "destructive" });
    },
  });

  const handleGenerateReport = () => {
    if (!selectedDateRange?.from || !selectedDateRange?.to) {
      toast({ 
        title: "Selecione um período", 
        description: "É necessário selecionar um período para gerar o relatório",
        variant: "destructive" 
      });
      return;
    }

    const data = {
      type: selectedReportType,
      startDate: selectedDateRange.from.toISOString().split('T')[0],
      endDate: selectedDateRange.to.toISOString().split('T')[0],
      clientId: selectedClient || undefined,
    };

    generateReportMutation.mutate(data);
  };

  const getReportTypeLabel = (type: string) => {
    const types: Record<string, string> = {
      income_statement: "Demonstrativo de Resultados",
      balance_sheet: "Balanço Patrimonial",
      cash_flow: "Fluxo de Caixa",
      custom: "Relatório Personalizado"
    };
    return types[type] || type;
  };

  const getReportTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      income_statement: "bg-green-100 text-green-800",
      balance_sheet: "bg-blue-100 text-blue-800",
      cash_flow: "bg-purple-100 text-purple-800",
      custom: "bg-orange-100 text-orange-800"
    };
    return colors[type] || "bg-gray-100 text-gray-800";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="content-area sidebar-expanded">
      <div className="content-wrapper">
        <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Relatórios Financeiros</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gere e gerencie relatórios financeiros avançados com exportação em PDF
          </p>
        </div>
      </div>

      <Tabs defaultValue="generate" className="space-y-6">
        <TabsList>
          <TabsTrigger value="generate">Gerar Relatório</TabsTrigger>
          <TabsTrigger value="history">Histórico</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="generate">
          <Card>
            <CardHeader>
              <CardTitle>Gerar Novo Relatório</CardTitle>
              <CardDescription>
                Configure os parâmetros do relatório financeiro que deseja gerar
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Tipo de Relatório</Label>
                  <Select value={selectedReportType} onValueChange={setSelectedReportType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="income_statement">Demonstrativo de Resultados</SelectItem>
                      <SelectItem value="balance_sheet">Balanço Patrimonial</SelectItem>
                      <SelectItem value="cash_flow">Fluxo de Caixa</SelectItem>
                      <SelectItem value="custom">Relatório Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label>Cliente (Opcional)</Label>
                  <Select value={selectedClient} onValueChange={setSelectedClient}>
                    <SelectTrigger>
                      <SelectValue placeholder="Todos os clientes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os clientes</SelectItem>
                      {clients.map((client: any) => (
                        <SelectItem key={client.id} value={client.id.toString()}>
                          {client.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Data Inicial</Label>
                  <Input
                    id="startDate"
                    type="date"
                    onChange={(e) => setSelectedDateRange({
                      ...selectedDateRange,
                      from: new Date(e.target.value)
                    })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">Data Final</Label>
                  <Input
                    id="endDate"
                    type="date"
                    onChange={(e) => setSelectedDateRange({
                      ...selectedDateRange,
                      to: new Date(e.target.value)
                    })}
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <Button 
                  onClick={handleGenerateReport}
                  disabled={generateReportMutation.isPending}
                  className="min-w-[150px]"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  {generateReportMutation.isPending ? "Gerando..." : "Gerar Relatório"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <div className="space-y-6">
            <div className="grid grid-cols-1 gap-4">
              {reports.map((report: FinancialReport) => (
                <Card key={report.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          <FileText className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg">{report.name}</h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600">
                            <Badge className={getReportTypeColor(report.type)}>
                              {getReportTypeLabel(report.type)}
                            </Badge>
                            <span>•</span>
                            <span>{report.period}</span>
                            <span>•</span>
                            <span>Gerado em {new Date(report.createdAt).toLocaleDateString('pt-BR')}</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => downloadReportMutation.mutate(report.id)}
                          disabled={downloadReportMutation.isPending}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Download PDF
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              
              {reports.length === 0 && (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                      Nenhum relatório encontrado
                    </h3>
                    <p className="text-gray-600 dark:text-gray-400 mb-4">
                      Gere seu primeiro relatório financeiro para começar
                    </p>
                    <Button variant="outline">
                      Gerar Primeiro Relatório
                    </Button>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="analytics">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Receita Total</p>
                    <p className="text-2xl font-bold text-green-600">R$ 125.400</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-red-100 rounded-lg">
                    <DollarSign className="h-5 w-5 text-red-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Despesas Totais</p>
                    <p className="text-2xl font-bold text-red-600">R$ 45.200</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Lucro Líquido</p>
                    <p className="text-2xl font-bold text-blue-600">R$ 80.200</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm text-gray-600">Clientes Ativos</p>
                    <p className="text-2xl font-bold text-purple-600">24</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Resumo Financeiro</CardTitle>
              <CardDescription>
                Análise detalhada dos dados financeiros dos últimos meses
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[400px] flex items-center justify-center text-gray-500">
                Gráfico de análise financeira será implementado em breve
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </div>
      </div>
    </div>
  );
}