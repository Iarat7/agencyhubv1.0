import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, Search } from "lucide-react";
import ClientDetailModal from "@/components/modals/client-detail-modal";
import type { Client } from "@shared/schema";

export default function ClientFolders() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);

  const { data: clients, isLoading } = useQuery<Client[]>({
    queryKey: ["/api/clients"],
  });

  const filteredClients = clients?.filter(client =>
    client.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (client.company && client.company.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (client.industry && client.industry.toLowerCase().includes(searchQuery.toLowerCase()))
  ).slice(0, 5) || []; // Show only top 5 for dashboard

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

  const getGradientClass = (index: number) => {
    const gradients = [
      "bg-gradient-to-r from-blue-500 to-purple-600",
      "bg-gradient-to-r from-green-500 to-teal-600",
      "bg-gradient-to-r from-pink-500 to-rose-600",
      "bg-gradient-to-r from-yellow-500 to-orange-600",
      "bg-gradient-to-r from-indigo-500 to-blue-600"
    ];
    return gradients[index % gradients.length];
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader className="pb-3">
          <div className="animate-pulse">
            <div className="h-6 bg-slate-200 rounded w-1/2 mb-4"></div>
            <div className="h-10 bg-slate-200 rounded"></div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse border border-slate-200 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-slate-200 rounded-lg"></div>
                  <div className="flex-1">
                    <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                    <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold text-slate-900">
              Clientes - Pastas Digitais
            </CardTitle>
            <Button className="bg-primary hover:bg-primary/90">
              <Plus className="mr-2 h-4 w-4" />
              Novo Cliente
            </Button>
          </div>
          <div className="mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 h-4 w-4" />
              <Input
                type="text"
                placeholder="Buscar clientes..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        
        <CardContent className="pt-0">
          <div className="space-y-4">
            {filteredClients.map((client, index) => (
              <div
                key={client.id}
                className="border border-slate-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => setSelectedClient(client)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <div className={`w-12 h-12 ${getGradientClass(index)} rounded-lg flex items-center justify-center text-white font-bold`}>
                      {getClientInitials(client.name)}
                    </div>
                    <div>
                      <h4 className="font-semibold text-slate-900">{client.name}</h4>
                      <p className="text-sm text-slate-500">
                        {client.industry ? `${client.industry}` : 'Empresa'}
                        {client.company && ` • ${client.company}`}
                      </p>
                      <div className="flex items-center mt-1 text-xs">
                        <Badge className={getStatusColor(client.status || '')}>
                          {client.status === 'active' ? 'Ativo' : 
                           client.status === 'prospect' ? 'Prospect' : 'Inativo'}
                        </Badge>
                        <span className="ml-2 text-slate-500">
                          Desde {client.startDate ? 
                            new Date(client.startDate).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' }) :
                            new Date(client.createdAt!).toLocaleDateString('pt-BR', { month: 'short', year: 'numeric' })
                          }
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    {client.monthlyValue && (
                      <>
                        <p className="text-lg font-bold text-slate-900">
                          R$ {Number(client.monthlyValue).toLocaleString('pt-BR')}/mês
                        </p>
                        <p className="text-sm text-slate-500">
                          {client.status === 'active' ? 'Ativo' : 'Proposta'}
                        </p>
                      </>
                    )}
                    <div className="flex items-center justify-end mt-2 space-x-2">
                      <div className={`w-3 h-3 rounded-full ${
                        client.status === 'active' ? 'bg-accent' : 
                        client.status === 'prospect' ? 'bg-amber-500' : 'bg-slate-300'
                      }`} title={`Status: ${client.status}`}></div>
                      <span className="text-xs text-slate-500">
                        0 tarefas
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {filteredClients.length === 0 && (
            <div className="text-center py-8">
              <p className="text-slate-500">
                {searchQuery ? "Nenhum cliente encontrado" : "Nenhum cliente cadastrado"}
              </p>
            </div>
          )}

          {clients && clients.length > 5 && (
            <Button 
              variant="ghost" 
              className="w-full mt-4 text-primary hover:text-primary/80"
            >
              Ver todos os clientes
            </Button>
          )}
        </CardContent>
      </Card>

      {selectedClient && (
        <ClientDetailModal
          client={selectedClient}
          isOpen={!!selectedClient}
          onClose={() => setSelectedClient(null)}
        />
      )}
    </>
  );
}
