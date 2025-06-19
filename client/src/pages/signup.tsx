
import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Users, Building, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  features: string[];
  maxUsers: number;
  maxClients: number;
  hasAiStrategies: boolean;
  hasIntegrations: boolean;
  hasAdvancedReports: boolean;
}

export default function Signup() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [selectedPlan, setSelectedPlan] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    firstName: "",
    lastName: "",
    organizationName: "",
    subdomain: "",
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
  });

  const signupMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
        credentials: "include",
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Erro ao criar conta");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Conta criada com sucesso!",
        description: "Bem-vindo ao AgencyHub",
      });
      setLocation("/");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar conta",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    signupMutation.mutate({
      ...formData,
      planId: selectedPlan,
    });
  };

  const getPlanIcon = (planName: string) => {
    switch (planName.toLowerCase()) {
      case 'starter':
        return <Users className="h-6 w-6" />;
      case 'professional':
        return <Building className="h-6 w-6" />;
      case 'enterprise':
        return <Crown className="h-6 w-6" />;
      default:
        return <Zap className="h-6 w-6" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-6xl w-full space-y-8">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Crie sua Agência no AgencyHub
          </h1>
          <p className="text-lg text-gray-600">
            Escolha o plano ideal para sua agência e comece hoje mesmo
          </p>
        </div>

        {/* Plans Selection */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              className={`cursor-pointer transition-all ${
                selectedPlan === plan.id 
                  ? 'ring-2 ring-blue-500 shadow-lg' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => setSelectedPlan(plan.id)}
            >
              <CardHeader className="text-center">
                <div className="flex justify-center mb-2">
                  {getPlanIcon(plan.name)}
                </div>
                <CardTitle className="flex items-center justify-center gap-2">
                  {plan.name}
                  {selectedPlan === plan.id && (
                    <Badge variant="default">Selecionado</Badge>
                  )}
                </CardTitle>
                <CardDescription>{plan.description}</CardDescription>
                <div className="text-3xl font-bold text-blue-600">
                  R$ {plan.price}
                  <span className="text-sm text-gray-500">/mês</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.maxUsers} usuários</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span>{plan.maxClients} clientes</span>
                  </li>
                  {plan.hasAiStrategies && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Estratégias com IA</span>
                    </li>
                  )}
                  {plan.hasIntegrations && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Integrações de Marketing</span>
                    </li>
                  )}
                  {plan.hasAdvancedReports && (
                    <li className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>Relatórios Avançados</span>
                    </li>
                  )}
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Registration Form */}
        {selectedPlan && (
          <Card className="max-w-md mx-auto">
            <CardHeader>
              <CardTitle>Criar Conta</CardTitle>
              <CardDescription>
                Preencha os dados para criar sua agência
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Nome</Label>
                    <Input
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Sobrenome</Label>
                    <Input
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Senha</Label>
                  <Input
                    id="password"
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="organizationName">Nome da Agência</Label>
                  <Input
                    id="organizationName"
                    value={formData.organizationName}
                    onChange={(e) => setFormData(prev => ({ ...prev, organizationName: e.target.value }))}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="subdomain">Subdomínio</Label>
                  <div className="flex">
                    <Input
                      id="subdomain"
                      value={formData.subdomain}
                      onChange={(e) => setFormData(prev => ({ ...prev, subdomain: e.target.value }))}
                      required
                    />
                    <span className="flex items-center px-3 bg-gray-100 text-gray-500 text-sm rounded-r-md">
                      .agencyhub.com
                    </span>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full"
                  disabled={signupMutation.isPending}
                >
                  {signupMutation.isPending ? "Criando..." : "Criar Agência"}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        <div className="text-center">
          <p className="text-gray-600">
            Já tem uma conta?{" "}
            <button 
              onClick={() => setLocation("/login")}
              className="text-blue-600 hover:underline"
            >
              Fazer login
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
