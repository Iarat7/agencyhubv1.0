import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { AiStrategiesSkeleton } from "@/components/skeletons/ai-strategies-skeleton";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { Brain, Lightbulb, Target, TrendingUp, Search, Plus, FileText, Zap, CheckCircle, XCircle, Clock, Play, ArrowRight, ChevronRight, Filter } from "lucide-react";
import type { AiStrategy, Client } from "@shared/schema";

export default function AiStrategies() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [clientFilter, setClientFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [selectedStrategy, setSelectedStrategy] = useState<AiStrategy | null>(null);

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

  const { data: strategies, isLoading: isLoadingStrategies } = useQuery<AiStrategy[]>({
    queryKey: ["/api/ai-strategies"],
    enabled: isAuthenticated,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const generateStrategyMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/ai-strategies/generate", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-strategies"] });
      setIsGenerateModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Estratégia gerada com sucesso!",
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
        description: "Falha ao gerar estratégia",
        variant: "destructive",
      });
    },
  });

  const generateContentMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/ai-strategies/content-ideas", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-strategies"] });
      setIsContentModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Ideias de conteúdo geradas com sucesso!",
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
        description: "Falha ao gerar ideias de conteúdo",
        variant: "destructive",
      });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, rejectionReason }: { id: number; status: string; rejectionReason?: string }) => {
      await apiRequest("PUT", `/api/ai-strategies/${id}/status`, { status, rejectionReason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/ai-strategies"] });
      toast({
        title: "Sucesso",
        description: "Status da estratégia atualizado com sucesso!",
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
        description: "Erro ao atualizar status da estratégia.",
        variant: "destructive",
      });
    },
  });

  const strategyForm = useForm({
    defaultValues: {
      clientId: "",
      objective: "",
      customObjective: "",
      targetPeriod: "",
      customPeriod: "",
      budget: "",
      budgetPeriod: "monthly",
      goals: "",
      challenges: "",
      targetAudience: "",
      creationDate: new Date().toISOString().split('T')[0],
      executionStartDate: "",
      executionEndDate: "",
    },
  });

  const contentForm = useForm({
    defaultValues: {
      clientId: "",
      contentType: "blog post",
    },
  });

  const onGenerateStrategy = (data: any) => {
    generateStrategyMutation.mutate({
      clientId: parseInt(data.clientId),
      objective: data.objective,
      customObjective: data.customObjective,
      targetPeriod: data.targetPeriod,
      customPeriod: data.customPeriod,
      budget: data.budget ? parseFloat(data.budget) : undefined,
      budgetPeriod: data.budgetPeriod,
      goals: data.goals.split(',').map((g: string) => g.trim()).filter(Boolean),
      challenges: data.challenges.split(',').map((c: string) => c.trim()).filter(Boolean),
      targetAudience: data.targetAudience,
      strategyCreationDate: data.creationDate,
      executionStartDate: data.executionStartDate,
      executionEndDate: data.executionEndDate,
    });
  };

  const onGenerateContent = (data: any) => {
    generateContentMutation.mutate({
      clientId: parseInt(data.clientId),
      contentType: data.contentType,
    });
  };

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "Geral";
    const client = clients?.find(c => c.id === clientId);
    return client?.name || "Cliente não encontrado";
  };

  const filteredStrategies = strategies?.filter(strategy => {
    // Filtro por busca
    const matchesSearch = strategy.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      getClientName(strategy.clientId).toLowerCase().includes(searchQuery.toLowerCase());

    // Filtro por cliente
    const matchesClient = clientFilter === "all" || 
      (strategy.clientId?.toString() === clientFilter);

    // Filtro por período (baseado na data de execução prevista)
    let matchesPeriod = true;
    if (periodFilter !== "all") {
      const referenceDate = strategy.executionStartDate ? 
        new Date(strategy.executionStartDate) : 
        strategy.strategyCreationDate ? 
          new Date(strategy.strategyCreationDate) : 
          strategy.createdAt ? new Date(strategy.createdAt) : null;

      if (referenceDate) {
        const now = new Date();

        switch (periodFilter) {
          case "today":
            matchesPeriod = referenceDate.toDateString() === now.toDateString();
            break;
          case "week":
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const weekAhead = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            matchesPeriod = referenceDate >= weekAgo && referenceDate <= weekAhead;
            break;
          case "month":
            matchesPeriod = referenceDate.getMonth() === now.getMonth() && 
                           referenceDate.getFullYear() === now.getFullYear();
            break;
          case "quarter":
            const currentQuarter = Math.floor(now.getMonth() / 3);
            const strategyQuarter = Math.floor(referenceDate.getMonth() / 3);
            matchesPeriod = currentQuarter === strategyQuarter && 
                           referenceDate.getFullYear() === now.getFullYear();
            break;
        }
      }
    }

    return matchesSearch && matchesClient && matchesPeriod;
  }) || [];

  const getNextStatus = (currentStatus: string) => {
    const statusFlow = {
      'created': 'under_review',
      'under_review': 'approved',
      'approved': 'executing',
      'rejected': null,
      'executing': null
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getPreviousStatus = (currentStatus: string) => {
    const statusFlow = {
      'under_review': 'created',
      'approved': 'under_review',
      'executing': 'approved',
      'rejected': 'under_review',
      'created': null
    };
    return statusFlow[currentStatus as keyof typeof statusFlow];
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "content_strategy":
        return <FileText className="h-5 w-5" />;
      case "growth_strategy":
        return <TrendingUp className="h-5 w-5" />;
      default:
        return <Target className="h-5 w-5" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case "content_strategy":
        return "bg-blue-100 text-blue-700";
      case "growth_strategy":
        return "bg-accent/10 text-accent";
      default:
        return "bg-purple-100 text-purple-700";
    }
  };

  const parseStrategyContent = (content: string) => {
    try {
      return JSON.parse(content);
    } catch {
      return { title: "Estratégia", executive_summary: content };
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "created":
        return <Clock className="h-4 w-4" />;
      case "under_review":
        return <ArrowRight className="h-4 w-4" />;
      case "approved":
        return <CheckCircle className="h-4 w-4" />;
      case "rejected":
        return <XCircle className="h-4 w-4" />;
      case "executing":
        return <Play className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "created":
        return "bg-gray-100 text-gray-700";
      case "under_review":
        return "bg-yellow-100 text-yellow-700";
      case "approved":
        return "bg-green-100 text-green-700";
      case "rejected":
        return "bg-red-100 text-red-700";
      case "executing":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "created":
        return "Criada";
      case "under_review":
        return "Em Análise";
      case "approved":
        return "Aprovada";
      case "rejected":
        return "Rejeitada";
      case "executing":
        return "Executando";
      default:
        return "Criada";
    }
  };

  const updateStrategyStatus = (id: number, newStatus: string, rejectionReason?: string) => {
    updateStatusMutation.mutate({ id, status: newStatus, rejectionReason });
  };

  const formatStrategyContent = (content: string) => {
    try {
      const parsed = JSON.parse(content);

      // Se for um objeto de ideias de conteúdo
      if (parsed.ideas && Array.isArray(parsed.ideas)) {
        return parsed.ideas.map((idea: any, index: number) => 
          `**${index + 1}. ${idea.title}**\n\n${idea.description}\n\n` +
          `**Tipo:** ${idea.content_type}\n` +
          `**Público-alvo:** ${idea.target_audience}\n` +
          `**Call to Action:** ${idea.call_to_action}\n\n---\n\n`
        ).join('');
      }

      // Se for uma estratégia geral
      if (typeof parsed === 'object') {
        return Object.entries(parsed)
          .map(([key, value]) => {
            if (key === 'title') return `# ${value}`;
            if (key === 'executive_summary') return `## Resumo Executivo\n\n${value}`;
            if (key === 'objectives') return `## Objetivos\n\n${Array.isArray(value) ? value.join('\n• ') : value}`;
            if (key === 'tactics') return `## Táticas\n\n${Array.isArray(value) ? value.join('\n• ') : value}`;
            if (key === 'metrics') return `## Métricas\n\n${Array.isArray(value) ? value.join('\n• ') : value}`;
            if (key === 'timeline') return `## Cronograma\n\n${value}`;
            return `**${key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}:** ${value}`;
          })
          .join('\n\n');
      }

      return content;
    } catch {
      return content;
    }
  };

  const groupStrategiesByStatus = (strategies: AiStrategy[]) => {
    const statusGroups = {
      created: strategies.filter(s => s.status === 'created' || !s.status),
      under_review: strategies.filter(s => s.status === 'under_review'),
      approved: strategies.filter(s => s.status === 'approved'),
      rejected: strategies.filter(s => s.status === 'rejected'),
      executing: strategies.filter(s => s.status === 'executing'),
    };
    return statusGroups;
  };

  if (isLoading || isLoadingStrategies) {
    return <AiStrategiesSkeleton />;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <main className="content-area">
        <div className="content-wrapper">
          <header className="mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Estratégias com IA</h1>
                <p className="text-sm lg:text-base text-slate-600">Gere estratégias personalizadas usando inteligência artificial</p>
              </div>
              <div className="flex flex-col sm:flex-row gap-2 lg:gap-3">
              <Dialog open={isContentModalOpen} onOpenChange={setIsContentModalOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" className="border-secondary text-secondary hover:bg-secondary/10">
                    <Lightbulb className="mr-2 h-4 w-4" />
                    Ideias de Conteúdo
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md mx-4">
                  <DialogHeader>
                    <DialogTitle>Gerar Ideias de Conteúdo</DialogTitle>
                  </DialogHeader>
                  <Form {...contentForm}>
                    <form onSubmit={contentForm.handleSubmit(onGenerateContent)} className="space-y-4">
                      <FormField
                        control={contentForm.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                        control={contentForm.control}
                        name="contentType"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tipo de Conteúdo</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Tipo de conteúdo" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="blog post">Blog Post</SelectItem>
                                <SelectItem value="social media">Redes Sociais</SelectItem>
                                <SelectItem value="video">Vídeo</SelectItem>
                                <SelectItem value="infographic">Infográfico</SelectItem>
                                <SelectItem value="email">Email Marketing</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsContentModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={generateContentMutation.isPending}>
                          {generateContentMutation.isPending ? "Gerando..." : "Gerar Ideias"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>

              <Dialog open={isGenerateModalOpen} onOpenChange={setIsGenerateModalOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-secondary hover:bg-secondary/90">
                    <Brain className="mr-2 h-4 w-4" />
                    Gerar Estratégia
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto mx-4 w-[95vw] sm:w-full">
                  <DialogHeader>
                    <DialogTitle>Gerar Estratégia de Marketing</DialogTitle>
                  </DialogHeader>
                  <Form {...strategyForm}>
                    <form onSubmit={strategyForm.handleSubmit(onGenerateStrategy)} className="space-y-4">
                      <FormField
                        control={strategyForm.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Cliente *</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione o cliente" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
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
                        control={strategyForm.control}
                        name="goals"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Objetivos (separados por vírgula)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Aumentar vendas, melhorar brand awareness..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={strategyForm.control}
                        name="challenges"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Desafios Atuais (separados por vírgula)</FormLabel>
                            <FormControl>
                              <Textarea placeholder="Baixo engajamento, concorrência alta..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={strategyForm.control}
                          name="budget"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Orçamento (R$)</FormLabel>
                              <FormControl>
                                <Input type="number" placeholder="0.00" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={strategyForm.control}
                          name="targetAudience"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Público-alvo</FormLabel>
                              <FormControl>
                                <Input placeholder="ex: Jovens 18-25 anos" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      {/* Data Fields */}
                      <div className="space-y-4">
                        <h4 className="font-medium text-sm">Datas de Planejamento</h4>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                          <FormField
                            control={strategyForm.control}
                            name="creationDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Data de Criação</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={strategyForm.control}
                            name="executionStartDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Início da Execução</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={strategyForm.control}
                            name="executionEndDate"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Fim da Execução</FormLabel>
                                <FormControl>
                                  <Input type="date" {...field} className="w-full" />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button type="button" variant="outline" onClick={() => setIsGenerateModalOpen(false)}>
                          Cancelar
                        </Button>
                        <Button type="submit" disabled={generateStrategyMutation.isPending}>
                          {generateStrategyMutation.isPending ? "Gerando..." : "Gerar Estratégia"}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Filters */}
        <div className="flex flex-col lg:flex-row gap-3 lg:gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar estratégias..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 h-10"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <Select value={clientFilter} onValueChange={setClientFilter}>
              <SelectTrigger className="w-full sm:w-48 lg:w-52 h-10">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por cliente" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os clientes</SelectItem>
                {clients?.map((client) => (
                  <SelectItem key={client.id} value={client.id.toString()}>
                    {client.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={periodFilter} onValueChange={setPeriodFilter}>
              <SelectTrigger className="w-full sm:w-40 lg:w-44 h-10">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por período" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os períodos</SelectItem>
                <SelectItem value="today">Hoje</SelectItem>
                <SelectItem value="week">Última semana</SelectItem>
                <SelectItem value="month">Este mês</SelectItem>
                <SelectItem value="quarter">Este trimestre</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 lg:mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total de Estratégias</p>
                  <p className="text-2xl font-bold text-slate-900">{strategies?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Brain className="text-secondary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Estratégias de Marketing</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {strategies?.filter(s => s.type === 'marketing_strategy').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center">
                  <Target className="text-purple-500 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Estratégias de Conteúdo</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {strategies?.filter(s => s.type === 'content_strategy').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-500/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-blue-500 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Este Mês</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {strategies?.filter(s => {
                      const createdAt = new Date(s.createdAt!);
                      const now = new Date();
                      return createdAt.getMonth() === now.getMonth() && 
                             createdAt.getFullYear() === now.getFullYear();
                    }).length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Zap className="text-accent h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Kanban Board */}
        <div className="overflow-x-auto">
          <div className="flex gap-4 lg:gap-6 pb-4 min-w-max">
            {Object.entries({
              created: { label: 'Criadas', color: 'gray', icon: Clock },
              under_review: { label: 'Em Análise', color: 'yellow', icon: ArrowRight },
              approved: { label: 'Aprovadas', color: 'green', icon: CheckCircle },
              rejected: { label: 'Rejeitadas', color: 'red', icon: XCircle },
              executing: { label: 'Executada', color: 'blue', icon: Play },
            }).map(([status, config], index, array) => {
              const statusStrategies = filteredStrategies.filter(s => 
                (s.status === status) || (!s.status && status === 'created')
              );

              return (
                <div key={status} className="flex items-start">
                  <div className="bg-white rounded-lg border w-72 sm:w-80 lg:w-72 xl:w-80 2xl:w-96 flex-shrink-0">
                    <div className={`p-3 lg:p-4 border-b bg-${config.color}-50`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <config.icon className={`h-4 w-4 text-${config.color}-600`} />
                          <h3 className={`font-medium text-sm lg:text-base text-${config.color}-800`}>{config.label}</h3>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {statusStrategies.length}
                        </Badge>
                      </div>
                    </div>

                    <div className="p-3 lg:p-4 space-y-3 min-h-[400px] max-h-[600px] overflow-y-auto">
                      {statusStrategies.map((strategy) => {
                        const content = parseStrategyContent(strategy.content);
                        const currentStatus = strategy.status || 'created';
                        const nextStatus = getNextStatus(currentStatus);
                        const prevStatus = getPreviousStatus(currentStatus);

                        return (
                          <Card key={strategy.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 relative group"
                                style={{ borderLeftColor: config.color === 'gray' ? '#6b7280' : 
                                                         config.color === 'yellow' ? '#f59e0b' :
                                                         config.color === 'green' ? '#10b981' :
                                                         config.color === 'red' ? '#ef4444' : '#3b82f6' }}
                                onClick={() => setSelectedStrategy(strategy)}>
                            <CardContent className="p-3 lg:p-4">
                              <div className="space-y-3">
                                <div className="flex items-start space-x-2">
                                  <div className="w-6 h-6 bg-secondary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                                    {getTypeIcon(strategy.type)}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className="font-medium text-sm leading-tight line-clamp-2">{strategy.title}</h4>
                                    <p className="text-xs text-slate-500 mt-1">{getClientName(strategy.clientId)}</p>
                                  </div>
                                </div>

                                <p className="text-slate-600 text-xs line-clamp-2">
                                  {content.executive_summary || content.title || "Estratégia gerada por IA"}
                                </p>

                                <div className="flex items-center justify-between">
                                  <Badge className={`${getTypeColor(strategy.type)} text-xs`} variant="secondary">
                                    {strategy.type === 'content_strategy' ? 'Conteúdo' :
                                     strategy.type === 'growth_strategy' ? 'Crescimento' : 'Marketing'}
                                  </Badge>
                                  <span className="text-xs text-slate-400">
                                    {new Date(strategy.generatedAt!).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
                                  </span>
                                </div>

                                {/* Navigation Arrows and Action Buttons */}
                                <div className="opacity-0 group-hover:opacity-100 transition-opacity pt-2">
                                  {currentStatus === 'under_review' ? (
                                    // Botões de Aprovação/Rejeição para estratégias em análise
                                    <div className="flex gap-2">
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs bg-green-50 border-green-200 text-green-700 hover:bg-green-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateStrategyStatus(strategy.id!, 'approved');
                                        }}
                                        disabled={updateStatusMutation.isPending}
                                      >
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Aprovada
                                      </Button>
                                      <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-6 px-2 text-xs bg-red-50 border-red-200 text-red-700 hover:bg-red-100"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          updateStrategyStatus(strategy.id!, 'rejected');
                                        }}
                                        disabled={updateStatusMutation.isPending}
                                      >
                                        <XCircle className="h-3 w-3 mr-1" />
                                        Rejeitada
                                      </Button>
                                    </div>
                                  ) : (
                                    // Setas de navegação para outros status
                                    <div className="flex items-center justify-between">
                                      {prevStatus && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateStrategyStatus(strategy.id!, prevStatus);
                                          }}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <ChevronRight className="h-3 w-3 rotate-180" />
                                        </Button>
                                      )}

                                      <div className="flex-1" />

                                      {nextStatus && (
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          className="h-6 w-6 p-0"
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            updateStrategyStatus(strategy.id!, nextStatus);
                                          }}
                                          disabled={updateStatusMutation.isPending}
                                        >
                                          <ChevronRight className="h-3 w-3" />
                                        </Button>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        );
                      })}

                      {statusStrategies.length === 0 && (
                        <div className="text-center py-8 text-slate-400">
                          <config.icon className="h-8 w-8 mx-auto mb-2 opacity-50" />
                          <p className="text-sm">Nenhuma estratégia</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Arrow between columns */}
                  {index < array.length - 1 && status !== 'rejected' && (
                    <div className="hidden lg:flex items-center justify-center px-2 xl:px-4 mt-32">
                      <ChevronRight className="h-5 w-5 xl:h-6 xl:w-6 text-slate-300" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {filteredStrategies.length === 0 && (
          <div className="text-center py-12">
            <Brain className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? "Nenhuma estratégia encontrada" : "Nenhuma estratégia gerada"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery 
                ? "Tente ajustar os termos da busca" 
                : "Comece gerando sua primeira estratégia com IA"
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsGenerateModalOpen(true)}
                className="bg-secondary hover:bg-secondary/90"
              >
                <Brain className="mr-2 h-4 w-4" />
                Gerar Estratégia
              </Button>
            )}
          </div>
        )}

        {/* Strategy Detail Modal */}
        {selectedStrategy && (
          <Dialog open={!!selectedStrategy} onOpenChange={() => setSelectedStrategy(null)}>
            <DialogContent className="sm:max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  {getTypeIcon(selectedStrategy.type)}
                  <span>{selectedStrategy.title}</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <Badge className={getTypeColor(selectedStrategy.type)}>
                    {selectedStrategy.type === 'content_strategy' ? 'Conteúdo' :
                     selectedStrategy.type === 'growth_strategy' ? 'Crescimento' : 'Marketing'}
                  </Badge>
                  <span className="text-sm text-slate-500">
                    Cliente: {getClientName(selectedStrategy.clientId)}
                  </span>
                  <span className="text-sm text-slate-500">
                    Gerado em: {new Date(selectedStrategy.generatedAt!).toLocaleDateString('pt-BR')}
                  </span>
                </div>

                <div className="bg-slate-50 rounded-lg p-6">
                  <div className="prose prose-sm max-w-none">
                    <div className="whitespace-pre-wrap text-sm text-slate-700 font-sans">
                      {formatStrategyContent(selectedStrategy.content)}
                    </div>
                  </div>
                </div>

                {/* Status Management Section */}
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">Status:</span>
                      <Badge className={getStatusColor(selectedStrategy.status || 'created')}>
                        <div className="flex items-center space-x-1">
                          {getStatusIcon(selectedStrategy.status || 'created')}
                          <span>{getStatusLabel(selectedStrategy.status || 'created')}</span>
                        </div>
                      </Badge>
                    </div>
                  </div>

                  {/* Status Action Buttons */}
                  <div className="flex flex-wrap gap-2">
                    {(!selectedStrategy.status || selectedStrategy.status === 'created') && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => updateStrategyStatus(selectedStrategy.id!, 'under_review')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <ArrowRight className="h-4 w-4 mr-1" />
                        Mover para Análise
                      </Button>
                    )}

                    {selectedStrategy.status === 'under_review' && (
                      <>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-green-50 text-green-700 hover:bg-green-100"
                          onClick={() => updateStrategyStatus(selectedStrategy.id!, 'approved')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Aprovar
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="bg-red-50 text-red-700 hover:bg-red-100"
                          onClick={() => updateStrategyStatus(selectedStrategy.id!, 'rejected')}
                          disabled={updateStatusMutation.isPending}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Rejeitar
                        </Button>
                      </>
                    )}

                    {selectedStrategy.status === 'approved' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="bg-blue-50 text-blue-700 hover:bg-blue-100"
                        onClick={() => updateStrategyStatus(selectedStrategy.id!, 'executing')}
                        disabled={updateStatusMutation.isPending}
                      >
                        <Play className="h-4 w-4 mr-1" />
                        Iniciar Execução
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
        </div>
      </main>
    </div>
  );
}