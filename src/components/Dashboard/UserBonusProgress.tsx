import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useSales } from '@/hooks/useSales';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Award, TrendingUp, CheckCircle2, Trophy } from 'lucide-react';
import { startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';

type BaseType = 'sales_amount' | 'sales_count' | 'commission';
type CalcMode = 'highest' | 'cumulative';
type BonusType = 'fixed' | 'percent';

interface Tier { threshold: number; bonus: number; }
interface BonusRule {
  id: string;
  name: string;
  description: string | null;
  base: BaseType;
  calculation_mode: CalcMode;
  bonus_type: BonusType;
  tiers: Tier[];
  is_active: boolean;
}

export function UserBonusProgress() {
  const { user } = useAuth();
  const { sales } = useSales();
  const [rules, setRules] = useState<BonusRule[]>([]);

  useEffect(() => {
    (async () => {
      const { data } = await (supabase as any)
        .from('bonus_rules')
        .select('*')
        .eq('is_active', true);
      setRules(
        (data || []).map((r: any) => ({
          ...r,
          tiers: Array.isArray(r.tiers) ? r.tiers : [],
          base: r.base || 'sales_amount',
          calculation_mode: r.calculation_mode || 'highest',
          bonus_type: r.bonus_type || 'fixed',
        }))
      );
    })();
  }, []);

  const monthSales = useMemo(() => {
    if (!user) return [];
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);
    return sales.filter(s => {
      if (s.user_id !== user.id) return false;
      try {
        return isWithinInterval(parseISO(s.sale_date), { start, end });
      } catch {
        return false;
      }
    });
  }, [sales, user]);

  const totals = useMemo(() => {
    const totalAmount = monthSales.reduce((sum, s) => sum + Number(s.amount || 0), 0);
    const totalCommission = monthSales.reduce((sum, s) => sum + Number(s.commission || 0), 0);
    return { totalAmount, totalCommission, count: monthSales.length };
  }, [monthSales]);

  const ruleProgress = useMemo(() => {
    return rules.map(rule => {
      const sortedTiers = [...rule.tiers].sort((a, b) => a.threshold - b.threshold);
      const measured =
        rule.base === 'sales_count' ? totals.count :
        rule.base === 'commission' ? totals.commission :
        totals.totalAmount;
      const baseForPct =
        rule.base === 'sales_count' ? totals.totalCommission : measured;

      const reached = sortedTiers.filter(t => measured >= t.threshold);
      const next = sortedTiers.find(t => measured < t.threshold);

      const toAmount = (raw: number) =>
        rule.bonus_type === 'percent' ? (baseForPct * raw) / 100 : raw;

      let earned = 0;
      if (reached.length > 0) {
        earned = rule.calculation_mode === 'cumulative'
          ? reached.reduce((s, t) => s + toAmount(t.bonus), 0)
          : toAmount(reached[reached.length - 1].bonus);
      }

      const target = next ? next.threshold : (sortedTiers[sortedTiers.length - 1]?.threshold || 0);
      const percent = target > 0 ? Math.min((measured / target) * 100, 100) : 100;
      const remaining = next ? Math.max(next.threshold - measured, 0) : 0;
      const nextBonus = next ? toAmount(next.bonus) : 0;

      return {
        rule,
        measured,
        earned,
        reached,
        next,
        nextBonus,
        remaining,
        percent,
        unit: rule.base === 'sales_count' ? 'ventes' : '€',
      };
    });
  }, [rules, totals]);

  const totalBonusEstimated = ruleProgress.reduce((s, r) => s + r.earned, 0);

  if (rules.length === 0) return null;

  return (
    <Card className="modern-card overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-warning/10 via-transparent to-primary/10">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-warning/20">
              <Trophy className="h-5 w-5 text-warning" />
            </div>
            <div>
              <CardTitle className="text-lg">Mes Primes & Bonus</CardTitle>
              <CardDescription>Suivi en temps réel — mois en cours</CardDescription>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs text-muted-foreground">Estimation totale</p>
            <p className="text-2xl font-bold text-success">+{totalBonusEstimated.toFixed(2)} €</p>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 pt-4">
        {ruleProgress.map(({ rule, measured, earned, reached, next, nextBonus, remaining, percent, unit }) => (
          <div
            key={rule.id}
            className={`p-4 rounded-xl border-2 transition-all ${
              earned > 0
                ? 'border-success/40 bg-success/5'
                : 'border-border bg-card'
            }`}
          >
            <div className="flex items-center justify-between mb-2 flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-warning" />
                <span className="font-semibold">{rule.name}</span>
                {earned > 0 && (
                  <Badge className="bg-success text-success-foreground gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Palier déclenché
                  </Badge>
                )}
              </div>
              <span className="text-sm font-bold text-success">+{earned.toFixed(2)} €</span>
            </div>

            <div className="text-xs text-muted-foreground mb-2">
              Réalisé : <span className="font-semibold text-foreground">
                {unit === '€' ? `${measured.toFixed(2)} €` : `${measured} ${unit}`}
              </span>
            </div>

            <Progress value={percent} className="h-2 mb-2" />

            <div className="flex items-center justify-between text-xs">
              {next ? (
                <span className="text-muted-foreground flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Prochain palier : {unit === '€' ? `${next.threshold} €` : `${next.threshold} ${unit}`}
                  {' '}(+{nextBonus.toFixed(2)} €) — encore {unit === '€' ? `${remaining.toFixed(2)} €` : `${remaining} ${unit}`}
                </span>
              ) : (
                <span className="text-success font-semibold">🎉 Palier max atteint !</span>
              )}
              <span className="font-semibold">{Math.round(percent)}%</span>
            </div>

            {reached.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {reached.map((t, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    ✓ {unit === '€' ? `${t.threshold}€` : `${t.threshold} ${unit}`} → +{rule.bonus_type === 'percent' ? `${t.bonus}%` : `${t.bonus}€`}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
