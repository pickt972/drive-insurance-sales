import { useMemo } from 'react';
import { format, startOfWeek, endOfWeek, isWithinInterval, parseISO, subWeeks } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Calendar, TrendingUp, TrendingDown, Euro, Target, Award, ArrowUp, ArrowDown, Minus } from 'lucide-react';
import { useSales } from '@/hooks/useSales';
import { cn } from '@/lib/utils';

export const WeeklySummary = () => {
  const { sales } = useSales();

  const weeklyStats = useMemo(() => {
    const now = new Date();
    const weekStart = startOfWeek(now, { weekStartsOn: 1 });
    const weekEnd = endOfWeek(now, { weekStartsOn: 1 });

    // Semaine précédente
    const prevWeekStart = subWeeks(weekStart, 1);
    const prevWeekEnd = subWeeks(weekEnd, 1);

    const weeklySales = sales.filter(sale => {
      const saleDate = parseISO(sale.sale_date);
      return isWithinInterval(saleDate, { start: weekStart, end: weekEnd });
    });

    const prevWeeklySales = sales.filter(sale => {
      const saleDate = parseISO(sale.sale_date);
      return isWithinInterval(saleDate, { start: prevWeekStart, end: prevWeekEnd });
    });

    const totalCommission = weeklySales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
    const prevTotalCommission = prevWeeklySales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
    const salesCount = weeklySales.length;
    const prevSalesCount = prevWeeklySales.length;
    const avgCommissionPerSale = salesCount > 0 ? totalCommission / salesCount : 0;

    // Calcul des variations
    const salesDiff = salesCount - prevSalesCount;
    const salesDiffPercent = prevSalesCount > 0 ? Math.round((salesDiff / prevSalesCount) * 100) : (salesCount > 0 ? 100 : 0);
    const commissionDiff = totalCommission - prevTotalCommission;
    const commissionDiffPercent = prevTotalCommission > 0 ? Math.round((commissionDiff / prevTotalCommission) * 100) : (totalCommission > 0 ? 100 : 0);

    // Répartition par jour de la semaine
    const dailyBreakdown: { day: string; count: number; commission: number }[] = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(weekStart);
      day.setDate(weekStart.getDate() + i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const daySales = weeklySales.filter(s => s.sale_date === dayStr);
      dailyBreakdown.push({
        day: format(day, 'EEE', { locale: fr }),
        count: daySales.length,
        commission: daySales.reduce((sum, s) => sum + (s.commission || 0), 0),
      });
    }

    const weeklyTarget = 25;
    const progress = Math.min((salesCount / weeklyTarget) * 100, 100);

    const bestDay = dailyBreakdown.reduce((best, current) => 
      current.count > best.count ? current : best
    , dailyBreakdown[0]);

    return {
      weekStart,
      weekEnd,
      salesCount,
      prevSalesCount,
      totalCommission: Math.round(totalCommission * 100) / 100,
      prevTotalCommission: Math.round(prevTotalCommission * 100) / 100,
      avgCommissionPerSale: Math.round(avgCommissionPerSale * 100) / 100,
      dailyBreakdown,
      progress,
      weeklyTarget,
      bestDay,
      salesDiff,
      salesDiffPercent,
      commissionDiff: Math.round(commissionDiff * 100) / 100,
      commissionDiffPercent,
    };
  }, [sales]);

  const maxDailySales = Math.max(...weeklyStats.dailyBreakdown.map(d => d.count), 1);

  const getTrendIcon = (diff: number) => {
    if (diff > 0) return <ArrowUp className="h-3 w-3" />;
    if (diff < 0) return <ArrowDown className="h-3 w-3" />;
    return <Minus className="h-3 w-3" />;
  };

  const getTrendColor = (diff: number) => {
    if (diff > 0) return "text-emerald-600 bg-emerald-500/10";
    if (diff < 0) return "text-red-500 bg-red-500/10";
    return "text-muted-foreground bg-muted";
  };

  return (
    <Card className="modern-card">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Récapitulatif de la semaine
          </CardTitle>
          <span className="text-sm text-muted-foreground">
            {format(weeklyStats.weekStart, 'd', { locale: fr })} - {format(weeklyStats.weekEnd, 'd MMMM', { locale: fr })}
          </span>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Stats principales avec comparaison */}
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center p-3 rounded-lg bg-primary/10">
            <TrendingUp className="h-5 w-5 mx-auto mb-1 text-primary" />
            <p className="text-2xl font-bold text-foreground">{weeklyStats.salesCount}</p>
            <p className="text-xs text-muted-foreground mb-1">Ventes</p>
            <div className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
              getTrendColor(weeklyStats.salesDiff)
            )}>
              {getTrendIcon(weeklyStats.salesDiff)}
              <span>{weeklyStats.salesDiff >= 0 ? '+' : ''}{weeklyStats.salesDiffPercent}%</span>
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-emerald-500/10">
            <Euro className="h-5 w-5 mx-auto mb-1 text-emerald-600" />
            <p className="text-2xl font-bold text-emerald-600">{weeklyStats.totalCommission.toFixed(0)}€</p>
            <p className="text-xs text-muted-foreground mb-1">Commission</p>
            <div className={cn(
              "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-xs font-medium",
              getTrendColor(weeklyStats.commissionDiff)
            )}>
              {getTrendIcon(weeklyStats.commissionDiff)}
              <span>{weeklyStats.commissionDiff >= 0 ? '+' : ''}{weeklyStats.commissionDiffPercent}%</span>
            </div>
          </div>
          <div className="text-center p-3 rounded-lg bg-info/10">
            <Target className="h-5 w-5 mx-auto mb-1 text-info" />
            <p className="text-2xl font-bold text-info">{weeklyStats.avgCommissionPerSale.toFixed(0)}€</p>
            <p className="text-xs text-muted-foreground">Moy./vente</p>
          </div>
        </div>

        {/* Comparaison avec semaine précédente */}
        <div className="p-2 rounded-lg bg-muted/50 border border-border/50">
          <p className="text-xs text-muted-foreground text-center">
            Semaine précédente : <span className="font-medium text-foreground">{weeklyStats.prevSalesCount} ventes</span>
            {' • '}
            <span className="font-medium text-emerald-600">{weeklyStats.prevTotalCommission.toFixed(0)}€</span>
          </p>
        </div>

        {/* Progression hebdomadaire */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Objectif hebdo</span>
            <span className={cn(
              "font-medium",
              weeklyStats.progress >= 100 ? "text-emerald-600" : "text-foreground"
            )}>
              {weeklyStats.salesCount} / {weeklyStats.weeklyTarget}
              {weeklyStats.progress >= 100 && " ✓"}
            </span>
          </div>
          <Progress value={weeklyStats.progress} className="h-2" />
        </div>

        {/* Graphique par jour */}
        <div className="space-y-2">
          <p className="text-sm font-medium text-muted-foreground">Ventes par jour</p>
          <div className="flex items-end justify-between gap-1 h-20">
            {weeklyStats.dailyBreakdown.map((day, index) => {
              const height = day.count > 0 ? (day.count / maxDailySales) * 100 : 8;
              const isToday = index === new Date().getDay() - 1 || (new Date().getDay() === 0 && index === 6);
              
              return (
                <div key={day.day} className="flex-1 flex flex-col items-center gap-1">
                  <div 
                    className={cn(
                      "w-full rounded-t transition-all duration-300",
                      isToday ? "bg-primary" : day.count > 0 ? "bg-primary/60" : "bg-muted"
                    )}
                    style={{ height: `${height}%`, minHeight: '4px' }}
                    title={`${day.count} vente${day.count > 1 ? 's' : ''} - ${day.commission.toFixed(2)}€`}
                  />
                  <span className={cn(
                    "text-xs",
                    isToday ? "font-bold text-primary" : "text-muted-foreground"
                  )}>
                    {day.day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Meilleur jour */}
        {weeklyStats.bestDay.count > 0 && (
          <div className="flex items-center gap-2 p-2 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
            <Award className="h-4 w-4 text-yellow-600" />
            <span className="text-sm">
              <span className="font-medium text-yellow-700">Meilleur jour :</span>
              <span className="text-muted-foreground ml-1">
                {weeklyStats.bestDay.day} ({weeklyStats.bestDay.count} vente{weeklyStats.bestDay.count > 1 ? 's' : ''})
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
