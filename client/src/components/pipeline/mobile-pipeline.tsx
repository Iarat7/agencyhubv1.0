import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Building, Calendar, DollarSign } from "lucide-react";
import type { Opportunity } from "@shared/schema";

interface MobilePipelineProps {
  opportunities: Opportunity[];
  onStageChange: (id: number, newStage: string) => void;
  onView: (opportunity: Opportunity) => void;
  onEdit: (opportunity: Opportunity) => void;
  onDelete: (id: number) => void;
}

export function MobilePipeline({ 
  opportunities, 
  onStageChange, 
  onView, 
  onEdit, 
  onDelete 
}: MobilePipelineProps) {
  const [currentStage, setCurrentStage] = useState(0);

  const stages = [
    { id: 'prospecting', name: 'Prospecção', color: 'bg-blue-100 text-blue-800' },
    { id: 'qualification', name: 'Qualificação', color: 'bg-yellow-100 text-yellow-800' },
    { id: 'proposal', name: 'Proposta', color: 'bg-orange-100 text-orange-800' },
    { id: 'negotiation', name: 'Negociação', color: 'bg-purple-100 text-purple-800' },
    { id: 'closed_won', name: 'Fechado', color: 'bg-green-100 text-green-800' }
  ];

  const stageOpportunities = opportunities.filter(
    opp => opp.stage === stages[currentStage].id
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="space-y-4">
      {/* Stage Navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg p-4 shadow-sm border">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStage(Math.max(0, currentStage - 1))}
          disabled={currentStage === 0}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        
        <div className="text-center flex-1 mx-4">
          <Badge className={stages[currentStage].color}>
            {stages[currentStage].name}
          </Badge>
          <p className="text-sm text-gray-600 mt-1">
            {stageOpportunities.length} oportunidade(s)
          </p>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={() => setCurrentStage(Math.min(stages.length - 1, currentStage + 1))}
          disabled={currentStage === stages.length - 1}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* Opportunities List */}
      <div className="space-y-3">
        {stageOpportunities.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <div className="text-gray-400 mb-2">
                <Building className="h-12 w-12 mx-auto" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-1">
                Nenhuma oportunidade
              </h3>
              <p className="text-gray-600">
                Não há oportunidades neste estágio
              </p>
            </CardContent>
          </Card>
        ) : (
          stageOpportunities.map((opportunity) => (
            <Card key={opportunity.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg">{opportunity.title}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Building className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {opportunity.clientName}
                      </span>
                    </div>
                  </div>
                  <Badge className={stages[currentStage].color}>
                    {stages[currentStage].name}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                {/* Deal Value */}
                <div className="bg-gray-50 rounded-lg p-4 mb-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {formatCurrency(Number(opportunity.value) || 0)}
                    </div>
                    <div className="text-sm font-medium text-blue-600">
                      {opportunity.probability || 0}% de probabilidade
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onView(opportunity)}
                    className="text-xs"
                  >
                    Ver
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onEdit(opportunity)}
                    className="text-xs"
                  >
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => onDelete(Number(opportunity.id))}
                    className="text-xs"
                  >
                    Excluir
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}