
import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { 
  CreditCard, 
  TrendingUp, 
  Users, 
  Building, 
  Zap, 
  AlertTriangle,
  CheckCircle,
  Crown,
  Calendar,
  DollarSign,
  BarChart3
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

interface BillingAnalytics {
  period: string;
  limits: {
    maxUsers: number;
    maxClients: number;
    maxAiStrategies?: number;
    maxIntegrations?: number;
  };
  usage: {
    users: number;
    clients: number;
    aiStrategies: number;
    integrations: number;
    nextBillingDate: Date;
  };
  utilization: {
    users: number;
    clients: number;
    aiStrategies: number;
    integrations: number;
  };
  billing: {
    currentPlan: string;
    nextBillingDate: Date;
    amount: string;
  };
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price: string;
  features: string[];
  maxUsers: number;
  maxClients: number;
  hasAiStrategies: boolean;
  hasIntegrations: boolean;
  hasAdvancedReports: boolean;
  isActive: boolean;
}

export default function Billing() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState("stripe");

  const { data: currentOrg } = useQuery({
    queryKey: ["/api/organizations/current"],
    enabled: isAuthenticated,
  });

  const { data: analytics, isLoading: isLoadingAnalytics } = useQuery<BillingAnalytics>({
    queryKey: ["/api/billing/analytics", currentOrg?.organization?.id, selectedPeriod],
    enabled: isAuthenticated && !!currentOrg?.organization?.id,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: plans = [] } = useQuery<Plan[]>({
    queryKey: ["/api/plans"],
    enabled: isAuthenticated,
  });

  const upgradeMutation = useMutation({
    mutationFn: async ({ planId }: { planId: number }) => {
      const response = await fetch("/api/billing/upgrade", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: currentOrg?.organization?.id,
          newPlanId: planId
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Plano atualizado",
        description: "Seu plano foi atualizado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/billing/analytics"] });
      queryClient.invalidateQueries({ queryKey: ["/api/organizations/current"] });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao atualizar plano",
        description: error.message || "Não foi possível atualizar o plano",
        variant: "destructive",
      });
    },
  });

  const createSubscriptionMutation = useMutation({
    mutationFn: async ({ planId, paymentMethod }: { planId: number; paymentMethod: string }) => {
      const endpoint = paymentMethod === "stripe" 
        ? "/api/billing/subscription/stripe" 
        : "/api/billing/subscription/pagseguro";
      
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          organizationId: currentOrg?.organization?.id,
          planId
        }),
        credentials: "include",
      });
      if (!response.ok) throw new Error(await response.text());
      return response.json();
    },
    onSuccess: (data) => {
      if (data.clientSecret) {
        // Redirect to Stripe Checkout
        window.location.href = `https://checkout.stripe.com/pay/${data.clientSecret}`;
      } else if (data.redirectURL) {
        // Redirect to PagSeguro
        window.location.href = data.redirectURL;
      }
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar assinatura",
        description: error.message || "Não foi possível criar a assinatura",
        variant: "destructive",
      });
    },
  });

  const getUsageColor = (percentage: number) => {
    if (percentage >= 90) return "bg-red-500";
    if (percentage >= 75) return "bg-yellow-500";
    return "bg-green-500";
  };

  const getUsageStatus = (percentage: number) => {
    if (percentage >= 100) return { label: "Limite atingido", variant: "destructive" as const };
    if (percentage >= 90) return { label: "Crítico", variant: "destructive" as const };
    if (percentage >= 75) return { label: "Atenção", variant: "secondary" as const };
    return { label: "Normal", variant: "outline" as const };
  };

  const formatCurrency = (value: string) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(parseFloat(value));
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  return (
    <div className="content-area sidebar-expanded">
      <div className="content-wrapper">
        <div className="p-6 space-y-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Billing & Analytics</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Gerencie sua assinatura e monitore o uso dos recursos
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedPeriod} onValueChange={setSelectedPeriod}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current_month">Este mês</SelectItem>
                  <SelectItem value="last_month">Mês passado</SelectItem>
                  <SelectItem value="last_3_months">Últimos 3 meses</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Tabs defaultValue="usage" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="usage">Uso & Limites</TabsTrigger>
              <TabsTrigger value="billing">Faturamento</TabsTrigger>
              <TabsTrigger value="plans">Planos</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
            </TabsList>

            <TabsContent value="usage" className="space-y-6">
              {analytics && (
                <>
                  {/* Current Plan Overview */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center space-x-2">
                        <Crown className="h-5 w-5 text-yellow-500" />
                        <span>Plano Atual: {analytics.billing.currentPlan}</span>
                      </CardTitle>
                      <CardDescription>
                        Próxima cobrança: {formatDate(analytics.billing.nextBillingDate)} - {formatCurrency(analytics.billing.amount)}
                      </CardDescription>
                    </CardHeader>
                  </Card>

                  {/* Usage Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* Users Usage */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Usuários</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.usage.users}/{analytics.limits.maxUsers}
                        </div>
                        <Progress 
                          value={analytics.utilization.users} 
                          className="w-full mt-2" 
                        />
                        <div className="flex justify-between items-center mt-2">
                          <Badge {...getUsageStatus(analytics.utilization.users)}>
                            {getUsageStatus(analytics.utilization.users).label}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {Math.round(analytics.utilization.users)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Clients Usage */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Clientes</CardTitle>
                        <Building className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.usage.clients}/{analytics.limits.maxClients}
                        </div>
                        <Progress 
                          value={analytics.utilization.clients} 
                          className="w-full mt-2" 
                        />
                        <div className="flex justify-between items-center mt-2">
                          <Badge {...getUsageStatus(analytics.utilization.clients)}>
                            {getUsageStatus(analytics.utilization.clients).label}
                          </Badge>
                          <span className="text-sm text-gray-500">
                            {Math.round(analytics.utilization.clients)}%
                          </span>
                        </div>
                      </CardContent>
                    </Card>

                    {/* AI Strategies Usage */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Estratégias IA</CardTitle>
                        <Zap className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.usage.aiStrategies}/{analytics.limits.maxAiStrategies || '∞'}
                        </div>
                        {analytics.limits.maxAiStrategies && (
                          <>
                            <Progress 
                              value={analytics.utilization.aiStrategies} 
                              className="w-full mt-2" 
                            />
                            <div className="flex justify-between items-center mt-2">
                              <Badge {...getUsageStatus(analytics.utilization.aiStrategies)}>
                                {getUsageStatus(analytics.utilization.aiStrategies).label}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {Math.round(analytics.utilization.aiStrategies)}%
                              </span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>

                    {/* Integrations Usage */}
                    <Card>
                      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Integrações</CardTitle>
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {analytics.usage.integrations}/{analytics.limits.maxIntegrations || '∞'}
                        </div>
                        {analytics.limits.maxIntegrations && (
                          <>
                            <Progress 
                              value={analytics.utilization.integrations} 
                              className="w-full mt-2" 
                            />
                            <div className="flex justify-between items-center mt-2">
                              <Badge {...getUsageStatus(analytics.utilization.integrations)}>
                                {getUsageStatus(analytics.utilization.integrations).label}
                              </Badge>
                              <span className="text-sm text-gray-500">
                                {Math.round(analytics.utilization.integrations)}%
                              </span>
                            </div>
                          </>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Usage Alerts */}
                  {Object.values(analytics.utilization).some(val => val >= 80) && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertTitle>Atenção aos Limites de Uso</AlertTitle>
                      <AlertDescription>
                        Alguns recursos estão próximos do limite. Considere fazer upgrade do seu plano para evitar interrupções.
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}
            </TabsContent>

            <TabsContent value="billing" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <CreditCard className="h-5 w-5" />
                    <span>Informações de Faturamento</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {analytics && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="text-center p-4 border rounded-lg">
                        <DollarSign className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">{formatCurrency(analytics.billing.amount)}</div>
                        <div className="text-sm text-gray-500">Valor mensal</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <Calendar className="h-8 w-8 mx-auto mb-2 text-blue-500" />
                        <div className="text-2xl font-bold">{formatDate(analytics.billing.nextBillingDate)}</div>
                        <div className="text-sm text-gray-500">Próxima cobrança</div>
                      </div>
                      <div className="text-center p-4 border rounded-lg">
                        <CheckCircle className="h-8 w-8 mx-auto mb-2 text-green-500" />
                        <div className="text-2xl font-bold">Ativo</div>
                        <div className="text-sm text-gray-500">Status da assinatura</div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="plans" className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {plans.map((plan) => (
                  <Card key={plan.id} className={plan.name === analytics?.billing.currentPlan ? 'ring-2 ring-blue-500' : ''}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <span>{plan.name}</span>
                        {plan.name === analytics?.billing.currentPlan && (
                          <Badge>Atual</Badge>
                        )}
                      </CardTitle>
                      <CardDescription>{plan.description}</CardDescription>
                      <div className="text-3xl font-bold">{formatCurrency(plan.price)}/mês</div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <ul className="space-y-2">
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{plan.maxUsers} usuários</span>
                        </li>
                        <li className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-500" />
                          <span>{plan.maxClients} clientes</span>
                        </li>
                        {plan.hasAiStrategies && (
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Estratégias IA</span>
                          </li>
                        )}
                        {plan.hasIntegrations && (
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Integrações avançadas</span>
                          </li>
                        )}
                        {plan.hasAdvancedReports && (
                          <li className="flex items-center space-x-2">
                            <CheckCircle className="h-4 w-4 text-green-500" />
                            <span>Relatórios avançados</span>
                          </li>
                        )}
                      </ul>
                      
                      {plan.name !== analytics?.billing.currentPlan && (
                        <div className="space-y-2">
                          <Select value={selectedPaymentMethod} onValueChange={setSelectedPaymentMethod}>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="stripe">Cartão de Crédito (Stripe)</SelectItem>
                              <SelectItem value="pagseguro">PagSeguro</SelectItem>
                            </SelectContent>
                          </Select>
                          <Button 
                            className="w-full" 
                            onClick={() => createSubscriptionMutation.mutate({ planId: plan.id, paymentMethod: selectedPaymentMethod })}
                            disabled={createSubscriptionMutation.isPending}
                          >
                            {createSubscriptionMutation.isPending ? "Processando..." : "Assinar Agora"}
                          </Button>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="analytics" className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Tendência de Uso</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Gráfico de tendência será implementado aqui</p>
                    </div>
                  </CardContent>
                </Card>
                
                <Card>
                  <CardHeader>
                    <CardTitle>Comparação de Planos</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
                      <p className="text-gray-500">Análise comparativa será implementada aqui</p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
