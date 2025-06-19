import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle, Brain, AlertTriangle, User, Calendar, DollarSign } from "lucide-react";
import type { Activity } from "@shared/schema";

export default function RecentActivities() {
  const { data: activities, isLoading } = useQuery<Activity[]>({
    queryKey: ["/api/activities", 10], // Get latest 10 activities
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case "task_completed":
        return <CheckCircle className="text-accent text-sm" />;
      case "strategy_generated":
        return <Brain className="text-secondary text-sm" />;
      case "payment_received":
        return <DollarSign className="text-accent text-sm" />;
      case "client_created":
        return <User className="text-primary text-sm" />;
      case "opportunity_created":
        return <Calendar className="text-blue-500 text-sm" />;
      default:
        return <AlertTriangle className="text-amber-500 text-sm" />;
    }
  };

  const getActivityBgColor = (type: string) => {
    switch (type) {
      case "task_completed":
      case "payment_received":
        return "bg-accent/10";
      case "strategy_generated":
        return "bg-secondary/10";
      case "client_created":
        return "bg-primary/10";
      case "opportunity_created":
        return "bg-blue-500/10";
      default:
        return "bg-amber-500/10";
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "agora mesmo";
    if (diffInMinutes < 60) return `há ${diffInMinutes} minuto${diffInMinutes !== 1 ? 's' : ''}`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `há ${diffInHours} hora${diffInHours !== 1 ? 's' : ''}`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `há ${diffInDays} dia${diffInDays !== 1 ? 's' : ''}`;
    
    return date.toLocaleDateString('pt-BR', { 
      day: 'numeric', 
      month: 'short',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
    });
  };

  if (isLoading) {
    return (
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-slate-900">Atividades Recentes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-start space-x-4 animate-pulse">
                <div className="w-8 h-8 bg-slate-200 rounded-full"></div>
                <div className="flex-1 min-w-0">
                  <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
      <CardHeader>
        <CardTitle className="text-lg font-semibold text-slate-900">Atividades Recentes</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {activities && activities.length > 0 ? (
            activities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-4">
                <div className={`w-8 h-8 ${getActivityBgColor(activity.type)} rounded-full flex items-center justify-center flex-shrink-0`}>
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-slate-900">
                    {activity.description}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">
                    {formatTimeAgo(activity.createdAt!)}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8">
              <p className="text-slate-500">Nenhuma atividade recente</p>
            </div>
          )}
        </div>
        
        {activities && activities.length > 0 && (
          <Button 
            variant="ghost" 
            className="w-full mt-6 text-sm text-slate-600 hover:text-slate-800 font-medium border-t border-slate-200 pt-4"
          >
            Ver todas as atividades
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
