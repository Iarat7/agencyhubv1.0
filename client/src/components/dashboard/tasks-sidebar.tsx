import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useLocation } from "wouter";
import type { Task, Opportunity } from "@shared/schema";

export default function TasksSidebar() {
  const [, navigate] = useLocation();
  
  const { data: tasks } = useQuery<Task[]>({
    queryKey: ["/api/tasks"],
  });

  const { data: opportunities } = useQuery<Opportunity[]>({
    queryKey: ["/api/opportunities"],
  });

  // Get urgent tasks (overdue or due today)
  const urgentTasks = tasks?.filter(task => {
    if (task.status === 'completed') return false;
    if (!task.dueDate) return false;
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate <= today;
  }).slice(0, 3) || [];

  // Get pipeline summary
  const pipelineSummary = {
    prospecting: opportunities?.filter(o => o.stage === 'prospecting').length || 0,
    qualification: opportunities?.filter(o => o.stage === 'qualification').length || 0,
    proposal: opportunities?.filter(o => o.stage === 'proposal').length || 0,
    negotiation: opportunities?.filter(o => o.stage === 'negotiation').length || 0,
    closing: opportunities?.filter(o => o.stage === 'closed_won').length || 0,
  };

  const getTaskUrgencyColor = (task: Task) => {
    if (!task.dueDate) return "bg-slate-100";
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return "bg-red-50"; // Overdue
    if (dueDate.getTime() === today.getTime()) return "bg-red-50"; // Due today
    return "bg-amber-50"; // Due soon
  };

  const getTaskUrgencyDot = (task: Task) => {
    if (!task.dueDate) return "bg-slate-400";
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return "bg-red-500"; // Overdue
    if (dueDate.getTime() === today.getTime()) return "bg-red-500"; // Due today
    return "bg-amber-500"; // Due soon
  };

  const getTaskDueLabel = (task: Task) => {
    if (!task.dueDate) return "Sem prazo";
    
    const dueDate = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    dueDate.setHours(0, 0, 0, 0);
    
    if (dueDate < today) return "Em atraso";
    if (dueDate.getTime() === today.getTime()) return "Vence hoje";
    return "Vence amanhã";
  };

  return (
    <div className="space-y-6">
      {/* Urgent Tasks */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900">Tarefas Urgentes</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            {urgentTasks.length > 0 ? (
              urgentTasks.map((task) => (
                <div key={task.id} className={`flex items-center space-x-3 p-3 rounded-lg ${getTaskUrgencyColor(task)}`}>
                  <div className={`w-2 h-2 rounded-full ${getTaskUrgencyDot(task)}`}></div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-900 truncate">{task.title}</p>
                    <p className="text-xs text-slate-500">{getTaskDueLabel(task)}</p>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500">Nenhuma tarefa urgente</p>
              </div>
            )}
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium"
            onClick={() => navigate('/tasks')}
          >
            Ver todas as tarefas
          </Button>
        </CardContent>
      </Card>

      {/* Pipeline Summary */}
      <Card className="bg-white rounded-xl shadow-sm border border-slate-200">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg font-semibold text-slate-900">Pipeline Comercial</CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Prospecção</span>
              <Badge variant="secondary" className="text-sm font-semibold">
                {pipelineSummary.prospecting}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Qualificação</span>
              <Badge variant="secondary" className="text-sm font-semibold">
                {pipelineSummary.qualification}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Proposta</span>
              <Badge variant="secondary" className="text-sm font-semibold">
                {pipelineSummary.proposal}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Negociação</span>
              <Badge variant="secondary" className="text-sm font-semibold">
                {pipelineSummary.negotiation}
              </Badge>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-slate-600">Fechamento</span>
              <Badge className="status-active text-sm font-semibold">
                {pipelineSummary.closing}
              </Badge>
            </div>
          </div>
          <Button 
            variant="ghost" 
            className="w-full mt-4 text-sm text-primary hover:text-primary/80 font-medium"
            onClick={() => navigate('/pipeline')}
          >
            Ver pipeline completo
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
