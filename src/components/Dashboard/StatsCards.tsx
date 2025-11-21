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
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Ventes du mois
          </CardTitle>
          <DollarSign className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {monthStats.totalAmount.toFixed(2)} €
          </div>
          <p className="text-xs text-muted-foreground">
            {monthStats.salesCount} vente{monthStats.salesCount > 1 ? 's' : ''}
          </p>
        </CardContent>
      </Card>

      {/* Commission */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Commission
          </CardTitle>
          <TrendingUp className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            {monthStats.totalCommission.toFixed(2)} €
          </div>
          <p className="text-xs text-muted-foreground">
            Moyenne : {monthStats.avgAmount.toFixed(2)} €
          </p>
        </CardContent>
      </Card>

      {/* Objectif */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Objectif du mois
          </CardTitle>
          <Target className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {monthObjective ? `${objectiveProgress.toFixed(0)}%` : 'N/A'}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthObjective 
              ? `${monthStats.totalCommission.toFixed(0)} / ${monthObjective.target_amount} €`
              : 'Aucun objectif défini'
            }
          </p>
        </CardContent>
      </Card>

      {/* Classement */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">
            Performance
          </CardTitle>
          <Award className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {monthStats.salesCount > 5 ? '🏆' : monthStats.salesCount > 3 ? '🥈' : '🥉'}
          </div>
          <p className="text-xs text-muted-foreground">
            {monthStats.salesCount > 5 
              ? 'Excellent !' 
              : monthStats.salesCount > 3 
              ? 'Bien' 
              : 'Continue !'}
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
