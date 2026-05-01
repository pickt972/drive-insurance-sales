import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { supabase } from '@/integrations/supabase/client';
import {
  FileText,
  Download,
  BarChart3,
  TrendingUp,
  Users,
  Calendar,
  Award,
  Wallet,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

type BaseType = 'sales_amount' | 'sales_count' | 'commission';
type CalculationMode = 'highest' | 'cumulative';
type BonusType = 'fixed' | 'percent';

interface Tier {
  threshold: number;
  bonus: number;
}

interface BonusRule {
  id: string;
  name: string;
  tiers: Tier[];
  base: BaseType;
  calculation_mode: CalculationMode;
  bonus_type: BonusType;
  min_achievement_percent: number | null;
  max_achievement_percent: number | null;
  bonus_percent: number | null;
  is_active: boolean;
}

interface AppliedRule {
  name: string;
  amount: number;
  detail: string;
}

interface EmployeeReport {
  userId: string;
  name: string;
  salesCount: number;
  totalAmount: number;
  totalCommission: number;
  recordedBonus: number; // bonus already saved in DB (paid/approved/pending)
  estimatedBonus: number; // computed live from active rules
  appliedRules: AppliedRule[];
  totalToPay: number; // commission + bonus
}

interface ReportStats {
  totalSales: number;
  totalAmount: number;
  totalCommission: number;
  totalBonus: number;
  totalToPay: number;
  topSeller: string;
  topSellerAmount: number;
}

function computeTierBonus(
  value: number,
  tiers: Tier[],
  mode: CalculationMode,
  bonusType: BonusType,
  baseValueForPercent: number,
): { bonus: number; tierHit: Tier | null } {
  const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
  const reached = sorted.filter(t => value >= t.threshold);
  if (reached.length === 0) return { bonus: 0, tierHit: null };
  const toAmount = (raw: number) =>
    bonusType === 'percent' ? (baseValueForPercent * raw) / 100 : raw;
  if (mode === 'cumulative') {
    const total = reached.reduce((sum, t) => sum + toAmount(t.bonus), 0);
    return { bonus: total, tierHit: reached[reached.length - 1] };
  }
  const top = reached[reached.length - 1];
  return { bonus: toAmount(top.bonus), tierHit: top };
}

export function AdminReportsPage() {
  const [period, setPeriod] = useState('current');
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [employeeReports, setEmployeeReports] = useState<EmployeeReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'current':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getPeriodDates();
      const startStr = start.toISOString().split('T')[0];
      const endStr = end.toISOString().split('T')[0];

      // Parallel fetch
      const [salesRes, rulesRes, bonusesRes] = await Promise.all([
        (supabase as any)
          .from('insurance_sales')
          .select('*, profiles!insurance_sales_user_id_fkey(full_name)')
          .gte('sale_date', startStr)
          .lte('sale_date', endStr),
        (supabase as any).from('bonus_rules').select('*').eq('is_active', true),
        (supabase as any)
          .from('bonuses')
          .select('user_id, bonus_amount, period_start, period_end, status')
          .lte('period_start', endStr)
          .gte('period_end', startStr),
      ]);

      if (salesRes.error) throw salesRes.error;

      const salesArray = salesRes.data || [];
      const rules: BonusRule[] = (rulesRes.data || []).map((r: any) => ({
        ...r,
        tiers: Array.isArray(r.tiers) ? r.tiers : [],
        base: r.base || 'sales_amount',
        calculation_mode: r.calculation_mode || 'highest',
        bonus_type: r.bonus_type || 'fixed',
      }));
      const recordedBonuses = bonusesRes.data || [];

      // Aggregate per employee
      const byUser: Record<string, EmployeeReport> = {};
      salesArray.forEach((sale: any) => {
        const uid = sale.user_id || 'unknown';
        const name = sale.profiles?.full_name || 'Inconnu';
        if (!byUser[uid]) {
          byUser[uid] = {
            userId: uid,
            name,
            salesCount: 0,
            totalAmount: 0,
            totalCommission: 0,
            recordedBonus: 0,
            estimatedBonus: 0,
            appliedRules: [],
            totalToPay: 0,
          };
        }
        byUser[uid].salesCount += 1;
        byUser[uid].totalAmount += Number(sale.amount || 0);
        byUser[uid].totalCommission += Number(sale.commission_amount || 0);
      });

      // Recorded bonuses sum per user
      recordedBonuses.forEach((b: any) => {
        if (byUser[b.user_id]) {
          byUser[b.user_id].recordedBonus += Number(b.bonus_amount || 0);
        }
      });

      // Live bonus estimation per user from active rules
      Object.values(byUser).forEach(emp => {
        for (const rule of rules) {
          if (!rule.tiers || rule.tiers.length === 0) continue;
          const measured =
            rule.base === 'sales_count' ? emp.salesCount :
            rule.base === 'commission' ? emp.totalCommission :
            emp.totalAmount;
          const baseForPct =
            rule.base === 'sales_count' ? emp.totalCommission : measured;
          const { bonus, tierHit } = computeTierBonus(
            measured,
            rule.tiers,
            rule.calculation_mode,
            rule.bonus_type,
            baseForPct,
          );
          if (tierHit && bonus > 0) {
            emp.estimatedBonus += bonus;
            emp.appliedRules.push({
              name: rule.name,
              amount: bonus,
              detail: `palier ${tierHit.threshold} → ${rule.bonus_type === 'percent' ? tierHit.bonus + '%' : tierHit.bonus + ' €'}`,
            });
          }
        }
        // total to pay = commission + best of (recorded vs estimated) bonus
        const effectiveBonus = Math.max(emp.recordedBonus, emp.estimatedBonus);
        emp.totalToPay = emp.totalCommission + effectiveBonus;
      });

      const reports = Object.values(byUser).sort((a, b) => b.totalToPay - a.totalToPay);
      setEmployeeReports(reports);

      const totalAmount = reports.reduce((s, r) => s + r.totalAmount, 0);
      const totalCommission = reports.reduce((s, r) => s + r.totalCommission, 0);
      const totalBonus = reports.reduce((s, r) => s + Math.max(r.recordedBonus, r.estimatedBonus), 0);
      const totalToPay = reports.reduce((s, r) => s + r.totalToPay, 0);
      const top = reports.slice().sort((a, b) => b.totalAmount - a.totalAmount)[0];

      setStats({
        totalSales: salesArray.length,
        totalAmount,
        totalCommission,
        totalBonus,
        totalToPay,
        topSeller: top?.name || 'N/A',
        topSellerAmount: top?.totalAmount || 0,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const headers = [
        'Employé',
        'Nb ventes',
        'CA (€)',
        'Commission (€)',
        'Bonus enregistré (€)',
        'Bonus estimé (€)',
        'Bonus retenu (€)',
        'Total à verser (€)',
        'Règles appliquées',
      ];
      const rows = employeeReports.map(r => {
        const effectiveBonus = Math.max(r.recordedBonus, r.estimatedBonus);
        return [
          r.name,
          r.salesCount,
          r.totalAmount.toFixed(2),
          r.totalCommission.toFixed(2),
          r.recordedBonus.toFixed(2),
          r.estimatedBonus.toFixed(2),
          effectiveBonus.toFixed(2),
          r.totalToPay.toFixed(2),
          r.appliedRules.map(a => `${a.name} (+${a.amount.toFixed(2)}€)`).join(' | '),
        ];
      });
      const csv = [headers, ...rows]
        .map(row => row.map(c => `"${String(c).replace(/"/g, '""')}"`).join(','))
        .join('\n');
      const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-detaille-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();

      toast({ title: '✅ Export réussi', description: 'Le rapport a été téléchargé' });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: "Impossible d'exporter le rapport",
        variant: 'destructive',
      });
    }
  };

  const { start, end } = getPeriodDates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h2 className="text-3xl font-bold text-foreground">Rapports détaillés</h2>
          <p className="text-muted-foreground">Suivi par employé : ventes, commissions, primes & total à verser</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mois en cours</SelectItem>
              <SelectItem value="last">Mois dernier</SelectItem>
              <SelectItem value="last3">3 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} className="bg-success hover:bg-success/90 text-success-foreground">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Période : {format(start, 'dd MMMM yyyy', { locale: fr })} - {format(end, 'dd MMMM yyyy', { locale: fr })}
          </CardTitle>
          <CardDescription>Synthèse globale</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-primary/10">
                      <BarChart3 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Ventes</p>
                      <p className="text-2xl font-bold">{stats.totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-info/10">
                      <TrendingUp className="h-5 w-5 text-info" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">CA total</p>
                      <p className="text-2xl font-bold">{stats.totalAmount.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-secondary/10">
                      <TrendingUp className="h-5 w-5 text-secondary-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Commissions</p>
                      <p className="text-2xl font-bold">{stats.totalCommission.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-warning/10">
                      <Award className="h-5 w-5 text-warning" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Bonus / Primes</p>
                      <p className="text-2xl font-bold">{stats.totalBonus.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-success/40 bg-success/5">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-full bg-success/20">
                      <Wallet className="h-5 w-5 text-success" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Total à verser</p>
                      <p className="text-2xl font-bold text-success">{stats.totalToPay.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">Aucune donnée disponible</div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Détail par employé
          </CardTitle>
          <CardDescription>
            Cliquez sur une ligne pour voir le détail des bonus appliqués
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Chargement...</div>
          ) : employeeReports.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Aucune vente sur la période</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-center">Ventes</TableHead>
                    <TableHead className="text-right">CA</TableHead>
                    <TableHead className="text-right">Commission</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead className="text-right font-bold">Total à verser</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {employeeReports.map(emp => {
                    const effectiveBonus = Math.max(emp.recordedBonus, emp.estimatedBonus);
                    const isOpen = !!expanded[emp.userId];
                    return (
                      <>
                        <TableRow
                          key={emp.userId}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => setExpanded(prev => ({ ...prev, [emp.userId]: !prev[emp.userId] }))}
                        >
                          <TableCell>
                            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                          </TableCell>
                          <TableCell className="font-medium">{emp.name}</TableCell>
                          <TableCell className="text-center">{emp.salesCount}</TableCell>
                          <TableCell className="text-right">{emp.totalAmount.toFixed(2)} €</TableCell>
                          <TableCell className="text-right">{emp.totalCommission.toFixed(2)} €</TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <span>{effectiveBonus.toFixed(2)} €</span>
                              {emp.estimatedBonus > emp.recordedBonus && emp.estimatedBonus > 0 && (
                                <Badge variant="outline" className="text-xs">estimé</Badge>
                              )}
                              {emp.recordedBonus > 0 && emp.recordedBonus >= emp.estimatedBonus && (
                                <Badge className="text-xs bg-success">enregistré</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-bold text-success">
                            {emp.totalToPay.toFixed(2)} €
                          </TableCell>
                        </TableRow>
                        {isOpen && (
                          <TableRow key={emp.userId + '-detail'} className="bg-muted/30">
                            <TableCell colSpan={7}>
                              <div className="p-3 space-y-2 text-sm">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div>
                                    <p className="font-semibold mb-1">💰 Décomposition</p>
                                    <ul className="space-y-1 text-muted-foreground">
                                      <li>Commission sur ventes : <span className="font-medium text-foreground">{emp.totalCommission.toFixed(2)} €</span></li>
                                      <li>Bonus enregistré (DB) : <span className="font-medium text-foreground">{emp.recordedBonus.toFixed(2)} €</span></li>
                                      <li>Bonus estimé (règles actives) : <span className="font-medium text-foreground">{emp.estimatedBonus.toFixed(2)} €</span></li>
                                      <li className="pt-1 border-t">
                                        <strong className="text-success">Total à verser : {emp.totalToPay.toFixed(2)} €</strong>
                                      </li>
                                    </ul>
                                  </div>
                                  <div>
                                    <p className="font-semibold mb-1">🎯 Règles de bonus appliquées</p>
                                    {emp.appliedRules.length === 0 ? (
                                      <p className="text-muted-foreground italic">Aucune règle déclenchée sur cette période</p>
                                    ) : (
                                      <ul className="space-y-1">
                                        {emp.appliedRules.map((r, i) => (
                                          <li key={i} className="flex items-center justify-between gap-2">
                                            <span className="text-muted-foreground">
                                              <Badge variant="outline" className="mr-2">{r.name}</Badge>
                                              {r.detail}
                                            </span>
                                            <span className="font-semibold text-warning">+{r.amount.toFixed(2)} €</span>
                                          </li>
                                        ))}
                                      </ul>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
