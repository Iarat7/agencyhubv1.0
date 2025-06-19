
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Crown, AlertTriangle, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";

interface PlanLimitsBadgeProps {
  current: number;
  max: number;
  label: string;
  showProgress?: boolean;
  onUpgrade?: () => void;
}

export function PlanLimitsBadge({ current, max, label, showProgress = false, onUpgrade }: PlanLimitsBadgeProps) {
  const [, setLocation] = useLocation();
  const percentage = (current / max) * 100;
  const isNearLimit = percentage >= 80;
  const isAtLimit = current >= max;

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      setLocation('/billing?tab=plans');
    }
  };

  const getProgressColor = () => {
    if (isAtLimit) return "bg-red-500";
    if (isNearLimit) return "bg-yellow-500";
    return "bg-green-500";
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Badge 
          variant={isAtLimit ? "destructive" : isNearLimit ? "secondary" : "outline"}
          className="flex items-center gap-1"
        >
          {isAtLimit && <AlertTriangle className="h-3 w-3" />}
          {current}/{max} {label}
        </Badge>
        
        {showProgress && (
          <div className="flex-1 min-w-20">
            <Progress 
              value={Math.min(percentage, 100)} 
              className="h-2"
            />
          </div>
        )}
        
        <span className="text-xs text-gray-500">
          {Math.round(percentage)}%
        </span>
      </div>
      
      {isNearLimit && (
        <Alert className={isAtLimit ? "border-red-200 bg-red-50" : "border-yellow-200 bg-yellow-50"}>
          {isAtLimit ? <AlertTriangle className="h-4 w-4 text-red-600" /> : <Crown className="h-4 w-4 text-yellow-600" />}
          <AlertDescription className="flex items-center justify-between">
            <span className={isAtLimit ? "text-red-700" : "text-yellow-700"}>
              {isAtLimit 
                ? `Limite de ${label.toLowerCase()} atingido! Faça upgrade para continuar usando.` 
                : `Você está usando ${Math.round(percentage)}% do seu limite de ${label.toLowerCase()}.`
              }
            </span>
            <Button 
              size="sm" 
              variant={isAtLimit ? "destructive" : "secondary"}
              onClick={handleUpgrade}
              className="ml-2"
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              {isAtLimit ? "Upgrade Agora" : "Fazer Upgrade"}
            </Button>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
