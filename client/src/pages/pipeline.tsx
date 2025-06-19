import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import { MobilePipeline } from "@/components/pipeline/mobile-pipeline";
import { useSidebar } from "@/hooks/use-sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertOpportunitySchema, insertClientSchema } from "@shared/schema";
import { Plus, DollarSign, Target, TrendingUp, Users, MoreVertical, Eye, Edit, Trash2, ArrowLeft, ArrowRight, Calendar, Phone, Mail, Filter, UserPlus, CheckCircle, X } from "lucide-react";
import type { Opportunity } from "@shared/schema";

const stageNames = {
  prospecting: "Prospecção",
  qualification: "Qualificação", 
  proposal: "Proposta",
  negotiation: "Negociação",
  closed_won: "Fechado - Ganho",
  closed_lost: "Fechado - Perdido"
};

const stageColors = {
  prospecting: "bg-slate-100 text-slate-700 border-slate-200",
  qualification: "bg-blue-100 text-blue-700 border-blue-200",
  proposal: "bg-amber-100 text-amber-700 border-amber-200",
  negotiation: "bg-purple-100 text-purple-700 border-purple-200",
  closed_won: "bg-green-100 text-green-700 border-green-200",
  closed_lost: "bg-red-100 text-red-700 border-red-200"
};

