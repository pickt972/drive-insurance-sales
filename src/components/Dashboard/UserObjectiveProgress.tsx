import { useMemo } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useObjectives, ObjectiveMode } from '@/hooks/useObjectives';
import { useSales } from '@/hooks/useSales';
import { useInsuranceTypes } from '@/hooks/useInsuranceTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Target, Euro, Hash, ListChecks, Award, TrendingUp, Flame } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function UserObjectiveProgress() {
  const { user } = useAuth();
  const { objectives, loading: objectivesLoading } = useObjectives();
  const { sales, loading: salesLoading } = useSales();
  const { insuranceTypes } = useInsuranceTypes();

  // Filter objectives for current user
  const userObjectives = useMemo(() => {
    if (!user) return [];
    return objectives.filter(obj => 
      obj.is_active && (obj.user_id === user.id || !obj.user_id)
    );
  }, [objectives, user]);

  // Calculate progress for each objective
  const objectivesWithProgress = useMemo(() => {
    if (!user) return [];

    return userObjectives.map(obj => {
      // Filter sales within objective period for current user
      const periodSales = sales.filter(sale => {
        const saleDate = parseISO(sale.sale_date);
        const periodStart = parseISO(obj.period_start);
        const periodEnd = parseISO(obj.period_end);
        
        const inPeriod = isWithinInterval(saleDate, { start: periodStart, end: periodEnd });
        return inPeriod;
      });

      // Calculate actual values
      const actualAmount = periodSales.reduce((sum, s) => sum + (s.amount || 0), 0);
      const actualCount = periodSales.length;
      
      // Calculate by type
      const actualByType: Record<string, number> = {};
      periodSales.forEach(sale => {
        const typeId = sale.insurance_type_id || '';
        if (typeId) {
          actualByType[typeId] = (actualByType[typeId] || 0) + 1;
        }
      });

      // Calculate progress percentages
      let progressPercent = 0;
      let progressDetails: { label: string; actual: number; target: number; percent: number; isAmount?: boolean }[] = [];

      switch (obj.objective_mode) {
        case 'amount':
          progressPercent = obj.target_amount > 0 ? (actualAmount / obj.target_amount) * 100 : 0;
          progressDetails = [{
            label: 'Montant',
            actual: actualAmount,
            target: obj.target_amount,
            percent: progressPercent,
            isAmount: true
          }];
          break;
        case 'count':
          progressPercent = obj.target_sales_count > 0 ? (actualCount / obj.target_sales_count) * 100 : 0;
          progressDetails = [{
            label: 'Ventes',
            actual: actualCount,
            target: obj.target_sales_count,
            percent: progressPercent
          }];
          break;
        case 'by_type':
          const targets = obj.target_by_insurance_type || {};
          const totalTarget = Object.values(targets).reduce((a, b) => a + b, 0);
          const totalActual = Object.keys(targets).reduce((sum, typeId) => {
            return sum + (actualByType[typeId] || 0);
          }, 0);
          progressPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
          
          Object.entries(targets).forEach(([typeId, target]) => {
            if (target > 0) {
              const actual = actualByType[typeId] || 0;
              const insuranceType = insuranceTypes.find(t => t.id === typeId);
              progressDetails.push({
                label: insuranceType?.name || typeId,
                actual,
                target,
                percent: (actual / target) * 100
              });
            }
          });
          break;
        case 'mixed':
          const amountPercent = obj.target_amount > 0 ? (actualAmount / obj.target_amount) * 100 : 0;
          const countPercent = obj.target_sales_count > 0 ? (actualCount / obj.target_sales_count) * 100 : 0;
          progressPercent = (amountPercent + countPercent) / 2;
          progressDetails = [
            { label: 'Montant', actual: actualAmount, target: obj.target_amount, percent: amountPercent, isAmount: true },
            { label: 'Ventes', actual: actualCount, target: obj.target_sales_count, percent: countPercent }
          ];
          break;
      }

      return {
        ...obj,
        actualAmount,
        actualCount,
        actualByType,
        progressPercent: Math.min(progressPercent, 150), // Allow over 100% for display
        progressDetails,
      };
    });
  }, [userObjectives, sales, user, insuranceTypes]);

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    if (percent >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  };

  const getProgressGradient = (percent: number) => {
    if (percent >= 100) return 'from-green-500 to-emerald-400';
    if (percent >= 75) return 'from-blue-500 to-cyan-400';
    if (percent >= 50) return 'from-yellow-500 to-amber-400';
    if (percent >= 25) return 'from-orange-500 to-yellow-400';
    return 'from-red-500 to-orange-400';
  };

  const getStatusBadge = (percent: number) => {
    if (percent >= 100) return { label: 'Objectif atteint! 🎉', variant: 'default' as const, icon: Award };
    if (percent >= 75) return { label: 'Excellent', variant: 'secondary' as const, icon: Flame };
    if (percent >= 50) return { label: 'En bonne voie', variant: 'outline' as const, icon: TrendingUp };
    if (percent >= 25) return { label: 'Continue!', variant: 'outline' as const, icon: Target };
    return { label: 'À améliorer', variant: 'destructive' as const, icon: Target };
  };

  const getModeIcon = (mode: ObjectiveMode) => {
    switch (mode) {
      case 'amount': return Euro;
      case 'count': return Hash;
      case 'by_type': return ListChecks;
      default: return Target;
    }
  };

  const loading = objectivesLoading || salesLoading;

  if (loading) {
    return (
      <Card className="modern-card">
        <CardContent className="py-8 text-center text-muted-foreground">
          Chargement des objectifs...
        </CardContent>
      </Card>
    );
  }

  if (objectivesWithProgress.length === 0) {
    return null; // Don't show card if no objectives
  }

  return (
    <Card className="modern-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-primary/10 via-transparent to-info/10">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-full bg-primary/20">
            <Target className="h-5 w-5 text-primary" />
          </div>
          <div>
            <CardTitle className="text-lg">Mes Objectifs</CardTitle>
            <CardDescription>Suivez votre progression en temps réel</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {objectivesWithProgress.map((obj) => {
          const StatusIcon = getStatusBadge(obj.progressPercent).icon;
          const ModeIcon = getModeIcon(obj.objective_mode);
          
          return (
            <div 
              key={obj.id} 
              className={`p-4 rounded-xl border-2 transition-all ${
                obj.progressPercent >= 100 
                  ? 'border-green-300 bg-green-50/50 dark:bg-green-950/20 dark:border-green-800' 
                  : 'border-border bg-card hover:bg-muted/50'
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <ModeIcon className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm text-muted-foreground">
                    {format(new Date(obj.period_start), 'dd MMM', { locale: fr })} - {format(new Date(obj.period_end), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
                <Badge variant={getStatusBadge(obj.progressPercent).variant} className="flex items-center gap-1">
                  <StatusIcon className="h-3 w-3" />
                  {getStatusBadge(obj.progressPercent).label}
                </Badge>
              </div>

              {/* Progress details */}
              <div className="space-y-3">
                {obj.progressDetails.map((detail, idx) => (
                  <div key={idx}>
                    <div className="flex justify-between items-center mb-1">
                      <span className="text-sm font-medium">{detail.label}</span>
                      <span className="text-sm font-bold">
                        {detail.isAmount 
                          ? `${detail.actual.toFixed(0)}€ / ${detail.target.toFixed(0)}€`
                          : `${detail.actual} / ${detail.target}`
                        }
                      </span>
                    </div>
                    <div className="relative h-3 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${getProgressGradient(detail.percent)} transition-all duration-500`}
                        style={{ width: `${Math.min(detail.percent, 100)}%` }}
                      />
                      {detail.percent > 100 && (
                        <div className="absolute inset-0 flex items-center justify-end pr-2">
                          <span className="text-[10px] font-bold text-white drop-shadow">
                            +{Math.round(detail.percent - 100)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-end mt-1">
                      <span className={`text-xs font-semibold ${
                        detail.percent >= 100 ? 'text-green-600' : 
                        detail.percent >= 75 ? 'text-blue-600' : 
                        detail.percent >= 50 ? 'text-yellow-600' : 'text-muted-foreground'
                      }`}>
                        {Math.round(detail.percent)}%
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Description */}
              {obj.description && (
                <p className="text-xs text-muted-foreground mt-2 italic">{obj.description}</p>
              )}

              {/* Celebration for achieved objectives */}
              {obj.progressPercent >= 100 && (
                <div className="mt-3 p-2 rounded-lg bg-green-100 dark:bg-green-900/30 text-center">
                  <span className="text-sm font-semibold text-green-700 dark:text-green-400">
                    🎯 Félicitations ! Objectif dépassé de {Math.round(obj.progressPercent - 100)}%
                  </span>
                </div>
              )}
            </div>
          );
        })}

        {/* Summary */}
        {objectivesWithProgress.length > 1 && (
          <div className="pt-2 border-t">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Progression globale</span>
              <span className="font-bold">
                {Math.round(objectivesWithProgress.reduce((sum, o) => sum + o.progressPercent, 0) / objectivesWithProgress.length)}%
              </span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
