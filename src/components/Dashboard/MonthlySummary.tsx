import { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO, eachWeekOfInterval, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CalendarDays, TrendingUp, Euro, Target, BarChart3 } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { cn } from '@/lib/utils';

export const MonthlySummary = () => {
  const { sales } = useSales();

  const monthlyStats = useMemo(() => {
    const now = new Date();
    const monthStart = startOfMonth(now);
    const monthEnd = endOfMonth(now);

    const monthlySales = sales.filter(sale => {
      const saleDate = parseISO(sale.sale_date);
      return isWithinInterval(saleDate, { start: monthStart, end: monthEnd });
    });

    const totalCommission = monthlySales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
    const salesCount = monthlySales.length;
    const avgCommissionPerSale = salesCount > 0 ? totalCommission / salesCount : 0;

    // Répartition par semaine du mois
    const weeks = eachWeekOfInterval({ start: monthStart, end: monthEnd }, { weekStartsOn: 1 });
    const weeklyBreakdown = weeks.map((weekStart, index) => {
      const weekEnd = endOfWeek(weekStart, { weekStartsOn: 1 });
      const weekSales = monthlySales.filter(s => {
        const saleDate = parseISO(s.sale_date);
        return isWithinInterval(saleDate, { 
          start: weekStart < monthStart ? monthStart : weekStart, 
          end: weekEnd > monthEnd ? monthEnd : weekEnd 
        });
      });
      return {
        week: `S${index + 1}`,
        count: weekSales.length,
        commission: weekSales.reduce((sum, s) => sum + (s.commission || 0), 0),
      };
    });

    // Objectif mensuel estimé (25 ventes/semaine * ~4 semaines)
    const monthlyTarget = 100;
    const progress = Math.min((salesCount / monthlyTarget) * 100, 100);

    // Jours restants dans le mois
    const daysInMonth = monthEnd.getDate();
    const daysPassed = now.getDate();
    const daysRemaining = daysInMonth - daysPassed;

    // Projection fin de mois
    const dailyAverage = daysPassed > 0 ? salesCount / daysPassed : 0;
    const projectedTotal = Math.round(dailyAverage * daysInMonth);

    return {
      monthStart,
      monthEnd,
      salesCount,
      totalCommission: Math.round(totalCommission * 100) / 100,
      avgCommissionPerSale: Math.round(avgCommissionPerSale * 100) / 100,
      weeklyBreakdown,
      progress,
      monthlyTarget,
      daysRemaining,
      projectedTotal,
      dailyAverage: Math.round(dailyAverage * 10) / 10,
    };
  }, [sales]);

  const maxWeeklySales = Math.max(...monthlyStats.weeklyBreakdown.map(w => w.count), 1);

  return (
    <Card className="modern-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CalendarDays className="h-5 w-5 text-primary" />
            Récapitulatif du mois
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(monthlyStats.monthStart, 'MMMM yyyy', { locale: fr })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats principales */}
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-lg bg-primary/10">
            <div className="flex items-center gap-2 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">Ventes</span>
            </div>
            <p className="text-2xl font-bold text-foreground">{monthlyStats.salesCount}</p>
          </div>
          <div className="p-3 rounded-lg bg-emerald-500/10">
            <div className="flex items-center gap-2 mb-1">
              <Euro className="h-4 w-4 text-emerald-600" />
              <span className="text-xs text-muted-foreground">Commission</span>
            </div>
            <p className="text-2xl font-bold text-emerald-600">{monthlyStats.totalCommission.toFixed(0)}€</p>
          </div>
        </div>

        {/* Progression mensuelle */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Objectif mensuel</span>
            <span className={cn(
              "font-medium",
              monthlyStats.progress >= 100 ? "text-emerald-600" : "text-foreground"
            )}>
              {monthlyStats.salesCount} / {monthlyStats.monthlyTarget}
              {monthlyStats.progress >= 100 && " 🎉"}
            </span>
          </div>
          <Progress value={monthlyStats.progress} className="h-2" />
        </div>

        {/* Graphique par semaine */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Ventes par semaine
          </p>
          <div className="flex items-end justify-between gap-2 h-16">
            {monthlyStats.weeklyBreakdown.map((week) => {
              const height = week.count > 0 ? (week.count / maxWeeklySales) * 100 : 8;
              
              return (
                <div key={week.week} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs font-medium text-foreground">{week.count}</span>
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all duration-300",
                      week.count > 0 ? "bg-primary/70" : "bg-muted"
                    )}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${week.count} ventes - ${week.commission.toFixed(2)}€`}
                  />
                  <span className="text-xs text-muted-foreground">{week.week}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Projections */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-border/50">
          <div className="text-center p-2 rounded bg-muted/50">
            <p className="text-lg font-bold text-info">{monthlyStats.projectedTotal}</p>
            <p className="text-xs text-muted-foreground">Projection fin de mois</p>
          </div>
          <div className="text-center p-2 rounded bg-muted/50">
            <p className="text-lg font-bold text-foreground">{monthlyStats.daysRemaining}j</p>
            <p className="text-xs text-muted-foreground">Jours restants</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