export default function Pipeline() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const { isCollapsed } = useSidebar();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [periodFilter, setPeriodFilter] = useState("all");
  const [isCreateClientModalOpen, setIsCreateClientModalOpen] = useState(false);
  const [wonOpportunity, setWonOpportunity] = useState<Opportunity | null>(null);

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

  const { data: opportunities = [] } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
    enabled: isAuthenticated,
  });

  const form = useForm({
    resolver: zodResolver(insertOpportunitySchema),
    defaultValues: {
      title: "",
      clientName: "",
      email: "",
      phone: "",
      value: "",
      probability: "",
      stage: "prospecting",
      expectedCloseDate: "",
      notes: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertOpportunitySchema),
    defaultValues: {
      title: "",
      clientName: "",
      email: "",
      phone: "",
      value: "",
      probability: "",
      stage: "prospecting",
      expectedCloseDate: "",
      notes: "",
    },
  });

  const clientForm = useForm({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      industry: "",
      contactPerson: "",
      monthlyValue: "",
      startDate: "",
      status: "active",
      notes: "",
    },
  });

  const createOpportunityMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/opportunities", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Oportunidade criada com sucesso!",
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
        description: "Falha ao criar oportunidade",
        variant: "destructive",
      });
    },
  });

  const updateOpportunityMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/opportunities/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      setIsEditModalOpen(false);
      setSelectedOpportunity(null);
      editForm.reset();
      toast({
        title: "Sucesso",
        description: "Oportunidade atualizada com sucesso!",
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
        description: "Falha ao atualizar oportunidade",
        variant: "destructive",
      });
    },
  });

  const deleteOpportunityMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/opportunities/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Sucesso",
        description: "Oportunidade excluída com sucesso!",
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
        description: "Falha ao excluir oportunidade",
        variant: "destructive",
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/clients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsCreateClientModalOpen(false);
      setWonOpportunity(null);
      clientForm.reset();
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso! A oportunidade foi convertida em cliente.",
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
        description: "Falha ao criar cliente",
        variant: "destructive",
      });
    },
  });

  const updateStageMutation = useMutation({
    mutationFn: async ({ id, stage }: { id: number; stage: string }) => {
      await apiRequest("PUT", `/api/opportunities/${id}`, { stage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/opportunities"] });
      toast({
        title: "Sucesso",
        description: "Estágio da oportunidade atualizado!",
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
        description: "Falha ao atualizar estágio",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createOpportunityMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (selectedOpportunity) {
      updateOpportunityMutation.mutate({ id: selectedOpportunity.id, data });
    }
  };

  const onCreateClientSubmit = (data: any) => {
    createClientMutation.mutate(data);
  };

  const moveOpportunity = (opportunity: Opportunity, newStage: string) => {
    updateStageMutation.mutate({ id: opportunity.id, stage: newStage });
    
    // If marking as won, open client creation modal
    if (newStage === "closed_won") {
      setWonOpportunity(opportunity);
      // Pre-fill the client form with opportunity data
      clientForm.reset({
        name: opportunity.clientName,
        email: opportunity.email || "",
        phone: opportunity.phone || "",
        company: opportunity.clientName,
        industry: "",
        contactPerson: opportunity.clientName,
        monthlyValue: opportunity.value?.toString() || "",
        startDate: new Date().toISOString().split('T')[0],
        status: "active",
        notes: `Cliente convertido da oportunidade: ${opportunity.title}`,
      });
      setIsCreateClientModalOpen(true);
    }
  };

  const openViewModal = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setIsViewModalOpen(true);
  };

  const openEditModal = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    editForm.reset({
      title: opportunity.title,
      clientName: opportunity.clientName,
      email: opportunity.email || "",
      phone: opportunity.phone || "",
      value: opportunity.value?.toString() || "",
      probability: opportunity.probability?.toString() || "",
      stage: opportunity.stage || "prospecting",
      expectedCloseDate: opportunity.expectedCloseDate || "",
      notes: opportunity.notes || "",
    });
    setIsEditModalOpen(true);
  };

  const deleteOpportunity = (id: number) => {
    deleteOpportunityMutation.mutate(id);
  };

  const stages = ["prospecting", "qualification", "proposal", "negotiation", "closed_won", "closed_lost"];

  const filterOpportunitiesByPeriod = (opportunities: Opportunity[]) => {
    if (periodFilter === "all") return opportunities;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return opportunities.filter(opp => {
      if (!opp.expectedCloseDate) return periodFilter === "no_due_date";
      
      const closeDate = new Date(opp.expectedCloseDate);
      
      switch (periodFilter) {
        case "today":
          return closeDate >= startOfToday && closeDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
        case "this_week":
          return closeDate >= startOfWeek && closeDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        case "this_month":
          return closeDate >= startOfMonth && closeDate < new Date(now.getFullYear(), now.getMonth() + 1, 1);
        case "overdue":
          return closeDate < startOfToday;
        case "no_due_date":
          return false;
        default:
          return true;
      }
    });
  };

  const getOpportunitiesByStage = (stage: string) => {
    const filteredOpportunities = filterOpportunitiesByPeriod(opportunities);
    return filteredOpportunities.filter((opp: Opportunity) => opp.stage === stage);
  };

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return "R$ 0,00";
    return new Intl.NumberFormat("pt-BR", {
      style: "currency",
      currency: "BRL",
    }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Sidebar />
        <main className="ml-64 p-8">
          <div className="flex items-center justify-center h-96">
            <div className="text-lg">Carregando...</div>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className="ml-0 lg:ml-64 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Pipeline Comercial</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Gerencie suas oportunidades de vendas em cada estágio do funil
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4 w-full sm:w-auto">
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filtrar por período" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Períodos</SelectItem>
                  <SelectItem value="today">Fechamento Hoje</SelectItem>
                  <SelectItem value="this_week">Fechamento Esta Semana</SelectItem>
                  <SelectItem value="this_month">Fechamento Este Mês</SelectItem>
                  <SelectItem value="overdue">Fechamento Em Atraso</SelectItem>
                  <SelectItem value="no_due_date">Sem Data de Fechamento</SelectItem>
                </SelectContent>
              </Select>
              
              {periodFilter !== "all" && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPeriodFilter("all")}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar Filtro
                </Button>
              )}
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Oportunidade
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Nova Oportunidade</DialogTitle>
                  <DialogDescription>
                    Adicione uma nova oportunidade ao pipeline de vendas
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Título *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome da oportunidade" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="clientName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nome do Cliente *</FormLabel>
                            <FormControl>
                              <Input placeholder="Nome do prospect/cliente" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="email@exemplo.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Telefone</FormLabel>
                            <FormControl>
                              <Input placeholder="(11) 99999-9999" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="value"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Valor (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="probability"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Probabilidade (%)</FormLabel>
                            <FormControl>
                              <Input type="number" min="0" max="100" placeholder="0" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="expectedCloseDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data Prevista</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="stage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Estágio</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o estágio" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="prospecting">Prospecção</SelectItem>
                              <SelectItem value="qualification">Qualificação</SelectItem>
                              <SelectItem value="proposal">Proposta</SelectItem>
                              <SelectItem value="negotiation">Negociação</SelectItem>
                              <SelectItem value="closed_won">Fechado - Ganho</SelectItem>
                              <SelectItem value="closed_lost">Fechado - Perdido</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Detalhes sobre a oportunidade..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createOpportunityMutation.isPending}>
                        {createOpportunityMutation.isPending ? "Criando..." : "Criar Oportunidade"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Mobile Pipeline View */}
          <div className="lg:hidden">
            <MobilePipeline
              opportunities={opportunities}
              onStageChange={(id, newStage) => updateStageMutation.mutate({ id, stage: newStage })}
              onView={openViewModal}
              onEdit={openEditModal}
              onDelete={deleteOpportunity}
            />
          </div>

          {/* Desktop Pipeline Board */}
          <div className="hidden lg:grid grid-cols-6 gap-4 h-[calc(100vh-200px)]">
            {stages.map((stage) => {
              const stageOpportunities = getOpportunitiesByStage(stage);
              const totalValue = stageOpportunities.reduce((sum: number, opp: Opportunity) => sum + (Number(opp.value) || 0), 0);
              
              return (
                <div key={stage} className="flex flex-col">
                  <div className={`p-4 rounded-t-lg border-2 ${stageColors[stage as keyof typeof stageColors]}`}>
                    <h3 className="font-semibold text-sm">{stageNames[stage as keyof typeof stageNames]}</h3>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs">{stageOpportunities.length} deals</span>
                      <span className="text-xs font-medium">{formatCurrency(totalValue)}</span>
                    </div>
                  </div>
                  
                  <div className="flex-1 bg-gray-50 border-x-2 border-b-2 border-gray-200 rounded-b-lg p-2 overflow-y-auto">
                    <div className="space-y-3">
                      {stageOpportunities.map((opportunity) => (
                        <Card key={opportunity.id} className="p-4 hover:shadow-md transition-shadow cursor-pointer bg-white">
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="font-medium text-sm text-gray-900 leading-tight">
                              {opportunity.title}
                            </h4>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => openViewModal(opportunity)}>
                                  <Eye className="mr-2 h-4 w-4" />
                                  Ver Detalhes
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openEditModal(opportunity)}>
                                  <Edit className="mr-2 h-4 w-4" />
                                  Editar
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => deleteOpportunity(opportunity.id)}
                                  className="text-red-600"
                                >
                                  <Trash2 className="mr-2 h-4 w-4" />
                                  Excluir
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                          
                          <p className="text-sm text-gray-600 mb-2">{opportunity.clientName}</p>
                          
                          <div className="text-lg font-bold text-gray-900 mb-2">
                            {formatCurrency(Number(opportunity.value))}
                          </div>
                          
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{opportunity.probability}%</span>
                            {opportunity.expectedCloseDate && (
                              <span>{formatDate(opportunity.expectedCloseDate)}</span>
                            )}
                          </div>
                          
                          {/* Stage Movement Buttons */}
                          <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
                            {/* Navigation buttons for active opportunities */}
                            {stage !== "closed_lost" && stage !== "closed_won" && (
                              <div className="flex justify-between">
                                {stage !== "prospecting" && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => {
                                      const currentIndex = stages.indexOf(stage);
                                      const previousStage = stages[currentIndex - 1];
                                      moveOpportunity(opportunity, previousStage);
                                    }}
                                    className="flex-1 mr-1"
                                  >
                                    <ArrowLeft className="h-3 w-3" />
                                  </Button>
                                )}
                                
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const currentIndex = stages.indexOf(stage);
                                    const nextStage = stages[currentIndex + 1];
                                    moveOpportunity(opportunity, nextStage);
                                  }}
                                  className={`flex-1 ${stage === "prospecting" ? "" : "ml-1"}`}
                                >
                                  <ArrowRight className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                            
                            {/* Win/Lose Buttons only for negotiation stage */}
                            {stage === "negotiation" && (
                              <div className="grid grid-cols-2 gap-2">
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveOpportunity(opportunity, "closed_won")}
                                  className="text-green-700 border-green-300 hover:bg-green-50 hover:border-green-400 font-medium"
                                >
                                  Ganho
                                </Button>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => moveOpportunity(opportunity, "closed_lost")}
                                  className="text-red-700 border-red-300 hover:bg-red-50 hover:border-red-400 font-medium"
                                >
                                  Perdido
                                </Button>
                              </div>
                            )}

                            {/* Reopen button for closed opportunities */}
                            {(stage === "closed_lost" || stage === "closed_won") && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => moveOpportunity(opportunity, "negotiation")}
                                className="w-full border-blue-300 hover:bg-blue-50 hover:border-blue-400 font-medium text-xs text-[#62a6fb]"
                              >
                                <ArrowLeft className="h-3 w-3 mr-1" />
                                Voltar Oportunidade
                              </Button>
                            )}
                          </div>
                        </Card>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* View Modal */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Detalhes da Oportunidade</DialogTitle>
              </DialogHeader>
              {selectedOpportunity && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedOpportunity.title}</h3>
                    <p className="text-muted-foreground">{selectedOpportunity.clientName}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center">
                        <Mail className="mr-2 h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedOpportunity.email || "Não informado"}</span>
                      </div>
                      <div className="flex items-center">
                        <Phone className="mr-2 h-4 w-4 text-gray-500" />
                        <span className="text-sm">{selectedOpportunity.phone || "Não informado"}</span>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <div>
                        <span className="text-sm font-medium">Valor: </span>
                        <span className="text-lg font-bold">{formatCurrency(Number(selectedOpportunity.value))}</span>
                      </div>
                      <div>
                        <span className="text-sm font-medium">Probabilidade: </span>
                        <span>{selectedOpportunity.probability}%</span>
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <span className="text-sm font-medium">Estágio: </span>
                    <Badge className={stageColors[selectedOpportunity.stage as keyof typeof stageColors]}>
                      {stageNames[selectedOpportunity.stage as keyof typeof stageNames]}
                    </Badge>
                  </div>
                  
                  {selectedOpportunity.expectedCloseDate && (
                    <div className="flex items-center">
                      <Calendar className="mr-2 h-4 w-4 text-gray-500" />
                      <span className="text-sm">Data prevista: {formatDate(selectedOpportunity.expectedCloseDate)}</span>
                    </div>
                  )}
                  
                  {selectedOpportunity.notes && (
                    <div>
                      <span className="text-sm font-medium">Observações:</span>
                      <p className="text-sm text-muted-foreground mt-1">{selectedOpportunity.notes}</p>
                    </div>
                  )}
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle>Editar Oportunidade</DialogTitle>
                <DialogDescription>
                  Atualize as informações da oportunidade
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da oportunidade" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={editForm.control}
                      name="clientName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do prospect/cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <FormField
                      control={editForm.control}
                      name="value"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="probability"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Probabilidade (%)</FormLabel>
                          <FormControl>
                            <Input type="number" min="0" max="100" placeholder="0" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="expectedCloseDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data Prevista</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={editForm.control}
                    name="stage"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Estágio</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione o estágio" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="prospecting">Prospecção</SelectItem>
                            <SelectItem value="qualification">Qualificação</SelectItem>
                            <SelectItem value="proposal">Proposta</SelectItem>
                            <SelectItem value="negotiation">Negociação</SelectItem>
                            <SelectItem value="closed_won">Fechado - Ganho</SelectItem>
                            <SelectItem value="closed_lost">Fechado - Perdido</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detalhes sobre a oportunidade..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateOpportunityMutation.isPending}>
                      {updateOpportunityMutation.isPending ? "Atualizando..." : "Atualizar Oportunidade"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>

          {/* Create Client Modal */}
          <Dialog open={isCreateClientModalOpen} onOpenChange={setIsCreateClientModalOpen}>
            <DialogContent className="sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <UserPlus className="h-5 w-5" />
                  Converter em Cliente
                </DialogTitle>
                <DialogDescription>
                  A oportunidade foi marcada como ganho! Crie o cliente no CRM para continuar o relacionamento.
                </DialogDescription>
              </DialogHeader>
              <Form {...clientForm}>
                <form onSubmit={clientForm.handleSubmit(onCreateClientSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome do Cliente *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome ou razão social" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={clientForm.control}
                      name="company"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Empresa</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da empresa" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="email@exemplo.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Telefone</FormLabel>
                          <FormControl>
                            <Input placeholder="(11) 99999-9999" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="contactPerson"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Pessoa de Contato</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do responsável" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="industry"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Setor</FormLabel>
                          <FormControl>
                            <Input placeholder="Ex: Tecnologia, Saúde, Educação" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={clientForm.control}
                      name="monthlyValue"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Valor Mensal (R$)</FormLabel>
                          <FormControl>
                            <Input type="number" step="0.01" placeholder="0.00" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={clientForm.control}
                      name="startDate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Data de Início</FormLabel>
                          <FormControl>
                            <Input type="date" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={clientForm.control}
                    name="notes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observações</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Informações adicionais sobre o cliente..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-2">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => {
                        setIsCreateClientModalOpen(false);
                        setWonOpportunity(null);
                      }}
                    >
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={createClientMutation.isPending}>
                      {createClientMutation.isPending ? "Criando Cliente..." : "Criar Cliente"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </main>
    </div>
  );
}