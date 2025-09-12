import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Target, TrendingUp, Calendar, User } from "lucide-react";
import { ObjectiveProgress } from "@/types/objectives";

// Composant de barre de progression avec dégradé de couleur
interface ColoredProgressProps {
  value: number;
  className?: string;
}

const ColoredProgress = ({ value, className = "" }: ColoredProgressProps) => {
  // Calculer la couleur basée sur le pourcentage
  const getProgressStyle = (percentage: number) => {
    // Rouge (0%) vers Vert (100%)
    const red = Math.max(0, Math.min(255, 255 - (percentage * 2.55)));
    const green = Math.max(0, Math.min(255, percentage * 2.55));
    const blue = 0;
    
    return {
      backgroundColor: `rgb(${Math.round(red)}, ${Math.round(green)}, ${blue})`,
      width: `${Math.min(100, Math.max(0, percentage))}%`,
    };
  };

  const progressWidth = Math.min(100, Math.max(0, value));

  return (
    <div className={`relative w-full bg-muted rounded-full h-6 overflow-visible ${className}`}>
      <div 
        className="h-full transition-all duration-500 ease-out rounded-full"
        style={getProgressStyle(value)}
      />
      {/* Pourcentage positionné là où la barre s'arrête */}
      <div 
        className="absolute top-0 h-full flex items-center text-xs font-medium text-white px-2"
        style={{ 
          left: progressWidth > 15 ? `${progressWidth - 15}%` : `${progressWidth}%`,
          minWidth: '30px',
          justifyContent: progressWidth > 15 ? 'center' : 'flex-start'
        }}
      >
        {progressWidth > 10 && `${value.toFixed(1)}%`}
      </div>
      {/* Pourcentage à l'extérieur si la barre est trop petite */}
      {progressWidth <= 10 && (
        <div 
          className="absolute top-0 h-full flex items-center text-xs font-medium text-foreground px-2"
          style={{ left: `${progressWidth + 2}%` }}
        >
          {value.toFixed(1)}%
        </div>
      )}
    </div>
  );
};

interface ObjectiveProgressCardProps {
  progress: ObjectiveProgress;
  showEmployeeName?: boolean;
}

export const ObjectiveProgressCard = ({ progress, showEmployeeName = false }: ObjectiveProgressCardProps) => {
  const { objective } = progress;
  
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;
  
  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly': return 'Mensuel';
      case 'weekly': return 'Hebdomadaire';
      case 'yearly': return 'Annuel';
      default: return type;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 80) return 'text-success';
    if (percentage >= 50) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Target className="h-5 w-5 text-primary" />
            Objectif {getTypeLabel(objective.objective_type)}
          </CardTitle>
          {showEmployeeName && (
            <Badge variant="outline" className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {objective.employee_name}
            </Badge>
          )}
        </div>
        {objective.description && (
          <p className="text-sm text-muted-foreground">{objective.description}</p>
        )}
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Progression des commissions - affiché si target_amount > 0 */}
        {objective.target_amount > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                Commissions
              </span>
            </div>
            <ColoredProgress value={progress.progress_percentage_amount} className="h-6" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{formatCurrency(progress.current_amount)}</span>
              <span>/ {formatCurrency(objective.target_amount)}</span>
            </div>
          </div>
        )}

        {/* Progression du nombre de ventes - affiché si target_sales_count > 0 */}
        {objective.target_sales_count > 0 && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                Nombre de ventes
              </span>
            </div>
            <ColoredProgress value={progress.progress_percentage_sales} className="h-6" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progress.current_sales_count}</span>
              <span>/ {objective.target_sales_count}</span>
            </div>
          </div>
        )}

        {/* Période et temps restant */}
        <div className="pt-2 border-t">
          <div className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-1 text-muted-foreground">
              <Calendar className="h-3 w-3" />
              Période
            </span>
            <span className="text-muted-foreground">
              {new Date(objective.period_start).toLocaleDateString('fr-FR')} - {new Date(objective.period_end).toLocaleDateString('fr-FR')}
            </span>
          </div>
          <div className="flex items-center justify-between text-sm mt-1">
            <span className="text-muted-foreground">Temps restant</span>
            <Badge variant={progress.days_remaining > 7 ? "secondary" : progress.days_remaining > 0 ? "destructive" : "outline"}>
              {progress.days_remaining > 0 ? `${progress.days_remaining} jour${progress.days_remaining > 1 ? 's' : ''}` : 'Terminé'}
            </Badge>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};