import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, UserPlus, Crown, Shield, Eye, Wrench, Code } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";

interface TeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  department?: string;
  isActive: boolean;
  startDate?: string;
  profileImage?: string;
}

interface Role {
  name: string;
  permissions: Array<{ resource: string; actions: string[] }>;
  description: string;
}

const roleIcons = {
  admin: Crown,
  manager: Shield,
  analyst: Eye,
  designer: Wrench,
  developer: Code,
};

const roleColors = {
  admin: "bg-red-500",
  manager: "bg-blue-500",
  analyst: "bg-green-500",
  designer: "bg-purple-500",
  developer: "bg-orange-500",
};

export default function Team() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);

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

  const { data: teamMembers = [], isLoading: isLoadingTeam } = useQuery<TeamMember[]>({
    queryKey: ["/api/team"],
  });

  const { data: roles = [] } = useQuery<Role[]>({
    queryKey: ["/api/team/roles"],
  });

  const createMemberMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao criar membro da equipe");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Membro da equipe criado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
      setIsCreateDialogOpen(false);
    },
    onError: () => {
      toast({ title: "Erro ao criar membro da equipe", variant: "destructive" });
    },
  });

  const updateMemberMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: any }) => {
      const response = await fetch(`/api/team/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Erro ao atualizar membro");
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Membro atualizado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/team"] });
    },
  });

  const handleCreateMember = (formData: FormData) => {
    const data = {
      name: formData.get("name"),
      email: formData.get("email"),
      role: formData.get("role"),
      department: formData.get("department"),
      userId: formData.get("email"), // Use email as userId for now
    };
    createMemberMutation.mutate(data);
  };

  const handleUpdateRole = (memberId: number, role: string) => {
    updateMemberMutation.mutate({ id: memberId, data: { role } });
  };

  const getRoleIcon = (role: string) => {
    const IconComponent = roleIcons[role as keyof typeof roleIcons] || Users;
    return <IconComponent className="h-4 w-4" />;
  };

  const getRoleColor = (role: string) => {
    return roleColors[role as keyof typeof roleColors] || "bg-gray-500";
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-48 bg-gray-200 rounded-lg"></div>
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
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Gestão de Equipe</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gerencie membros da equipe, funções e permissões
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <UserPlus className="h-4 w-4 mr-2" />
              Adicionar Membro
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Adicionar Membro da Equipe</DialogTitle>
              <DialogDescription>
                Adicione um novo membro à sua equipe com as permissões apropriadas.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              handleCreateMember(formData);
            }} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nome</Label>
                <Input id="name" name="name" placeholder="Nome completo" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input id="email" name="email" type="email" placeholder="email@exemplo.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">Função</Label>
                <Select name="role" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma função" />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role: Role) => (
                      <SelectItem key={role.name} value={role.name}>
                        <div className="flex items-center">
                          {getRoleIcon(role.name)}
                          <span className="ml-2">{role.description}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="department">Departamento</Label>
                <Input id="department" name="department" placeholder="Marketing, Design, Desenvolvimento..." />
              </div>
              <div className="flex justify-end space-x-2">
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  Cancelar
                </Button>
                <Button type="submit" disabled={createMemberMutation.isPending}>
                  {createMemberMutation.isPending ? "Criando..." : "Criar Membro"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Tabs defaultValue="members" className="space-y-6">
        <TabsList>
          <TabsTrigger value="members">Membros</TabsTrigger>
          <TabsTrigger value="roles">Funções e Permissões</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
        </TabsList>

        <TabsContent value="members">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teamMembers.map((member) => (
              <Card key={member.id} className="hover:shadow-lg transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-3">
                    <Avatar>
                      <AvatarImage src={member.profileImage} />
                      <AvatarFallback>
                        {member.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{member.name}</CardTitle>
                      <CardDescription>{member.email}</CardDescription>
                    </div>
                    <div className={`w-3 h-3 rounded-full ${member.isActive ? 'bg-green-500' : 'bg-gray-400'}`} />
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className={`${getRoleColor(member.role)} text-white`}>
                      <div className="flex items-center">
                        {getRoleIcon(member.role)}
                        <span className="ml-1 capitalize">{member.role}</span>
                      </div>
                    </Badge>
                    <Select
                      value={member.role}
                      onValueChange={(role) => handleUpdateRole(member.id, role)}
                    >
                      <SelectTrigger className="w-auto">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((role: Role) => (
                          <SelectItem key={role.name} value={role.name}>
                            {role.description}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  {member.department && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Departamento: {member.department}
                    </div>
                  )}
                  {member.startDate && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Desde: {new Date(member.startDate).toLocaleDateString('pt-BR')}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="roles">
          <div className="space-y-6">
            {roles.map((role: Role) => (
              <Card key={role.name}>
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${getRoleColor(role.name)}`}>
                      {getRoleIcon(role.name)}
                    </div>
                    <div>
                      <CardTitle className="capitalize">{role.description}</CardTitle>
                      <CardDescription>{role.name}</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <h4 className="font-medium">Permissões:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {role.permissions.map((permission, index) => (
                        <div key={index} className="border rounded-lg p-3">
                          <div className="font-medium capitalize">{permission.resource}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {permission.actions.join(', ')}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="performance">
          <Card>
            <CardHeader>
              <CardTitle>Performance da Equipe</CardTitle>
              <CardDescription>
                Métricas de performance e produtividade dos membros da equipe
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-gray-500">
                Implementação de métricas de performance em desenvolvimento...
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