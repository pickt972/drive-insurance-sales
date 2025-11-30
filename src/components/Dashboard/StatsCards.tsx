import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Target, Award } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { useObjectives } from '@/hooks/useObjectives';
import { useMemo } from 'react';

export function StatsCards() {
  const { sales } = useSales();
  const { objectives } = useObjectives();

  // Calculer les stats du mois en cours
  const monthStats = useMemo(() => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= firstDay && saleDate <= lastDay;
    });

    const totalAmount = monthSales.reduce((sum, s) => sum + s.amount, 0);
    const totalCommission = monthSales.reduce((sum, s) => sum + s.commission, 0);
    const salesCount = monthSales.length;
    const avgAmount = salesCount > 0 ? totalAmount / salesCount : 0;

    return {
      totalAmount,
      totalCommission,
      salesCount,
      avgAmount,
    };
  }, [sales]);

  // Objectif du mois
  const monthObjective = useMemo(() => {
    const now = new Date();
    return objectives.find(obj => {
      const start = new Date(obj.period_start);
      const end = new Date(obj.period_end);
      return now >= start && now <= end;
    });
  }, [objectives]);

  const objectiveProgress = monthObjective 
    ? (monthStats.totalCommission / monthObjective.target_amount) * 100 
    : 0;

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {/* Total ventes */}
      <Card className="stat-card group border-primary/20 hover:border-primary/40 hover:shadow-primary animate-gentle-fade-in">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Ventes du mois
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:scale-110 transition-transform duration-300">
            <DollarSign className="h-5 w-5 text-primary" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary-variant bg-clip-text text-transparent">
            {monthStats.totalAmount.toFixed(2)} €
          </div>
          <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
            <TrendingUp className="h-3 w-3" />
            {monthStats.salesCount} vente{monthStats.salesCount > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Commission */}
      <Card className="stat-card group border-success/20 hover:border-success/40 hover:shadow-success animate-gentle-fade-in" style={{ animationDelay: '0.1s' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Commission
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-success/5 group-hover:scale-110 transition-transform duration-300">
            <TrendingUp className="h-5 w-5 text-success" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-success to-success-variant bg-clip-text text-transparent">
            {monthStats.totalCommission.toFixed(2)} €
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Moyenne : {monthStats.avgAmount.toFixed(2)} €
          </p>
        </CardContent>
      </Card>

      {/* Objectif */}
      <Card className="stat-card group border-orange/20 hover:border-orange/40 hover:shadow-orange animate-gentle-fade-in" style={{ animationDelay: '0.2s' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Objectif du mois
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange/10 to-orange/5 group-hover:scale-110 transition-transform duration-300">
            <Target className="h-5 w-5 text-orange" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-3xl font-bold bg-gradient-to-br from-orange to-warning bg-clip-text text-transparent">
            {monthObjective ? `${objectiveProgress.toFixed(0)}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            {monthObjective 
              ? `${monthStats.totalCommission.toFixed(0)} / ${monthObjective.target_amount} €`
              : 'Aucun objectif défini'
            }
          </p>
          {monthObjective && (
            <div className="mt-2 h-2 w-full bg-muted rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-orange to-warning transition-all duration-500"
                style={{ width: `${Math.min(objectiveProgress, 100)}%` }}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Performance */}
      <Card className="stat-card group border-purple/20 hover:border-purple/40 hover:shadow-purple animate-gentle-fade-in" style={{ animationDelay: '0.3s' }}>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">
            Performance
          </CardTitle>
          <div className="p-2 rounded-lg bg-gradient-to-br from-purple/10 to-purple/5 group-hover:scale-110 transition-transform duration-300">
            <Award className="h-5 w-5 text-purple" />
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-4xl font-bold mb-2 animate-float-gentle">
            {monthStats.salesCount > 5 ? '🏆' : monthStats.salesCount > 3 ? '🥈' : '🥉'}
          </div>
          <p className="text-sm font-semibold bg-gradient-to-r from-purple to-info bg-clip-text text-transparent">
            {monthStats.salesCount > 5 
              ? 'Excellent !' 
              : monthStats.salesCount > 3 
              ? 'Très bien' 
              : 'Continue !'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            {monthStats.salesCount} ventes ce mois
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
