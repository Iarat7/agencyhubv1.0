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
import { insertContractSchema } from "@shared/schema";
import { 
  Plus, 
  Search, 
  FileText, 
  Calendar, 
  DollarSign, 
  Eye, 
  Trash2, 
  Download,
  AlertTriangle,
  CheckCircle,
  Clock,
  Filter
} from "lucide-react";
import type { Contract, Client } from "@shared/schema";

export default function Contracts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [expiryFilter, setExpiryFilter] = useState("all");
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

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

  const { data: contracts, isLoading: isLoadingContracts } = useQuery<Contract[]>({
    queryKey: ["/api/contracts"],
    enabled: isAuthenticated,
  });

  const { data: clients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const deleteContractMutation = useMutation({
    mutationFn: async (contractId: number) => {
      await apiRequest("DELETE", `/api/contracts/${contractId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      toast({
        title: "Contrato removido",
        description: "Contrato foi removido com sucesso.",
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
        description: "Falha ao remover contrato.",
        variant: "destructive",
      });
    },
  });

  const createContractMutation = useMutation({
    mutationFn: async (contractData: any) => {
      await apiRequest("POST", "/api/contracts", contractData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      setIsCreateModalOpen(false);
      form.reset();
      setSelectedFile(null);
      toast({
        title: "Contrato criado",
        description: "Contrato foi criado com sucesso.",
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
        description: "Falha ao criar contrato.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertContractSchema),
    defaultValues: {
      clientId: "",
      title: "",
      description: "",
      startDate: "",
      endDate: "",
      status: "active",
      value: "",
      documentName: "",
      documentUrl: "",
      renewalType: "",
      notes: "",
    },
  });

  const onSubmit = (data: any) => {
    createContractMutation.mutate({
      ...data,
      clientId: parseInt(data.clientId),
      value: data.value ? parseFloat(data.value) : undefined,
      documentName: selectedFile ? selectedFile.name : "",
      documentUrl: selectedFile ? URL.createObjectURL(selectedFile) : "",
    });
  };

  const filteredContracts = contracts?.filter(contract => {
    const matchesSearch = contract.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      contract.description?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || contract.status === statusFilter;
    
    // Filtro de vencimento
    let matchesExpiry = true;
    if (expiryFilter !== "all" && contract.endDate) {
      const daysUntilExpiry = getDaysUntilExpiry(contract.endDate);
      if (expiryFilter === "expiring_30_days" && daysUntilExpiry !== null) {
        matchesExpiry = daysUntilExpiry <= 30 && daysUntilExpiry > 0;
      } else if (expiryFilter === "expired") {
        matchesExpiry = daysUntilExpiry !== null && daysUntilExpiry <= 0;
      } else if (expiryFilter === "active_long_term") {
        matchesExpiry = daysUntilExpiry === null || daysUntilExpiry > 30;
      }
    }
    
    return matchesSearch && matchesStatus && matchesExpiry;
  }) || [];

  const handleDeleteContract = (contractId: number) => {
    if (confirm('Tem certeza que deseja remover este contrato? Esta ação não pode ser desfeita.')) {
      deleteContractMutation.mutate(contractId);
    }
  };

  const handleViewDetails = (contract: Contract) => {
    setSelectedContract(contract);
    setIsDetailModalOpen(true);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "active":
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case "expired":
        return <AlertTriangle className="h-4 w-4 text-red-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-yellow-500" />;
      default:
        return <FileText className="h-4 w-4 text-slate-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "status-active";
      case "expired":
        return "bg-red-100 text-red-800";
      case "pending":
        return "status-pending";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  const getClientName = (clientId: number) => {
    return clients?.find(c => c.id === clientId)?.name || "Cliente não encontrado";
  };

  const getDaysUntilExpiry = (endDate: string) => {
    if (!endDate) return null;
    const today = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (isLoading || isLoadingContracts) {
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Gestão de Contratos</h1>
              <p className="text-sm lg:text-base text-slate-600">Gerencie contratos e documentos dos seus clientes</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90 w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Contrato
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto mx-4 w-[95vw] sm:w-full">
                <DialogHeader>
                  <DialogTitle>Novo Contrato</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
                    <FormField
                      control={form.control}
                      name="clientId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Cliente *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione um cliente" />
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
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título do Contrato *</FormLabel>
                          <FormControl>
                            <Input placeholder="Contrato de Prestação de Serviços..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Descrição</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Descrição dos serviços..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="startDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Início *</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="endDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data de Término</FormLabel>
                            <FormControl>
                              <Input type="date" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="status"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Status</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="expired">Expirado</SelectItem>
                                <SelectItem value="cancelled">Cancelado</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

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
                    </div>

                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-slate-700 mb-2 block">
                          Anexar Contrato
                        </label>
                        <div className="border-2 border-dashed border-slate-300 rounded-lg p-4 hover:border-primary/50 transition-colors">
                          <Input 
                            type="file" 
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                setSelectedFile(file);
                              }
                            }}
                            className="w-full file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-primary file:text-white hover:file:bg-primary/90 file:cursor-pointer cursor-pointer"
                          />
                          <p className="text-xs text-slate-500 mt-1">
                            Formatos aceitos: PDF, DOC, DOCX
                          </p>
                        </div>
                        {selectedFile && (
                          <div className="flex items-center justify-between gap-2 mt-2 p-2 bg-slate-50 rounded-lg">
                            <div className="flex items-center gap-2 text-sm text-slate-600 flex-1 min-w-0">
                              <FileText className="h-4 w-4 flex-shrink-0" />
                              <span className="truncate">{selectedFile.name}</span>
                            </div>
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                const url = URL.createObjectURL(selectedFile);
                                window.open(url, '_blank');
                              }}
                              className="flex-shrink-0"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    <FormField
                      control={form.control}
                      name="renewalType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Tipo de Renovação</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione o tipo" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="manual">Manual</SelectItem>
                              <SelectItem value="automatic">Automática</SelectItem>
                              <SelectItem value="none">Sem renovação</SelectItem>
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
                            <Textarea placeholder="Observações sobre o contrato..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-2">
                      <Button 
                        type="button" 
                        variant="outline" 
                        size="sm" 
                        onClick={() => {
                          setIsCreateModalOpen(false);
                          setSelectedFile(null);
                          form.reset();
                        }}
                      >
                        Cancelar
                      </Button>
                      <Button type="submit" size="sm" disabled={createContractMutation.isPending}>
                        {createContractMutation.isPending ? "Criando..." : "Criar"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar contratos..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-500" />
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="pending">Pendentes</SelectItem>
                <SelectItem value="expired">Expirados</SelectItem>
                <SelectItem value="cancelled">Cancelados</SelectItem>
              </SelectContent>
            </Select>
            
            <Select value={expiryFilter} onValueChange={setExpiryFilter}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Vencimento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os prazos</SelectItem>
                <SelectItem value="expiring_30_days">Vencem em 30 dias</SelectItem>
                <SelectItem value="expired">Já vencidos</SelectItem>
                <SelectItem value="active_long_term">Vigentes (+ 30 dias)</SelectItem>
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
                  <p className="text-sm font-medium text-slate-600">Total de Contratos</p>
                  <p className="text-2xl font-bold text-slate-900">{contracts?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <FileText className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Contratos Ativos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {contracts?.filter(c => c.status === 'active').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-accent h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setExpiryFilter('expiring_30_days')}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Vencendo em 30 dias</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {contracts?.filter(c => {
                      if (!c.endDate) return false;
                      const days = getDaysUntilExpiry(c.endDate);
                      return days !== null && days <= 30 && days > 0;
                    }).length || 0}
                  </p>
                  <p className="text-xs text-amber-600 mt-1">Clique para filtrar</p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="text-amber-500 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Valor Total</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {contracts?.filter(c => c.status === 'active' && c.value)
                      .reduce((sum, c) => sum + Number(c.value), 0)
                      .toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <DollarSign className="text-secondary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Contracts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {filteredContracts.map((contract) => {
            const daysUntilExpiry = contract.endDate ? getDaysUntilExpiry(contract.endDate) : null;
            const isExpiringSoon = daysUntilExpiry !== null && daysUntilExpiry <= 30 && daysUntilExpiry > 0;
            const isExpired = daysUntilExpiry !== null && daysUntilExpiry <= 0;

            return (
              <Card key={contract.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="text-primary h-6 w-6" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">{contract.title}</CardTitle>
                        <p className="text-sm text-slate-500">{getClientName(contract.clientId)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(contract.status)}
                      <Badge className={getStatusColor(contract.status)}>
                        {contract.status === 'active' ? 'Ativo' : 
                         contract.status === 'pending' ? 'Pendente' : 
                         contract.status === 'expired' ? 'Expirado' : 'Cancelado'}
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {contract.description && (
                      <p className="text-sm text-slate-600 line-clamp-2">{contract.description}</p>
                    )}

                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center text-slate-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        Início: {new Date(contract.startDate).toLocaleDateString('pt-BR')}
                      </div>
                      {contract.endDate && (
                        <div className={`flex items-center ${
                          isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-600'
                        }`}>
                          <Calendar className="h-4 w-4 mr-2" />
                          Fim: {new Date(contract.endDate).toLocaleDateString('pt-BR')}
                        </div>
                      )}
                    </div>

                    {contract.value && (
                      <div className="p-3 bg-accent/10 rounded-lg border border-accent/20">
                        <p className="text-lg font-bold text-accent">
                          R$ {Number(contract.value).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    )}

                    {daysUntilExpiry !== null && (
                      <div className={`text-sm ${
                        isExpired ? 'text-red-600' : isExpiringSoon ? 'text-amber-600' : 'text-slate-600'
                      }`}>
                        {isExpired ? 
                          `Expirado há ${Math.abs(daysUntilExpiry)} dias` :
                          `${daysUntilExpiry} dias para expirar`
                        }
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex justify-between items-center pt-4 border-t">
                      <div className="flex space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleViewDetails(contract)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          Detalhes
                        </Button>
                        {contract.documentUrl && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(contract.documentUrl || '', '_blank')}
                            className="flex items-center gap-2"
                          >
                            <Download className="h-4 w-4" />
                            Documento
                          </Button>
                        )}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteContract(contract.id)}
                        className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                        disabled={deleteContractMutation.isPending}
                      >
                        <Trash2 className="h-4 w-4" />
                        Remover
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Contract Details Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-2xl">
            <DialogHeader>
              <DialogTitle>Detalhes do Contrato</DialogTitle>
            </DialogHeader>
            {selectedContract && (
              <div className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 bg-primary/10 rounded-lg flex items-center justify-center">
                    <FileText className="text-primary h-8 w-8" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedContract.title}</h3>
                    <p className="text-slate-600">{getClientName(selectedContract.clientId)}</p>
                    <div className="flex items-center gap-2 mt-1">
                      {getStatusIcon(selectedContract.status)}
                      <Badge className={getStatusColor(selectedContract.status)}>
                        {selectedContract.status === 'active' ? 'Ativo' : 
                         selectedContract.status === 'pending' ? 'Pendente' : 
                         selectedContract.status === 'expired' ? 'Expirado' : 'Cancelado'}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-2">Data de Início</p>
                    <p className="text-slate-900">
                      {new Date(selectedContract.startDate).toLocaleDateString('pt-BR')}
                    </p>
                  </div>

                  {selectedContract.endDate && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-2">Data de Término</p>
                      <p className="text-slate-900">
                        {new Date(selectedContract.endDate).toLocaleDateString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {selectedContract.value && (
                    <div className="p-4 bg-accent/10 rounded-lg border border-accent/20">
                      <p className="text-sm font-medium text-slate-700 mb-2">Valor do Contrato</p>
                      <p className="text-xl font-bold text-accent">
                        R$ {Number(selectedContract.value).toLocaleString('pt-BR')}
                      </p>
                    </div>
                  )}

                  {selectedContract.renewalType && (
                    <div className="p-4 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-2">Tipo de Renovação</p>
                      <p className="text-slate-900">{selectedContract.renewalType}</p>
                    </div>
                  )}
                </div>

                {selectedContract.description && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-2">Descrição</p>
                    <p className="text-slate-900 whitespace-pre-wrap">{selectedContract.description}</p>
                  </div>
                )}

                {selectedContract.documentName && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-2">Documento</p>
                    <div className="flex items-center justify-between">
                      <p className="text-slate-900">{selectedContract.documentName}</p>
                      {selectedContract.documentUrl && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedContract.documentUrl || '', '_blank')}
                          className="flex items-center gap-2"
                        >
                          <Download className="h-4 w-4" />
                          Baixar
                        </Button>
                      )}
                    </div>
                  </div>
                )}

                {selectedContract.notes && (
                  <div className="p-4 bg-slate-50 rounded-lg">
                    <p className="text-sm font-medium text-slate-700 mb-2">Observações</p>
                    <p className="text-slate-900 whitespace-pre-wrap">{selectedContract.notes}</p>
                  </div>
                )}

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setIsDetailModalOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {filteredContracts.length === 0 && (
          <div className="text-center py-12">
            <FileText className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? "Nenhum contrato encontrado" : "Nenhum contrato cadastrado"}
            </h3>
            <p className="text-slate-500">
              {searchQuery ? "Tente ajustar os filtros de busca." : "Comece criando seu primeiro contrato."}
            </p>
          </div>
        )}
      </ResponsiveLayout>
    </div>
  );
}