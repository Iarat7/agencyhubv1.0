import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Rocket, Users, BarChart3, Brain, Target, Zap } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex items-center justify-center mb-6">
            <div className="w-16 h-16 gradient-primary rounded-2xl flex items-center justify-center">
              <Rocket className="text-white text-2xl" />
            </div>
          </div>
          <h1 className="text-5xl font-bold text-slate-900 mb-4">
            AgencyHub
          </h1>
          <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
            Sistema completo de gestão para agências de marketing digital. 
            Gerencie clientes, projetos, financeiro e estratégias com IA em uma única plataforma.
          </p>
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-lg px-8 py-3"
            onClick={() => window.location.href = "/api/login"}
          >
            Entrar no Sistema
          </Button>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
                <Users className="text-primary text-xl" />
              </div>
              <CardTitle>CRM Inteligente</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Organize seus clientes como pastas digitais com histórico completo, 
                métricas de performance e gestão de relacionamento.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-secondary/10 rounded-lg flex items-center justify-center mb-4">
                <Target className="text-secondary text-xl" />
              </div>
              <CardTitle>Pipeline Comercial</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Acompanhe oportunidades desde a prospecção até o fechamento 
                com controle completo do funil de vendas.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-accent/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-accent text-xl" />
              </div>
              <CardTitle>Controle Financeiro</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Gerencie contratos, vencimentos, pagamentos e tenha 
                visibilidade total do faturamento da agência.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-purple-500/10 rounded-lg flex items-center justify-center mb-4">
                <Brain className="text-purple-500 text-xl" />
              </div>
              <CardTitle>Estratégias com IA</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Gere estratégias de marketing personalizadas para seus clientes 
                usando inteligência artificial avançada.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-orange-500/10 rounded-lg flex items-center justify-center mb-4">
                <Zap className="text-orange-500 text-xl" />
              </div>
              <CardTitle>Gestão de Tarefas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Organize e acompanhe todas as tarefas por cliente com 
                prazos, responsáveis e status de execução.
              </p>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="w-12 h-12 bg-emerald-500/10 rounded-lg flex items-center justify-center mb-4">
                <BarChart3 className="text-emerald-500 text-xl" />
              </div>
              <CardTitle>Dashboard Completo</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-slate-600">
                Tenha visão 360° da sua agência com KPIs, gráficos 
                e métricas de performance em tempo real.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* CTA Section */}
        <div className="text-center">
          <Card className="max-w-2xl mx-auto border-0 shadow-xl bg-gradient-to-r from-primary to-secondary text-white">
            <CardHeader>
              <CardTitle className="text-2xl text-white">
                Pronto para revolucionar sua agência?
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-blue-100 mb-6">
                Junte-se às agências que já transformaram sua gestão com o AgencyHub.
              </p>
              <Button 
                size="lg" 
                variant="secondary"
                className="bg-white text-primary hover:bg-slate-100"
                onClick={() => window.location.href = "/api/login"}
              >
                Começar Agora
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
