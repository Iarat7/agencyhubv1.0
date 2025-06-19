import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import ResponsiveLayout from "@/components/layout/responsive-layout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertFinancialRecordSchema } from "@shared/schema";
import { Plus, Search, DollarSign, CreditCard, AlertTriangle, TrendingUp, Calendar, Eye, Trash2, Edit, Clock } from "lucide-react";
import type { FinancialRecord, Client } from "@shared/schema";

export default function Financial() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [selectedRecord, setSelectedRecord] = useState<FinancialRecord | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

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

  const { data: financialRecords, isLoading: isLoadingRecords } = useQuery<FinancialRecord[]>({
    queryKey: ["/api/financial"],
    enabled: isAuthenticated,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const createRecordMutation = useMutation({
    mutationFn: async (recordData: any) => {
      await apiRequest("POST", "/api/financial", recordData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Registro financeiro criado com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao criar registro financeiro",
        variant: "destructive",
      });
    },
  });

  const updateRecordMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/financial/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial"] });
      toast({
        title: "Sucesso",
        description: "Registro atualizado com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao atualizar registro",
        variant: "destructive",
      });
    },
  });

  const deleteRecordMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/financial/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/financial"] });
      toast({
        title: "Sucesso",
        description: "Registro removido com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
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
      toast({
        title: "Erro",
        description: "Falha ao remover registro",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    defaultValues: {
      clientId: "0",
      type: "invoice",
      amount: "",
      dueDate: "",
      status: "pending",
      description: "",
    },
  });

  const onSubmit = (data: any) => {
    const submitData = {
      ...data,
      clientId: data.clientId && data.clientId !== "0" ? parseInt(data.clientId) : null,
      amount: data.amount.toString(),
    };
    
    createRecordMutation.mutate(submitData);
  };

  const markAsPaid = (record: FinancialRecord) => {
    updateRecordMutation.mutate({
      id: record.id,
      data: { 
        status: "paid",
        paidDate: new Date().toISOString().split('T')[0]
      }
    });
  };

  const viewDetails = (record: FinancialRecord) => {
    setSelectedRecord(record);
    setIsDetailsModalOpen(true);
  };

  const deleteRecord = (record: FinancialRecord) => {
    if (confirm("Tem certeza que deseja remover este registro?")) {
      deleteRecordMutation.mutate(record.id);
    }
  };

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "Sem cliente";
    const client = clients?.find(c => c.id === clientId);
    return client?.name || "Cliente não encontrado";
  };

  const filteredRecords = financialRecords?.filter(record => {
    const matchesSearch = record.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         getClientName(record.clientId).toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || record.status === statusFilter;
    
    // Filter by period
    let matchesPeriod = true;
    if (periodFilter !== "all" && record.createdAt) {
      const recordDate = new Date(record.createdAt);
      const now = new Date();
      
      switch (periodFilter) {
        case "7d":
          matchesPeriod = recordDate >= new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case "30d":
          matchesPeriod = recordDate >= new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
          break;
        case "current_month":
          matchesPeriod = recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
          break;
        case "last_month":
          const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
          const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
          matchesPeriod = recordDate >= lastMonth && recordDate <= lastMonthEnd;
          break;
        case "current_year":
          matchesPeriod = recordDate.getFullYear() === now.getFullYear();
          break;
      }
    }
    
    return matchesSearch && matchesStatus && matchesPeriod;
  }) || [];

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case "paid":
        return "status-active";
      case "overdue":
        return "status-overdue";
      case "cancelled":
        return "bg-slate-100 text-slate-600";
      default:
        return "status-pending";
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "payment":
        return <CreditCard className="h-4 w-4" />;
      case "contract":
        return <Calendar className="h-4 w-4" />;
      default:
        return <DollarSign className="h-4 w-4" />;
    }
  };

  const getTotalRevenue = () => {
    return financialRecords?.filter(r => r.status === 'paid')
      .reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  };

  const getPendingAmount = () => {
    return financialRecords?.filter(r => r.status === 'pending')
      .reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  };

  const getOverdueAmount = () => {
    return financialRecords?.filter(r => r.status === 'overdue')
      .reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  };

  const getPendingPayments = () => {
    return financialRecords?.filter(r => r.status === 'pending').length || 0;
  };

  const getOverduePayments = () => {
    return financialRecords?.filter(r => r.status === 'overdue').length || 0;
  };

  const getMonthlyRevenue = () => {
    const now = new Date();
    return financialRecords?.filter(r => {
      if (r.status !== 'paid' || !r.createdAt) return false;
      const recordDate = new Date(r.createdAt);
      return recordDate.getMonth() === now.getMonth() && recordDate.getFullYear() === now.getFullYear();
    }).reduce((sum, r) => sum + Number(r.amount), 0) || 0;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Sem data';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  if (isLoading || isLoadingRecords) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <ResponsiveLayout>
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl lg:text-3xl font-bold text-slate-900">Controle Financeiro</h1>
                <p className="text-slate-600 text-sm lg:text-base">Gerencie contratos, faturas e pagamentos</p>
              </div>
              <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Registro
                  </Button>
                </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Registro Financeiro</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="invoice">Fatura</SelectItem>
                              <SelectItem value="payment">Pagamento</SelectItem>
                              <SelectItem value="contract">Contrato</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o cliente" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="0">Sem cliente específico</SelectItem>
                              {clients?.map((client) => (
                                <SelectItem key={client.id} value={client.id.toString()}>
                                  {client.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$) *</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="dueDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Vencimento</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="paid">Pago</SelectItem>
                                <SelectItem value="overdue">Em atraso</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descrição do registro..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createRecordMutation.isPending}>
                        {createRecordMutation.isPending ? "Criando..." : "Criar Registro"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
            </div>
          </header>

        {/* Filters */}
        <div className="flex items-center space-x-4 mb-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar registros..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os status</SelectItem>
              <SelectItem value="pending">Pendente</SelectItem>
              <SelectItem value="paid">Pago</SelectItem>
              <SelectItem value="overdue">Em atraso</SelectItem>
              <SelectItem value="cancelled">Cancelado</SelectItem>
            </SelectContent>
          </Select>

          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-slate-500" />
            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Filtrar por período" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="7d">Últimos 7 dias</SelectItem>
                <SelectItem value="30d">Últimos 30 dias</SelectItem>
                <SelectItem value="current_month">Mês atual</SelectItem>
                <SelectItem value="last_month">Mês passado</SelectItem>
                <SelectItem value="current_year">Ano atual</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Receita Total</p>
                  <p className="text-2xl font-bold text-accent">
                    R$ {getTotalRevenue().toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-accent h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Valores Pendentes</p>
                  <p className="text-2xl font-bold text-amber-600">
                    R$ {getPendingAmount().toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-amber-500 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Valores em Atraso</p>
                  <p className="text-2xl font-bold text-destructive">
                    R$ {getOverdueAmount().toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="w-12 h-12 bg-destructive/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-destructive h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Registros</p>
                  <p className="text-2xl font-bold text-slate-900">{financialRecords?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <CreditCard className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Financial Records List */}
        <div className="space-y-4">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4 flex-1">
                    <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center">
                      {getTypeIcon(record.type)}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-3 mb-2">
                        <h3 className="font-semibold text-slate-900">
                          {record.description || `${record.type === 'invoice' ? 'Fatura' : record.type === 'payment' ? 'Pagamento' : 'Contrato'}`}
                        </h3>
                        <Badge className={getStatusColor(record.status || 'pending')}>
                          {record.status === 'paid' ? 'Pago' :
                           record.status === 'overdue' ? 'Em atraso' :
                           record.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center space-x-4 text-sm text-slate-500">
                        <span>Cliente: {getClientName(record.clientId)}</span>
                        {record.dueDate && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Vencimento: {new Date(record.dueDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                        {record.paidDate && (
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            Pago em: {new Date(record.paidDate).toLocaleDateString('pt-BR')}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-4">
                    <div className="text-right">
                      <p className="text-2xl font-bold text-slate-900">
                        R$ {Number(record.amount).toLocaleString('pt-BR')}
                      </p>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Button 
                        size="sm"
                        variant="outline"
                        onClick={() => viewDetails(record)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      
                      <Button 
                        size="sm"
                        variant="outline"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => deleteRecord(record)}
                        disabled={deleteRecordMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      
                      {record.status === 'pending' && (
                        <Button 
                          size="sm"
                          className="bg-accent hover:bg-accent/90"
                          onClick={() => markAsPaid(record)}
                          disabled={updateRecordMutation.isPending}
                        >
                          Marcar como Pago
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery || statusFilter !== "all" ? "Nenhum registro encontrado" : "Nenhum registro financeiro"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca" 
                : "Comece criando seu primeiro registro financeiro"
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Registro
              </Button>
            )}
          </div>
        )}

        {/* Modal de Detalhes */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Registro Financeiro</DialogTitle>
            </DialogHeader>
            
            {selectedRecord && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Tipo</label>
                    <p className="text-slate-900 capitalize">
                      {selectedRecord.type === 'invoice' ? 'Fatura' : 
                       selectedRecord.type === 'payment' ? 'Pagamento' : 'Contrato'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Status</label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedRecord.status || 'pending')}>
                        {selectedRecord.status === 'paid' ? 'Pago' :
                         selectedRecord.status === 'overdue' ? 'Em atraso' :
                         selectedRecord.status === 'cancelled' ? 'Cancelado' : 'Pendente'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-500">Cliente</label>
                  <p className="text-slate-900">{getClientName(selectedRecord.clientId)}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-slate-500">Valor</label>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {Number(selectedRecord.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {selectedRecord.dueDate && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Data de Vencimento</label>
                      <p className="text-slate-900">
                        {new Date(selectedRecord.dueDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                  {selectedRecord.paidDate && (
                    <div>
                      <label className="text-sm font-medium text-slate-500">Data do Pagamento</label>
                      <p className="text-slate-900">
                        {new Date(selectedRecord.paidDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}
                </div>

                {selectedRecord.description && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Descrição</label>
                    <p className="text-slate-900">{selectedRecord.description}</p>
                  </div>
                )}

                {selectedRecord.invoiceNumber && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Número da Fatura</label>
                    <p className="text-slate-900">{selectedRecord.invoiceNumber}</p>
                  </div>
                )}

                {selectedRecord.category && (
                  <div>
                    <label className="text-sm font-medium text-slate-500">Categoria</label>
                    <p className="text-slate-900">{selectedRecord.category}</p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4 text-sm text-slate-500">
                  <div>
                    <label className="text-sm font-medium text-slate-500">Criado em</label>
                    <p>{selectedRecord.createdAt ? new Date(selectedRecord.createdAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-500">Atualizado em</label>
                    <p>{selectedRecord.updatedAt ? new Date(selectedRecord.updatedAt).toLocaleDateString('pt-BR') : 'N/A'}</p>
                  </div>
                </div>

                <div className="flex justify-end space-x-2 pt-4">
                  {selectedRecord.status === 'pending' && (
                    <Button 
                      onClick={() => {
                        markAsPaid(selectedRecord);
                        setIsDetailsModalOpen(false);
                      }}
                      className="bg-accent hover:bg-accent/90"
                      disabled={updateRecordMutation.isPending}
                    >
                      Marcar como Pago
                    </Button>
                  )}
                  <Button 
                    variant="outline"
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => {
                      deleteRecord(selectedRecord);
                      setIsDetailsModalOpen(false);
                    }}
                    disabled={deleteRecordMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row items-start lg:items-center space-y-4 lg:space-y-0 lg:space-x-4 mb-6 overflow-x-auto">
          <div className="relative flex-1 w-full max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar registros..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2 w-full lg:w-auto">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48">
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="pending">Pendente</SelectItem>
                <SelectItem value="paid">Pago</SelectItem>
                <SelectItem value="overdue">Em atraso</SelectItem>
                <SelectItem value="cancelled">Cancelado</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex items-center space-x-2">
              <Calendar className="h-4 w-4 text-slate-500" />
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os períodos</SelectItem>
                  <SelectItem value="7d">Últimos 7 dias</SelectItem>
                  <SelectItem value="30d">Últimos 30 dias</SelectItem>
                  <SelectItem value="current_month">Mês atual</SelectItem>
                  <SelectItem value="last_month">Mês passado</SelectItem>
                  <SelectItem value="current_year">Ano atual</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Receita Total</p>
                  <p className="text-xl lg:text-2xl font-bold text-accent">
                    R$ {getTotalRevenue().toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <TrendingUp className="text-accent h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pagamentos Pendentes</p>
                  <p className="text-xl lg:text-2xl font-bold text-orange-600">
                    {getPendingPayments()}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                  <Clock className="text-orange-600 h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Pagamentos em Atraso</p>
                  <p className="text-xl lg:text-2xl font-bold text-red-600">
                    {getOverduePayments()}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-red-100 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-red-600 h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Receita Este Mês</p>
                  <p className="text-xl lg:text-2xl font-bold text-green-600">
                    R$ {getMonthlyRevenue().toLocaleString('pt-BR')}
                  </p>
                </div>
                <div className="w-10 h-10 lg:w-12 lg:h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-green-600 h-5 w-5 lg:h-6 lg:w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Records List */}
        <div className="grid gap-4 lg:gap-6">
          {filteredRecords.map((record) => (
            <Card key={record.id} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4 lg:p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 mb-2">
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(record.type)}
                        <span className="font-medium text-slate-900 truncate">
                          {record.description || `${record.type === 'payment' ? 'Pagamento' : record.type === 'invoice' ? 'Fatura' : 'Contrato'} #${record.id}`}
                        </span>
                      </div>
                      <Badge className={getStatusColor(record.status)}>
                        {record.status === 'paid' ? 'Pago' : 
                         record.status === 'pending' ? 'Pendente' : 
                         record.status === 'overdue' ? 'Em atraso' : 'Cancelado'}
                      </Badge>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-slate-600">
                      <span>Cliente: {getClientName(record.clientId)}</span>
                      <span>Data: {formatDate(record.dueDate)}</span>
                      <span className="font-medium text-slate-900">
                        R$ {parseFloat(record.amount).toLocaleString('pt-BR')}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      size="sm"
                      variant="outline"
                      onClick={() => viewDetails(record)}
                      className="flex-1 sm:flex-none"
                    >
                      <Eye className="h-4 w-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Ver</span>
                    </Button>
                    
                    <Button 
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50 flex-1 sm:flex-none"
                      onClick={() => deleteRecord(record)}
                      disabled={deleteRecordMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4 mr-2 sm:mr-0" />
                      <span className="sm:hidden">Excluir</span>
                    </Button>
                    
                    {record.status === 'pending' && (
                      <Button 
                        size="sm"
                        className="bg-accent hover:bg-accent/90 flex-1 sm:flex-none"
                        onClick={() => markAsPaid(record)}
                        disabled={updateRecordMutation.isPending}
                      >
                        <span className="text-xs">Marcar Pago</span>
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {filteredRecords.length === 0 && (
          <div className="text-center py-12">
            <CreditCard className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery || statusFilter !== "all" ? "Nenhum registro encontrado" : "Nenhum registro financeiro"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery || statusFilter !== "all"
                ? "Tente ajustar os filtros de busca" 
                : "Comece criando seu primeiro registro financeiro"
              }
            </p>
            {!searchQuery && statusFilter === "all" && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Criar Primeiro Registro
              </Button>
            )}
          </div>
        )}

        {/* Details Modal */}
        <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Detalhes do Registro</DialogTitle>
            </DialogHeader>
            {selectedRecord && (
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-600">Tipo</label>
                  <p className="text-slate-900">
                    {selectedRecord.type === 'payment' ? 'Pagamento' : 
                     selectedRecord.type === 'invoice' ? 'Fatura' : 'Contrato'}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600">Cliente</label>
                  <p className="text-slate-900">{getClientName(selectedRecord.clientId)}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600">Descrição</label>
                  <p className="text-slate-900">{selectedRecord.description || 'Sem descrição'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600">Valor</label>
                  <p className="text-slate-900 font-medium">
                    R$ {parseFloat(selectedRecord.amount).toLocaleString('pt-BR')}
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600">Status</label>
                  <Badge className={getStatusColor(selectedRecord.status)}>
                    {selectedRecord.status === 'paid' ? 'Pago' : 
                     selectedRecord.status === 'pending' ? 'Pendente' : 
                     selectedRecord.status === 'overdue' ? 'Em atraso' : 'Cancelado'}
                  </Badge>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-slate-600">Data de Vencimento</label>
                  <p className="text-slate-900">{formatDate(selectedRecord.dueDate)}</p>
                </div>
                
                <div className="flex justify-end space-x-2 pt-4">
                  <Button
                    variant="destructive"
                    onClick={() => {
                      deleteRecord(selectedRecord);
                      setIsDetailsModalOpen(false);
                    }}
                    disabled={deleteRecordMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Remover
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
        
      </ResponsiveLayout>
    </div>
  );
}
