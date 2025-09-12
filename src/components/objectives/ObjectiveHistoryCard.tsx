import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Calendar, Target, TrendingUp } from 'lucide-react';
import { ObjectiveHistory } from '@/types/objectiveHistory';

interface ObjectiveHistoryCardProps {
  historyItem: ObjectiveHistory;
}

const ObjectiveHistoryCard = ({ historyItem }: ObjectiveHistoryCardProps) => {
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'monthly': return 'Mensuel';
      case 'weekly': return 'Hebdomadaire';
      case 'yearly': return 'Annuel';
      default: return type;
    }
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 100) return 'bg-green-500';
    if (percentage >= 75) return 'bg-blue-500';
    if (percentage >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Target className="h-5 w-5" />
            {historyItem.employee_name}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="outline">
              {getTypeLabel(historyItem.objective_type)}
            </Badge>
            {historyItem.objective_achieved ? (
              <CheckCircle className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Calendar className="h-4 w-4" />
          {format(new Date(historyItem.period_start), 'dd MMM', { locale: fr })} - {format(new Date(historyItem.period_end), 'dd MMM yyyy', { locale: fr })}
        </div>
        
        {historyItem.description && (
          <p className="text-sm text-muted-foreground">{historyItem.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Commission Progress */}
        {historyItem.target_amount > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Commission</span>
              <span className="text-sm text-muted-foreground">
                {formatCurrency(historyItem.achieved_amount)} / {formatCurrency(historyItem.target_amount)}
              </span>
            </div>
            <Progress 
              value={historyItem.progress_percentage_amount} 
              className="h-2"
            />
            <div className="text-right">
              <span className={`text-sm font-medium ${historyItem.progress_percentage_amount >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {historyItem.progress_percentage_amount.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Sales Count Progress */}
        {historyItem.target_sales_count > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Nombre de ventes</span>
              <span className="text-sm text-muted-foreground">
                {historyItem.achieved_sales_count} / {historyItem.target_sales_count}
              </span>
            </div>
            <Progress 
              value={historyItem.progress_percentage_sales} 
              className="h-2"
            />
            <div className="text-right">
              <span className={`text-sm font-medium ${historyItem.progress_percentage_sales >= 100 ? 'text-green-600' : 'text-muted-foreground'}`}>
                {historyItem.progress_percentage_sales.toFixed(1)}%
              </span>
            </div>
          </div>
        )}

        {/* Achievement Status */}
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="flex items-center gap-2 text-sm">
            <TrendingUp className="h-4 w-4" />
            <span className="font-medium">
              {historyItem.objective_achieved ? 'Objectif atteint' : 'Objectif non atteint'}
            </span>
          </div>
          <span className="text-xs text-muted-foreground">
            Archivé le {format(new Date(historyItem.archived_at), 'dd/MM/yyyy', { locale: fr })}
          </span>
        </div>
      </CardContent>
    </Card>
  );
};

export default ObjectiveHistoryCard;