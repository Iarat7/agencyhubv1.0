import { useEffect, useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import KpiCards from "@/components/dashboard/kpi-cards";
import ResponsiveCharts from "@/components/dashboard/responsive-charts";
import ClientFolders from "@/components/dashboard/client-folders";
import TasksSidebar from "@/components/dashboard/tasks-sidebar";
import RecentActivities from "@/components/dashboard/recent-activities";
import { DashboardSkeleton } from "@/components/skeletons/dashboard-skeleton";
import { PageTransition } from "@/components/loading/page-transition";
import { Button } from "@/components/ui/button";
import { Brain, Calendar } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState("current_month");
  const [revenuePeriod, setRevenuePeriod] = useState("6months");
  const [pipelinePeriod, setPipelinePeriod] = useState("current_month");
  const [clientPeriod, setClientPeriod] = useState("6months");

  const handlePeriodChange = (type: string, period: string) => {
    switch (type) {
      case "revenue":
        setRevenuePeriod(period);
        break;
      case "pipeline":
        setPipelinePeriod(period);
        break;
      case "client":
        setClientPeriod(period);
        break;
    }
  };

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

  if (!isAuthenticated && !isLoading) {
    return null;
  }

  const currentDate = new Date().toLocaleDateString('pt-BR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <PageTransition 
      isLoading={isLoading} 
      skeleton={<DashboardSkeleton />}
    >
      <div className="min-h-screen bg-slate-50">
        <main className="ml-0 lg:ml-64 p-4 lg:p-8 max-w-full">
          {/* Header */}
          <header className="mb-6 lg:mb-8">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl lg:text-2xl font-bold text-slate-900">Dashboard Geral</h1>
                <p className="text-sm lg:text-base text-slate-600">Visão geral da performance da sua agência</p>
              </div>
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 lg:gap-4">
                <Button className="bg-secondary hover:bg-secondary/90 w-full sm:w-auto">
                  <Brain className="mr-2 h-4 w-4" />
                  Gerar Estratégia IA
                </Button>
                <div className="flex items-center space-x-2 text-xs lg:text-sm text-slate-600">
                  <Calendar className="h-4 w-4" />
                  <span>{currentDate}</span>
                </div>
              </div>
            </div>
          </header>

          {/* KPI Cards */}
          <KpiCards selectedPeriod={selectedPeriod} onPeriodChange={setSelectedPeriod} />

          {/* Charts Section */}
          <ResponsiveCharts 
            revenuePeriod={revenuePeriod}
            pipelinePeriod={pipelinePeriod}
            clientPeriod={clientPeriod}
            onPeriodChange={handlePeriodChange}
          />

          {/* Client Folders and Tasks */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6 mb-6 lg:mb-8">
            <div className="xl:col-span-2">
              <ClientFolders />
            </div>
            <div>
              <TasksSidebar />
            </div>
          </div>

          {/* Recent Activities */}
          <RecentActivities />
        </main>
      </div>
    </PageTransition>
  );
}
