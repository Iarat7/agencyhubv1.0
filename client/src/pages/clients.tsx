import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { ClientsSkeleton } from "@/components/skeletons/clients-skeleton";
import { PageTransition } from "@/components/loading/page-transition";

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
import { insertClientSchema } from "@shared/schema";
import { Plus, Search, Users, Building, Mail, Phone, Calendar, Eye, Trash2, Filter, Edit } from "lucide-react";
import type { Client } from "@shared/schema";

export default function Clients() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

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

  const { data: clients, isLoading: isLoadingClients } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const deleteClientMutation = useMutation({
    mutationFn: async (clientId: number) => {
      await apiRequest("DELETE", `/api/clients/${clientId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      toast({
        title: "Cliente removido",
        description: "Cliente foi removido com sucesso.",
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
        description: "Falha ao remover cliente.",
        variant: "destructive",
      });
    },
  });

  const createClientMutation = useMutation({
    mutationFn: async (clientData: any) => {
      await apiRequest("POST", "/api/clients", clientData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsCreateModalOpen(false);
      toast({
        title: "Sucesso",
        description: "Cliente criado com sucesso!",
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

  const updateClientMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/clients/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/clients"] });
      setIsEditModalOpen(false);
      setSelectedClient(null);
      toast({
        title: "Cliente atualizado",
        description: "Dados do cliente foram atualizados com sucesso.",
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
        description: "Falha ao atualizar cliente.",
        variant: "destructive",
      });
    },
  });

  const form = useForm({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      industry: "",
      contactPerson: "",
      monthlyValue: "",
      status: "prospect",
      notes: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertClientSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      company: "",
      industry: "",
      contactPerson: "",
      monthlyValue: "",
      status: "prospect",
      notes: "",
    },
  });

  const onSubmit = (data: any) => {
    createClientMutation.mutate({
      ...data,
      monthlyValue: data.monthlyValue ? parseFloat(data.monthlyValue) : undefined,
      startDate: data.status === "active" ? new Date().toISOString().split('T')[0] : undefined,
    });
  };

  const filteredClients = clients?.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      client.industry?.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesStatus = statusFilter === "all" || client.status === statusFilter;
    
    return matchesSearch && matchesStatus;
  }) || [];

  const handleDeleteClient = (clientId: number) => {
    if (confirm('Tem certeza que deseja remover este cliente? Esta ação não pode ser desfeita.')) {
      deleteClientMutation.mutate(clientId);
    }
  };

  const handleViewDetails = (client: Client) => {
    setSelectedClient(client);
    setIsDetailModalOpen(true);
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <PageTransition 
      isLoading={isLoading || isLoadingClients} 
      skeleton={<ClientsSkeleton />}
    >
      <div className="content-area sidebar-expanded">
        <div className="content-wrapper">
        <div className="min-h-screen bg-slate-50">
        <main className="p-4 lg:p-8 max-w-full">
        <header className="mb-6 lg:mb-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Gestão de Clientes</h1>
              <p className="text-sm lg:text-base text-slate-600">Gerencie todos os seus clientes e prospects</p>
            </div>
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Cliente
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Novo Cliente</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Nome *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome do cliente" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
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

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="industry"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Segmento</FormLabel>
                            <FormControl>
                              <Input placeholder="ex: E-commerce" {...field} />
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
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="prospect">Prospect</SelectItem>
                                <SelectItem value="active">Ativo</SelectItem>
                                <SelectItem value="inactive">Inativo</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
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
                        control={form.control}
                        name="projectCost"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Custo do Projeto (R$)</FormLabel>
                            <FormControl>
                              <Input type="number" step="0.01" placeholder="0.00" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="notes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações</FormLabel>
                          <FormControl>
                            <Textarea placeholder="Observações sobre o cliente..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end space-x-2 pt-4">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createClientMutation.isPending}>
                        {createClientMutation.isPending ? "Criando..." : "Criar Cliente"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        {/* Search and Filters */}
        <div className="mb-6 flex flex-col lg:flex-row gap-3 lg:gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
            <Input
              placeholder="Buscar clientes..."
              className="pl-10 h-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-48 h-10">
                <div className="flex items-center">
                  <Filter className="h-4 w-4 mr-2" />
                  <SelectValue placeholder="Filtrar por status" />
                </div>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                <SelectItem value="active">Ativos</SelectItem>
                <SelectItem value="prospect">Prospects</SelectItem>
                <SelectItem value="inactive">Inativos</SelectItem>
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
                  <p className="text-sm font-medium text-slate-600">Total de Clientes</p>
                  <p className="text-2xl font-bold text-slate-900">{clients?.length || 0}</p>
                </div>
                <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
                  <Users className="text-primary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Clientes Ativos</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {clients?.filter(c => c.status === 'active').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center">
                  <Building className="text-accent h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Prospects</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {clients?.filter(c => c.status === 'prospect').length || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-amber-500/10 rounded-lg flex items-center justify-center">
                  <Users className="text-amber-500 h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Faturamento Mensal</p>
                  <p className="text-2xl font-bold text-slate-900">
                    R$ {clients?.filter(c => c.status === 'active' && c.monthlyValue)
                      .reduce((sum, c) => sum + Number(c.monthlyValue), 0)
                      .toLocaleString('pt-BR') || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center">
                  <Calendar className="text-secondary h-6 w-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Clients Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredClients.map((client) => (
            <Card key={client.id} className="hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 client-avatar rounded-lg flex items-center justify-center text-white font-bold">
                      {client.name.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <CardTitle className="text-lg">{client.name}</CardTitle>
                      {client.company && (
                        <p className="text-sm text-slate-500">{client.company}</p>
                      )}
                    </div>
                  </div>
                  <Badge 
                    className={
                      client.status === 'active' ? 'status-active' : 
                      client.status === 'prospect' ? 'status-pending' : 
                      'bg-slate-100 text-slate-600'
                    }
                  >
                    {client.status === 'active' ? 'Ativo' : 
                     client.status === 'prospect' ? 'Prospect' : 'Inativo'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {client.industry && (
                    <p className="text-sm text-slate-600">
                      <strong>Segmento:</strong> {client.industry}
                    </p>
                  )}
                  {client.email && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Mail className="h-4 w-4 mr-2" />
                      {client.email}
                    </div>
                  )}
                  {client.phone && (
                    <div className="flex items-center text-sm text-slate-600">
                      <Phone className="h-4 w-4 mr-2" />
                      {client.phone}
                    </div>
                  )}
                  {client.monthlyValue && (
                    <div className="mt-4 p-3 bg-slate-50 rounded-lg">
                      <p className="text-lg font-bold text-slate-900">
                        R$ {Number(client.monthlyValue).toLocaleString('pt-BR')}/mês
                      </p>
                    </div>
                  )}
                </div>
                
                {/* Action Buttons */}
                <div className="flex justify-end space-x-2 mt-4 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleViewDetails(client)}
                    className="flex items-center gap-2"
                  >
                    <Eye className="h-4 w-4" />
                    Detalhes
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteClient(client.id)}
                    className="flex items-center gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                    disabled={deleteClientMutation.isPending}
                  >
                    <Trash2 className="h-4 w-4" />
                    Remover
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Client Details Modal */}
        <Dialog open={isDetailModalOpen} onOpenChange={setIsDetailModalOpen}>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>Detalhes do Cliente</DialogTitle>
            </DialogHeader>
            {selectedClient && (
              <div className="space-y-4">
                <div className="flex items-center space-x-4">
                  <div className="w-16 h-16 client-avatar rounded-lg flex items-center justify-center text-white font-bold text-xl">
                    {selectedClient.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold">{selectedClient.name}</h3>
                    {selectedClient.company && (
                      <p className="text-slate-600">{selectedClient.company}</p>
                    )}
                    <Badge className={
                      selectedClient.status === 'active' ? 'status-active' : 
                      selectedClient.status === 'prospect' ? 'status-pending' : 
                      'bg-slate-100 text-slate-600'
                    }>
                      {selectedClient.status === 'active' ? 'Ativo' : 
                       selectedClient.status === 'prospect' ? 'Prospect' : 'Inativo'}
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {selectedClient.email && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Mail className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Email</p>
                        <p className="text-slate-900">{selectedClient.email}</p>
                      </div>
                    </div>
                  )}

                  {selectedClient.phone && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Phone className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Telefone</p>
                        <p className="text-slate-900">{selectedClient.phone}</p>
                      </div>
                    </div>
                  )}

                  {selectedClient.industry && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Building className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Segmento</p>
                        <p className="text-slate-900">{selectedClient.industry}</p>
                      </div>
                    </div>
                  )}

                  {selectedClient.contactPerson && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Users className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Pessoa de Contato</p>
                        <p className="text-slate-900">{selectedClient.contactPerson}</p>
                      </div>
                    </div>
                  )}

                  {selectedClient.monthlyValue && (
                    <div className="flex items-center space-x-3 p-3 bg-accent/10 rounded-lg border border-accent/20">
                      <Calendar className="h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Valor Mensal</p>
                        <p className="text-xl font-bold text-accent">
                          R$ {Number(selectedClient.monthlyValue).toLocaleString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedClient.startDate && (
                    <div className="flex items-center space-x-3 p-3 bg-slate-50 rounded-lg">
                      <Calendar className="h-5 w-5 text-slate-500" />
                      <div>
                        <p className="text-sm font-medium text-slate-700">Data de Início</p>
                        <p className="text-slate-900">
                          {new Date(selectedClient.startDate).toLocaleDateString('pt-BR')}
                        </p>
                      </div>
                    </div>
                  )}

                  {selectedClient.notes && (
                    <div className="p-3 bg-slate-50 rounded-lg">
                      <p className="text-sm font-medium text-slate-700 mb-2">Observações</p>
                      <p className="text-slate-900 whitespace-pre-wrap">{selectedClient.notes}</p>
                    </div>
                  )}
                </div>

                <div className="flex justify-end pt-4">
                  <Button onClick={() => setIsDetailModalOpen(false)}>
                    Fechar
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>

        {filteredClients.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-slate-400 mb-4" />
            <h3 className="text-lg font-medium text-slate-900 mb-2">
              {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
            </h3>
            <p className="text-slate-600 mb-4">
              {searchQuery 
                ? "Tente ajustar os termos da busca" 
                : "Comece adicionando seu primeiro cliente"
              }
            </p>
            {!searchQuery && (
              <Button 
                onClick={() => setIsCreateModalOpen(true)}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="mr-2 h-4 w-4" />
                Adicionar Cliente
              </Button>
            )}
          </div>
        )}
        </main>
        </div>
        </div>
      </div>
    </PageTransition>
  );
}
