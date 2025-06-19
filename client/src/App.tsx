import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Landing from "@/pages/landing";
import Login from "@/pages/login";
import Dashboard from "@/pages/dashboard";
import Clients from "@/pages/clients";
import Tasks from "@/pages/tasks";
import Pipeline from "@/pages/pipeline";
import Financial from "@/pages/financial";
import AiStrategies from "@/pages/ai-strategies";
import Team from "@/pages/team";
import Reports from "@/pages/reports";
import Contracts from "@/pages/contracts";
import Products from "@/pages/products";
import Calendar from "@/pages/calendar";
import Sidebar from "@/components/layout/sidebar";
import Integrations from "@/pages/integrations";
import Settings from "@/pages/settings";

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <>
          <Route path="/login" component={Login} />
          <Route path="/" component={Landing} />
          <Route component={Login} />
        </>
      ) : (
        <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
          <Sidebar />
          <main className="flex-1 overflow-auto pt-16 lg:pt-0">
            <Switch>
              <Route path="/" component={Dashboard} />
              <Route path="/clients" component={Clients} />
              <Route path="/tasks" component={Tasks} />
              <Route path="/pipeline" component={Pipeline} />
              <Route path="/financial" component={Financial} />
              <Route path="/contracts" component={Contracts} />
              <Route path="/ai-strategies" component={AiStrategies} />
              <Route path="/calendar" component={Calendar} />
              <Route path="/integrations" component={Integrations} />
              <Route path="/settings" component={Settings} />
              <Route path="/team" component={Team} />
              <Route path="/reports" component={Reports} />
              <Route path="/products" component={Products} />
              <Route component={NotFound} />
            </Switch>
          </main>
        </div>
      )}
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;