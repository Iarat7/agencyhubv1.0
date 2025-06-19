import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { apiRequest } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Sidebar from "@/components/layout/sidebar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { Plus, Search, CheckCircle, Clock, AlertTriangle, Calendar, MoreVertical, Eye, Edit, Trash2, Filter, User, Mail, Phone } from "lucide-react";
import type { Task, Client } from "@shared/schema";

export default function Tasks() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [periodFilter, setPeriodFilter] = useState("all");
  const [clientFilter, setClientFilter] = useState("all");
  const [assigneeFilter, setAssigneeFilter] = useState("all");
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);

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

  const { data: tasks = [], isLoading: isLoadingTasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
    enabled: isAuthenticated,
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
    enabled: isAuthenticated,
  });

  const { data: teamMembers = [] } = useQuery({
    queryKey: ["/api/team-members"],
    enabled: isAuthenticated,
  });

  const form = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      clientId: "",
      dueDate: "",
    },
  });

  const editForm = useForm({
    resolver: zodResolver(insertTaskSchema),
    defaultValues: {
      title: "",
      description: "",
      status: "pending",
      priority: "medium",
      clientId: "",
      dueDate: "",
    },
  });

  const createTaskMutation = useMutation({
    mutationFn: async (data: any) => {
      await apiRequest("POST", "/api/tasks", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsCreateModalOpen(false);
      form.reset();
      toast({
        title: "Sucesso",
        description: "Tarefa criada com sucesso!",
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
        description: "Falha ao criar tarefa",
        variant: "destructive",
      });
    },
  });

  const updateTaskMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      await apiRequest("PUT", `/api/tasks/${id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      setIsEditModalOpen(false);
      setSelectedTask(null);
      editForm.reset();
      toast({
        title: "Sucesso",
        description: "Tarefa atualizada com sucesso!",
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
        description: "Falha ao atualizar tarefa",
        variant: "destructive",
      });
    },
  });

  const deleteTaskMutation = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/tasks/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/tasks"] });
      toast({
        title: "Sucesso",
        description: "Tarefa excluída com sucesso!",
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
        description: "Falha ao excluir tarefa",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: any) => {
    createTaskMutation.mutate(data);
  };

  const onEditSubmit = (data: any) => {
    if (selectedTask) {
      updateTaskMutation.mutate({ id: selectedTask.id, data });
    }
  };

  const openViewModal = (task: Task) => {
    setSelectedTask(task);
    setIsViewModalOpen(true);
  };

  const openEditModal = (task: Task) => {
    setSelectedTask(task);
    editForm.reset({
      title: task.title,
      description: task.description || "",
      status: task.status || "pending",
      priority: task.priority || "medium",
      clientId: task.clientId?.toString() || "",
      dueDate: task.dueDate || "",
    });
    setIsEditModalOpen(true);
  };

  const deleteTask = (id: number) => {
    deleteTaskMutation.mutate(id);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "in_progress":
        return <Clock className="h-4 w-4 text-blue-600" />;
      default:
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "high":
        return "bg-red-100 text-red-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "low":
        return "bg-green-100 text-green-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "completed":
        return "bg-green-100 text-green-800";
      case "in_progress":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-yellow-100 text-yellow-800";
    }
  };

  const filterTasksByPeriod = (tasks: Task[]) => {
    if (periodFilter === "all") return tasks;
    
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfWeek = new Date(startOfToday);
    startOfWeek.setDate(startOfToday.getDate() - startOfToday.getDay());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    return tasks.filter(task => {
      if (!task.dueDate) return periodFilter === "no_due_date";
      
      const dueDate = new Date(task.dueDate);
      
      switch (periodFilter) {
        case "today":
          return dueDate >= startOfToday && dueDate < new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);
        case "this_week":
          return dueDate >= startOfWeek && dueDate < new Date(startOfWeek.getTime() + 7 * 24 * 60 * 60 * 1000);
        case "this_month":
          return dueDate >= startOfMonth && dueDate < new Date(now.getFullYear(), now.getMonth() + 1, 1);
        case "overdue":
          return dueDate < startOfToday;
        case "no_due_date":
          return false;
        default:
          return true;
      }
    });
  };

  const filteredTasks = filterTasksByPeriod(tasks).filter((task) => {
    const matchesSearch =
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      task.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || task.status === statusFilter;
    const matchesPriority = priorityFilter === "all" || task.priority === priorityFilter;
    const matchesClient = clientFilter === "all" || task.clientId?.toString() === clientFilter;
    const matchesAssignee = assigneeFilter === "all" || task.assignedTo === assigneeFilter;
    return matchesSearch && matchesStatus && matchesPriority && matchesClient && matchesAssignee;
  });

  const getClientName = (clientId: number | null) => {
    if (!clientId) return "Sem cliente";
    const client = clients.find(c => c.id === clientId);
    return client?.name || "Cliente não encontrado";
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Sem prazo";
    return new Date(dateString).toLocaleDateString("pt-BR");
  };

  const isOverdue = (dueDate: string | null | undefined) => {
    if (!dueDate) return false;
    return new Date(dueDate) < new Date();
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
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight">Tarefas</h1>
              <p className="text-muted-foreground text-sm lg:text-base">
                Gerencie suas tarefas e acompanhe o progresso dos projetos
              </p>
            </div>
            
            <Dialog open={isCreateModalOpen} onOpenChange={setIsCreateModalOpen}>
              <DialogTrigger asChild>
                <Button className="w-full sm:w-auto">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Tarefa
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-lg">
                <DialogHeader>
                  <DialogTitle>Nova Tarefa</DialogTitle>
                  <DialogDescription>
                    Crie uma nova tarefa para organizar seu trabalho
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="title"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Título *</FormLabel>
                          <FormControl>
                            <Input placeholder="Nome da tarefa" {...field} />
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
                            <Textarea placeholder="Detalhes da tarefa..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                                  <SelectValue placeholder="Selecione o status" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="pending">Pendente</SelectItem>
                                <SelectItem value="in_progress">Em Progresso</SelectItem>
                                <SelectItem value="completed">Concluída</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Prioridade</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione a prioridade" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
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
                                <SelectItem value="0">Sem cliente</SelectItem>
                                {clients.map((client) => (
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
                    </div>

                    <div className="flex justify-end space-x-2">
                      <Button type="button" variant="outline" onClick={() => setIsCreateModalOpen(false)}>
                        Cancelar
                      </Button>
                      <Button type="submit" disabled={createTaskMutation.isPending}>
                        {createTaskMutation.isPending ? "Criando..." : "Criar Tarefa"}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          {/* Filters */}
          <Card className="mb-6">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Buscar tarefas..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-8"
                  />
                </div>

                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Status</SelectItem>
                    <SelectItem value="pending">Pendente</SelectItem>
                    <SelectItem value="in_progress">Em Progresso</SelectItem>
                    <SelectItem value="completed">Concluída</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Prioridade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todas as Prioridades</SelectItem>
                    <SelectItem value="high">Alta</SelectItem>
                    <SelectItem value="medium">Média</SelectItem>
                    <SelectItem value="low">Baixa</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={periodFilter} onValueChange={setPeriodFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Período" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Períodos</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="this_week">Esta Semana</SelectItem>
                    <SelectItem value="this_month">Este Mês</SelectItem>
                    <SelectItem value="overdue">Em Atraso</SelectItem>
                    <SelectItem value="no_due_date">Sem Prazo</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={clientFilter} onValueChange={setClientFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Clientes</SelectItem>
                    <SelectItem value="none">Sem Cliente</SelectItem>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={assigneeFilter} onValueChange={setAssigneeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="Responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Todos os Responsáveis</SelectItem>
                    <SelectItem value="unassigned">Não Atribuído</SelectItem>
                    {Array.isArray(teamMembers) && teamMembers.map((member: any) => (
                      <SelectItem key={member.id} value={member.userId || member.id.toString()}>
                        {member.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchQuery("");
                    setStatusFilter("all");
                    setPriorityFilter("all");
                    setPeriodFilter("all");
                    setClientFilter("all");
                    setAssigneeFilter("all");
                  }}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Limpar Filtros
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Task List */}
          {isLoadingTasks ? (
            <div className="flex items-center justify-center h-96">
              <div className="text-lg">Carregando tarefas...</div>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredTasks.length === 0 ? (
                <Card>
                  <CardContent className="p-8 text-center">
                    <AlertTriangle className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">Nenhuma tarefa encontrada</h3>
                    <p className="text-muted-foreground">
                      {tasks.length === 0
                        ? "Crie sua primeira tarefa para começar a organizar seu trabalho."
                        : "Ajuste os filtros para encontrar as tarefas que procura."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                filteredTasks.map((task) => (
                  <Card key={task.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            {getStatusIcon(task.status || "pending")}
                            <h3 className="font-semibold text-lg">{task.title}</h3>
                            <Badge className={getPriorityColor(task.priority || "medium")}>
                              {task.priority === "high" ? "Alta" : task.priority === "medium" ? "Média" : "Baixa"}
                            </Badge>
                            <Badge className={getStatusColor(task.status || "pending")}>
                              {task.status === "completed" ? "Concluída" : 
                               task.status === "in_progress" ? "Em Progresso" : "Pendente"}
                            </Badge>
                          </div>
                          
                          {task.description && (
                            <p className="text-muted-foreground mb-3 line-clamp-2">{task.description}</p>
                          )}
                          
                          <div className="flex items-center gap-6 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              {getClientName(task.clientId)}
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              <span className={isOverdue(task.dueDate) ? "text-red-600 font-medium" : ""}>
                                {formatDate(task.dueDate)}
                                {isOverdue(task.dueDate) && " (Em atraso)"}
                              </span>
                            </div>
                          </div>
                        </div>
                        
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => openViewModal(task)}>
                              <Eye className="mr-2 h-4 w-4" />
                              Ver Detalhes
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEditModal(task)}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              onClick={() => deleteTask(task.id)}
                              className="text-red-600"
                            >
                              <Trash2 className="mr-2 h-4 w-4" />
                              Excluir
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}

          {/* View Modal */}
          <Dialog open={isViewModalOpen} onOpenChange={setIsViewModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Detalhes da Tarefa</DialogTitle>
              </DialogHeader>
              {selectedTask && (
                <div className="space-y-4">
                  <div>
                    <h3 className="font-semibold text-lg">{selectedTask.title}</h3>
                    <div className="flex gap-2 mt-2">
                      <Badge className={getPriorityColor(selectedTask.priority || "medium")}>
                        {selectedTask.priority === "high" ? "Alta" : selectedTask.priority === "medium" ? "Média" : "Baixa"}
                      </Badge>
                      <Badge className={getStatusColor(selectedTask.status || "pending")}>
                        {selectedTask.status === "completed" ? "Concluída" : 
                         selectedTask.status === "in_progress" ? "Em Progresso" : "Pendente"}
                      </Badge>
                    </div>
                  </div>
                  
                  {selectedTask.description && (
                    <div>
                      <span className="text-sm font-medium">Descrição:</span>
                      <p className="text-sm text-muted-foreground mt-1">{selectedTask.description}</p>
                    </div>
                  )}
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <span className="text-sm font-medium">Cliente:</span>
                      <p className="text-sm">{getClientName(selectedTask.clientId)}</p>
                    </div>
                    <div>
                      <span className="text-sm font-medium">Data de Vencimento:</span>
                      <p className={`text-sm ${isOverdue(selectedTask.dueDate) ? "text-red-600 font-medium" : ""}`}>
                        {formatDate(selectedTask.dueDate)}
                        {isOverdue(selectedTask.dueDate) && " (Em atraso)"}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </DialogContent>
          </Dialog>

          {/* Edit Modal */}
          <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Editar Tarefa</DialogTitle>
                <DialogDescription>
                  Atualize as informações da tarefa
                </DialogDescription>
              </DialogHeader>
              <Form {...editForm}>
                <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
                  <FormField
                    control={editForm.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Título *</FormLabel>
                        <FormControl>
                          <Input placeholder="Nome da tarefa" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={editForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Descrição</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Detalhes da tarefa..." {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
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
                              <SelectItem value="pending">Pendente</SelectItem>
                              <SelectItem value="in_progress">Em Progresso</SelectItem>
                              <SelectItem value="completed">Concluída</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={editForm.control}
                      name="priority"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prioridade</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Selecione a prioridade" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="low">Baixa</SelectItem>
                              <SelectItem value="medium">Média</SelectItem>
                              <SelectItem value="high">Alta</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={editForm.control}
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
                              <SelectItem value="none">Sem cliente</SelectItem>
                              {clients.map((client) => (
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
                      control={editForm.control}
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
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button type="button" variant="outline" onClick={() => setIsEditModalOpen(false)}>
                      Cancelar
                    </Button>
                    <Button type="submit" disabled={updateTaskMutation.isPending}>
                      {updateTaskMutation.isPending ? "Atualizando..." : "Atualizar Tarefa"}
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