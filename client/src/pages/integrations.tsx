
import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, RefreshCw, Settings, TrendingUp, Facebook, Chrome, Instagram } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import type { Client } from "@shared/schema";

interface Integration {
  id: number;
  clientId: number;
  platform: string;
  accountId: string;
  isActive: boolean;
  lastSync: string;
  syncFrequency: string;
  client?: Client;
}

export default function Integrations() {
  const [selectedClient, setSelectedClient] = useState<string>("");
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedPlatform, setSelectedPlatform] = useState("");
  const queryClient = useQueryClient();

  const { data: integrations = [], isLoading } = useQuery<Integration[]>({
    queryKey: ["/api/integrations"],
  });

  const { data: clients = [] } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const syncMutation = useMutation({
    mutationFn: async (integrationId: number) => {
      const response = await fetch(`/api/integrations/${integrationId}/sync`, {
        method: 'POST',
        credentials: 'include',
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao sincronizar');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Sincronização concluída com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro na sincronização", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const addIntegrationMutation = useMutation({
    mutationFn: async (data: any) => {
      let endpoint = "/api/integrations";
      
      switch (selectedPlatform) {
        case 'facebook':
          endpoint = "/api/integrations/facebook";
          break;
        case 'google':
          endpoint = "/api/integrations/google-ads";
          break;
        case 'google_analytics':
          endpoint = "/api/integrations/google-analytics";
          break;
        case 'instagram':
          endpoint = "/api/integrations/instagram";
          break;
        case 'facebook_page':
          endpoint = "/api/integrations/facebook-page";
          break;
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Falha ao adicionar integração');
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Integração adicionada com sucesso" });
      queryClient.invalidateQueries({ queryKey: ["/api/integrations"] });
      setIsAddModalOpen(false);
      setSelectedPlatform("");
      setSelectedClient("");
    },
    onError: (error: Error) => {
      toast({ 
        title: "Erro ao adicionar integração", 
        description: error.message,
        variant: "destructive" 
      });
    },
  });

  const handleAddIntegration = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const data = {
      clientId: parseInt(selectedClient),
      accessToken: formData.get('accessToken'),
      accountId: formData.get('accountId'),
      refreshToken: formData.get('refreshToken'),
      propertyId: formData.get('propertyId'),
    };

    addIntegrationMutation.mutate(data);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return <Facebook className="h-5 w-5 text-blue-600" />;
      case 'google':
      case 'google_analytics':
        return <Chrome className="h-5 w-5 text-red-500" />;
      case 'instagram':
        return <Instagram className="h-5 w-5 text-pink-500" />;
      case 'facebook_page':
        return <Facebook className="h-5 w-5 text-blue-500" />;
      default:
        return <Settings className="h-5 w-5" />;
    }
  };

  const getPlatformName = (platform: string) => {
    switch (platform) {
      case 'facebook':
        return 'Facebook Ads';
      case 'google':
        return 'Google Ads';
      case 'google_analytics':
        return 'Google Analytics';
      case 'instagram':
        return 'Instagram Business';
      case 'facebook_page':
        return 'Facebook Page';
      default:
        return platform;
    }
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Integrações de Marketing</h1>
          <p className="text-slate-600 mt-2">
            Conecte suas plataformas de marketing para obter insights em tempo real
          </p>
        </div>
        
        <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Integração
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Adicionar Nova Integração</DialogTitle>
            </DialogHeader>
            
            <form onSubmit={handleAddIntegration} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="client">Cliente</Label>
                <Select value={selectedClient} onValueChange={setSelectedClient} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um cliente" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map((client) => (
                      <SelectItem key={client.id} value={client.id.toString()}>
                        {client.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="platform">Plataforma</Label>
                <Select value={selectedPlatform} onValueChange={setSelectedPlatform} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma plataforma" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="facebook">Facebook Ads</SelectItem>
                    <SelectItem value="google">Google Ads</SelectItem>
                    <SelectItem value="google_analytics">Google Analytics</SelectItem>
                    <SelectItem value="instagram">Instagram Business</SelectItem>
                    <SelectItem value="facebook_page">Facebook Page</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedPlatform && (
                <Tabs defaultValue="credentials" className="w-full">
                  <TabsList className="grid w-full grid-cols-1">
                    <TabsTrigger value="credentials">Credenciais</TabsTrigger>
                  </TabsList>
                  
                  <TabsContent value="credentials" className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="accessToken">Access Token</Label>
                      <Input name="accessToken" type="password" required />
                    </div>

                    {selectedPlatform === 'facebook' && (
                      <div className="space-y-2">
                        <Label htmlFor="accountId">Account ID</Label>
                        <Input name="accountId" placeholder="act_123456789" required />
                      </div>
                    )}

                    {selectedPlatform === 'google' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="refreshToken">Refresh Token</Label>
                          <Input name="refreshToken" type="password" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="accountId">Customer ID</Label>
                          <Input name="accountId" placeholder="123-456-7890" required />
                        </div>
                      </>
                    )}

                    {selectedPlatform === 'google_analytics' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="refreshToken">Refresh Token</Label>
                          <Input name="refreshToken" type="password" required />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="propertyId">Property ID</Label>
                          <Input name="propertyId" placeholder="123456789" required />
                        </div>
                      </>
                    )}

                    {selectedPlatform === 'instagram' && (
                      <div className="space-y-2">
                        <Label htmlFor="accountId">Instagram Business Account ID</Label>
                        <Input name="accountId" placeholder="17841400008460056" required />
                        <p className="text-xs text-slate-500">
                          Encontre seu ID em: Configurações → Profissional → Instagram API
                        </p>
                      </div>
                    )}

                    {selectedPlatform === 'facebook_page' && (
                      <div className="space-y-2">
                        <Label htmlFor="pageId">Facebook Page ID</Label>
                        <Input name="pageId" placeholder="123456789012345" required />
                        <p className="text-xs text-slate-500">
                          Encontre o ID da página em: Sobre → ID da Página
                        </p>
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              )}

              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={addIntegrationMutation.isPending}
                >
                  {addIntegrationMutation.isPending ? "Conectando..." : "Conectar"}
                </Button>
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setIsAddModalOpen(false)}
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {integrations.map((integration) => (
          <Card key={integration.id} className="relative">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getPlatformIcon(integration.platform)}
                  <CardTitle className="text-lg">
                    {getPlatformName(integration.platform)}
                  </CardTitle>
                </div>
                <Badge className={integration.isActive ? 'status-active' : 'bg-slate-100 text-slate-600'}>
                  {integration.isActive ? 'Ativo' : 'Inativo'}
                </Badge>
              </div>
              <CardDescription>
                Cliente: {integration.client?.name || 'N/A'}
              </CardDescription>
            </CardHeader>
            
            <CardContent className="space-y-4">
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-600">Account ID:</span>
                  <span className="font-mono text-xs">
                    {integration.accountId?.substring(0, 10)}...
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Última Sync:</span>
                  <span className="text-xs">
                    {integration.lastSync ? 
                      new Date(integration.lastSync).toLocaleDateString('pt-BR') : 
                      'Nunca'
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Frequência:</span>
                  <span className="text-xs capitalize">{integration.syncFrequency}</span>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button
                  size="sm"
                  variant="outline"
                  className="flex-1"
                  onClick={() => syncMutation.mutate(integration.id)}
                  disabled={syncMutation.isPending}
                >
                  <RefreshCw className="mr-1 h-3 w-3" />
                  {syncMutation.isPending ? "Sync..." : "Sincronizar"}
                </Button>
                <Button size="sm" variant="outline">
                  <TrendingUp className="mr-1 h-3 w-3" />
                  Ver Dados
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {integrations.length === 0 && (
        <Card className="p-8 text-center">
          <div className="space-y-4">
            <Settings className="h-12 w-12 text-slate-400 mx-auto" />
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Nenhuma integração configurada
              </h3>
              <p className="text-slate-600">
                Comece adicionando uma integração para obter insights dos seus clientes
              </p>
            </div>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Adicionar Primeira Integração
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
}
