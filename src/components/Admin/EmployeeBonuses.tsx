import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectSeparator,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, DollarSign, CheckCircle, Clock, XCircle, Eye, Calculator, FileDown, Loader2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportBonusesPDF } from '@/utils/pdfExport';

interface Bonus {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_sales: number | null;
  total_amount: number | null;
  total_commission: number | null;
  achievement_percent: number | null;
  bonus_rate: number | null;
  bonus_amount: number | null;
  status: string | null;
  notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  paid_at: string | null;
  created_at: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

interface Tier {
  threshold: number;
  bonus: number;
}

type BaseType = 'sales_amount' | 'sales_count' | 'commission';
type CalculationMode = 'highest' | 'cumulative';
type BonusType = 'fixed' | 'percent';

interface BonusRule {
  id: string;
  name: string;
  description?: string | null;
  // Legacy fields (still in DB)
  min_achievement_percent: number | null;
  max_achievement_percent: number | null;
  bonus_percent: number | null;
  // New tier-based system
  tiers: Tier[];
  base: BaseType;
  calculation_mode: CalculationMode;
  bonus_type: BonusType;
  is_active: boolean;
}

const BASE_LABEL: Record<BaseType, string> = {
  sales_amount: 'CA (€)',
  sales_count: 'Nb ventes',
  commission: 'Commission (€)',
};

// Compute bonus from tiers based on a measured value (CA, count, or commission)
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
  // highest
  const top = reached[reached.length - 1];
  return { bonus: toAmount(top.bonus), tierHit: top };
}

type PeriodType = 'monthly' | 'quarterly' | 'yearly' | 'other';

const detectPeriodType = (start: string, end: string): PeriodType => {
  const s = new Date(start);
  const e = new Date(end);
  const days = Math.round((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24)) + 1;
  if (days >= 28 && days <= 31) return 'monthly';
  if (days >= 89 && days <= 92) return 'quarterly';
  if (days >= 360 && days <= 366) return 'yearly';
  return 'other';
};

const PERIOD_LABEL: Record<PeriodType, string> = {
  monthly: 'Mensuel',
  quarterly: 'Trimestriel',
  yearly: 'Annuel',
  other: 'Autre',
};

export function EmployeeBonuses() {
  const { toast } = useToast();
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [periodFilter, setPeriodFilter] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [ruleStatusFilter, setRuleStatusFilter] = useState<string>('active');
  const [formData, setFormData] = useState({
    user_id: '',
    period_start: '',
    period_end: '',
    total_sales: '',
    total_amount: '',
    total_commission: '',
    achievement_percent: '',
    bonus_rate: '',
    bonus_amount: '',
    notes: '',
  });

  useEffect(() => {
    fetchBonuses();
    fetchProfiles();
    fetchBonusRules();
  }, []);

  const fetchBonuses = async () => {
    try {
      const { data, error } = await supabase
        .from('bonuses')
        .select(`
          *,
          profiles!bonuses_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBonuses(data as Bonus[] || []);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'user')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const fetchBonusRules = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('bonus_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalized: BonusRule[] = (data || []).map((r: any) => ({
        ...r,
        tiers: Array.isArray(r.tiers) ? r.tiers : [],
        base: r.base || 'sales_amount',
        calculation_mode: r.calculation_mode || 'highest',
        bonus_type: r.bonus_type || 'fixed',
      }));
      setBonusRules(normalized);
    } catch (error) {
      console.error('Error fetching bonus rules:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      period_start: '',
      period_end: '',
      total_sales: '',
      total_amount: '',
      total_commission: '',
      achievement_percent: '',
      bonus_rate: '',
      bonus_amount: '',
      notes: '',
    });
  };

  // Calculate bonus automatically based on sales and objectives
  const calculateBonus = async () => {
    if (!formData.user_id || !formData.period_start || !formData.period_end) {
      toast({
        title: 'Information manquante',
        description: 'Veuillez sélectionner un employé et une période',
        variant: 'destructive',
      });
      return;
    }

    setCalculating(true);

    try {
      // Fetch sales for the selected period
      const { data: sales, error: salesError } = await supabase
        .from('insurance_sales')
        .select('amount, commission_amount')
        .eq('user_id', formData.user_id)
        .gte('sale_date', formData.period_start)
        .lte('sale_date', formData.period_end);

      if (salesError) throw salesError;

      const totalSales = sales?.length || 0;
      const totalAmount = sales?.reduce((sum, s) => sum + (s.amount || 0), 0) || 0;
      const totalCommission = sales?.reduce((sum, s) => sum + (s.commission_amount || 0), 0) || 0;

      // Fetch objective for the period
      const { data: objectives, error: objError } = await supabase
        .from('employee_objectives')
        .select('target_amount, target_sales_count')
        .eq('user_id', formData.user_id)
        .eq('is_active', true)
        .lte('period_start', formData.period_end)
        .gte('period_end', formData.period_start)
        .maybeSingle();

      if (objError) throw objError;

      // Calculate achievement percentage
      let achievementPercent = 0;
      if (objectives?.target_amount && objectives.target_amount > 0) {
        achievementPercent = (totalAmount / objectives.target_amount) * 100;
      } else if (objectives?.target_sales_count && objectives.target_sales_count > 0) {
        achievementPercent = (totalSales / objectives.target_sales_count) * 100;
      } else {
        // No objective found, use 100% as default
        achievementPercent = 100;
      }

      // Find applicable bonus rule (new tier-based system + legacy fallback)
      let bonusRate = 0;
      let bonusAmount = 0;
      const appliedRules: string[] = [];

      for (const rule of bonusRules.filter(r => r.is_active)) {
        // New tier-based system
        if (rule.tiers && rule.tiers.length > 0) {
          const measured =
            rule.base === 'sales_count' ? totalSales :
            rule.base === 'commission' ? totalCommission :
            totalAmount;
          const baseForPct =
            rule.base === 'sales_count' ? totalCommission : measured;
          const { bonus, tierHit } = computeTierBonus(
            measured,
            rule.tiers,
            rule.calculation_mode,
            rule.bonus_type,
            baseForPct,
          );
          if (tierHit) {
            bonusAmount += bonus;
            appliedRules.push(`${rule.name} (+${bonus.toFixed(2)} €)`);
          }
        } else if (rule.min_achievement_percent !== null && rule.bonus_percent !== null) {
          // Legacy %-of-objective rule
          const minOk = achievementPercent >= rule.min_achievement_percent;
          const maxOk = rule.max_achievement_percent === null || achievementPercent < rule.max_achievement_percent;
          if (minOk && maxOk) {
            bonusRate = rule.bonus_percent;
            const legacy = totalCommission * (bonusRate / 100);
            bonusAmount += legacy;
            appliedRules.push(`${rule.name} (${bonusRate}% → ${legacy.toFixed(2)} €)`);
          }
        }
      }

      // Update form with calculated values
      setFormData(prev => ({
        ...prev,
        total_sales: totalSales.toString(),
        total_amount: totalAmount.toFixed(2),
        total_commission: totalCommission.toFixed(2),
        achievement_percent: achievementPercent.toFixed(2),
        bonus_rate: bonusRate.toString(),
        bonus_amount: bonusAmount.toFixed(2),
        notes: appliedRules.length
          ? `Règles appliquées: ${appliedRules.join(' • ')}`
          : prev.notes,
      }));

      toast({
        title: 'Calcul effectué',
        description: `${totalSales} ventes • ${totalAmount.toFixed(2)} € CA → Prime totale: ${bonusAmount.toFixed(2)} €`,
      });
    } catch (error) {
      console.error('Error calculating bonus:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de calculer la prime',
        variant: 'destructive',
      });
    } finally {
      setCalculating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bonusData = {
        user_id: formData.user_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        total_sales: formData.total_sales ? parseInt(formData.total_sales) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        total_commission: formData.total_commission ? parseFloat(formData.total_commission) : null,
        achievement_percent: formData.achievement_percent ? parseFloat(formData.achievement_percent) : null,
        bonus_rate: formData.bonus_rate ? parseFloat(formData.bonus_rate) : null,
        bonus_amount: formData.bonus_amount ? parseFloat(formData.bonus_amount) : null,
        notes: formData.notes || null,
        status: 'pending',
      };

      const { error } = await supabase
        .from('bonuses')
        .insert([bonusData]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Prime créée avec succès',
      });

      await fetchBonuses();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating bonus:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la prime',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBonusStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'approved') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      } else if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bonuses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Statut mis à jour: ${getStatusLabel(newStatus)}`,
      });

      await fetchBonuses();
    } catch (error) {
      console.error('Error updating bonus status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const handleExportPDF = () => {
    const exportData = filteredBonuses.map(bonus => ({
      employeeName: bonus.profiles?.full_name || 'N/A',
      periodStart: bonus.period_start,
      periodEnd: bonus.period_end,
      totalSales: bonus.total_sales,
      totalAmount: bonus.total_amount,
      totalCommission: bonus.total_commission,
      achievementPercent: bonus.achievement_percent,
      bonusRate: bonus.bonus_rate,
      bonusAmount: bonus.bonus_amount,
      status: bonus.status,
    }));

    exportBonusesPDF(exportData, 'Rapport des Primes');
    
    toast({
      title: 'Export réussi',
      description: 'Le rapport PDF a été téléchargé',
    });
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'paid': return 'Payée';
      case 'rejected': return 'Refusée';
      default: return 'Inconnu';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> En attente</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-info"><CheckCircle className="h-3 w-3" /> Approuvée</Badge>;
      case 'paid':
        return <Badge className="gap-1 bg-success"><DollarSign className="h-3 w-3" /> Payée</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Refusée</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const filteredBonuses = bonuses.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (periodFilter !== 'all' && detectPeriodType(b.period_start, b.period_end) !== periodFilter) return false;
    return true;
  });

  const filteredRules = bonusRules.filter(r => {
    if (ruleStatusFilter === 'all') return true;
    return ruleStatusFilter === 'active' ? r.is_active : !r.is_active;
  });

  const totalPending = bonuses.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
  const totalApproved = bonuses.filter(b => b.status === 'approved').reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
  const totalPaid = bonuses.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.bonus_amount || 0), 0);

  // === Récapitulatif mensuel par employé ===
  // Build a list of available YYYY-MM keys derived from bonus period_start
  const monthKeys = Array.from(
    new Set(filteredBonuses.map(b => b.period_start.slice(0, 7)))
  ).sort((a, b) => b.localeCompare(a));

  const monthlyByEmployee = (() => {
    const map = new Map<string, { name: string; total: number; count: number; ca: number }>();
    filteredBonuses.forEach(b => {
      if (selectedMonth !== 'all' && b.period_start.slice(0, 7) !== selectedMonth) return;
      const key = b.user_id;
      const cur = map.get(key) || {
        name: b.profiles?.full_name || 'N/A',
        total: 0,
        count: 0,
        ca: 0,
      };
      cur.total += b.bonus_amount || 0;
      cur.ca += b.total_amount || 0;
      cur.count += 1;
      map.set(key, cur);
    });
    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  })();

  const monthlyGrandTotal = monthlyByEmployee.reduce((s, r) => s + r.total, 0);

  const formatMonthLabel = (key: string) => {
    const [y, m] = key.split('-');
    return format(new Date(parseInt(y), parseInt(m) - 1, 1), 'MMMM yyyy', { locale: fr });
  };

  const toMonthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  const now = new Date();
  const currentMonthKey = toMonthKey(now);
  const lastMonthKey = toMonthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));
  const otherMonthKeys = monthKeys.filter(k => k !== currentMonthKey && k !== lastMonthKey);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{totalPending.toFixed(2)} €</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvées</p>
                <p className="text-2xl font-bold text-info">{totalApproved.toFixed(2)} €</p>
              </div>
              <CheckCircle className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payées</p>
                <p className="text-2xl font-bold text-success">{totalPaid.toFixed(2)} €</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Récapitulatif mensuel par employé */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Récapitulatif des primes par employé</CardTitle>
              <CardDescription>
                Total : <span className="font-semibold text-success">{monthlyGrandTotal.toFixed(2)} €</span>
                {selectedMonth !== 'all' && ` · ${formatMonthLabel(selectedMonth)}`}
              </CardDescription>
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Mois" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les mois</SelectItem>
                <SelectItem value={currentMonthKey}>Mois en cours ({formatMonthLabel(currentMonthKey)})</SelectItem>
                <SelectItem value={lastMonthKey}>Mois dernier ({formatMonthLabel(lastMonthKey)})</SelectItem>
                {otherMonthKeys.length > 0 && <SelectSeparator />}
                {otherMonthKeys.map(k => (
                  <SelectItem key={k} value={k}>{formatMonthLabel(k)}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {monthlyByEmployee.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Aucune prime sur cette période
            </p>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead className="text-right">Primes</TableHead>
                    <TableHead className="text-right">CA total</TableHead>
                    <TableHead className="text-right">Total prime</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {monthlyByEmployee.map((row, i) => (
                    <TableRow key={i}>
                      <TableCell className="font-medium">{row.name}</TableCell>
                      <TableCell className="text-right">{row.count}</TableCell>
                      <TableCell className="text-right">{row.ca.toFixed(2)} €</TableCell>
                      <TableCell className="text-right font-bold text-success">
                        {row.total.toFixed(2)} €
                      </TableCell>
                    </TableRow>
                  ))}
                  <TableRow className="bg-muted/50 font-semibold">
                    <TableCell>Total</TableCell>
                    <TableCell className="text-right">
                      {monthlyByEmployee.reduce((s, r) => s + r.count, 0)}
                    </TableCell>
                    <TableCell className="text-right">
                      {monthlyByEmployee.reduce((s, r) => s + r.ca, 0).toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right text-success">
                      {monthlyGrandTotal.toFixed(2)} €
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Bonus Rules summary with active/inactive filter */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <CardTitle className="text-base">Règles de prime appliquées</CardTitle>
              <CardDescription>
                {bonusRules.filter(r => r.is_active).length} active(s) · {bonusRules.filter(r => !r.is_active).length} inactive(s)
              </CardDescription>
            </div>
            <Select value={ruleStatusFilter} onValueChange={setRuleStatusFilter}>
              <SelectTrigger className="w-[160px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes</SelectItem>
                <SelectItem value="active">Actives uniquement</SelectItem>
                <SelectItem value="inactive">Inactives uniquement</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {filteredRules.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Aucune règle à afficher</p>
          ) : (
            <div className="space-y-3">
              {filteredRules.map(rule => {
                const sortedTiers = [...(rule.tiers || [])].sort((a, b) => a.threshold - b.threshold);
                const unit = rule.base === 'sales_count' ? '' : ' €';
                const bUnit = rule.bonus_type === 'percent' ? ' %' : ' €';
                return (
                  <div
                    key={rule.id}
                    className={`rounded-lg border p-3 ${rule.is_active ? 'bg-card' : 'bg-muted/30 opacity-70'}`}
                  >
                    <div className="flex items-center justify-between flex-wrap gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <Badge variant={rule.is_active ? 'default' : 'outline'}>{rule.name}</Badge>
                        <span className="text-xs text-muted-foreground">
                          Base: {BASE_LABEL[rule.base]} · Mode: {rule.calculation_mode === 'cumulative' ? 'Cumulatif' : 'Plus haut palier'}
                        </span>
                      </div>
                      {!rule.is_active && <span className="text-[10px] text-muted-foreground">(inactif)</span>}
                    </div>
                    {sortedTiers.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic">Aucun palier configuré</p>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sortedTiers.map((t, i) => (
                          <Badge key={i} variant="secondary" className="font-mono text-xs">
                            ≥ {t.threshold}{unit} → +{t.bonus}{bUnit}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Main Card */}
      <Card className="modern-card animate-gentle-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-success/5">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Primes des employés</CardTitle>
                <CardDescription>
                  Suivi et gestion des primes versées aux employés
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous statuts</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvées</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                  <SelectItem value="rejected">Refusées</SelectItem>
                </SelectContent>
              </Select>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes périodes</SelectItem>
                  <SelectItem value="monthly">Mensuel</SelectItem>
                  <SelectItem value="quarterly">Trimestriel</SelectItem>
                  <SelectItem value="yearly">Annuel</SelectItem>
                  <SelectItem value="other">Autre</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={handleExportPDF} disabled={filteredBonuses.length === 0}>
                <FileDown className="mr-2 h-4 w-4" />
                Export PDF
              </Button>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()} className="modern-button">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouvelle prime
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>Nouvelle prime</DialogTitle>
                      <DialogDescription>
                        Créer une prime pour un employé
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="space-y-2">
                        <Label>Employé <span className="text-destructive">*</span></Label>
                        <Select 
                          value={formData.user_id} 
                          onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un employé" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Début période <span className="text-destructive">*</span></Label>
                          <Input
                            type="date"
                            value={formData.period_start}
                            onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fin période <span className="text-destructive">*</span></Label>
                          <Input
                            type="date"
                            value={formData.period_end}
                            onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      {/* Auto-calculate button */}
                      <Button
                        type="button"
                        variant="secondary"
                        onClick={calculateBonus}
                        disabled={calculating || !formData.user_id || !formData.period_start || !formData.period_end}
                        className="w-full"
                      >
                        {calculating ? (
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                          <Calculator className="mr-2 h-4 w-4" />
                        )}
                        Calculer automatiquement
                      </Button>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nb ventes</Label>
                          <Input
                            type="number"
                            value={formData.total_sales}
                            onChange={(e) => setFormData({ ...formData, total_sales: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CA total (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.total_amount}
                            onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Commission (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.total_commission}
                            onChange={(e) => setFormData({ ...formData, total_commission: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Atteinte objectif (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.achievement_percent}
                            onChange={(e) => setFormData({ ...formData, achievement_percent: e.target.value })}
                            placeholder="100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Taux bonus (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.bonus_rate}
                            onChange={(e) => setFormData({ ...formData, bonus_rate: e.target.value })}
                            placeholder="0"
                            className="bg-muted/50"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Montant prime (€) <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.bonus_amount}
                            onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                            placeholder="0.00"
                            required
                            className="bg-success/10 border-success/30"
                          />
                        </div>
                      </div>

                      {/* Preview of applied rule */}
                      {formData.achievement_percent && formData.bonus_rate && (
                        <div className="rounded-lg bg-muted/50 p-3 text-sm">
                          <p className="font-medium text-foreground">
                            Règle appliquée : {formData.bonus_rate}% sur commission
                          </p>
                          <p className="text-muted-foreground">
                            {formData.total_commission} € × {formData.bonus_rate}% = {formData.bonus_amount} €
                          </p>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Commentaires..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={loading} className="modern-button">
                        {loading ? 'Création...' : 'Créer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredBonuses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Aucune prime trouvée</p>
              <p className="text-sm text-muted-foreground">
                Créez une nouvelle prime pour commencer
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Atteinte</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonuses.map((bonus) => (
                    <TableRow key={bonus.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {bonus.profiles?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        <div className="flex flex-col gap-1">
                          <span>{format(new Date(bonus.period_start), 'dd/MM/yy', { locale: fr })} - {format(new Date(bonus.period_end), 'dd/MM/yy', { locale: fr })}</span>
                          <Badge variant="secondary" className="w-fit text-[10px] py-0 px-1.5">
                            {PERIOD_LABEL[detectPeriodType(bonus.period_start, bonus.period_end)]}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {bonus.bonus_amount?.toFixed(2) || '0.00'} €
                      </TableCell>
                      <TableCell className="text-right">
                        {bonus.achievement_percent ? (
                          <Badge variant="outline" className="font-mono">
                            {bonus.achievement_percent.toFixed(0)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(bonus.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedBonus(bonus)}
                            className="hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bonus.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateBonusStatus(bonus.id, 'approved')}
                                className="text-info hover:bg-info/10"
                              >
                                Approuver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateBonusStatus(bonus.id, 'rejected')}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                Refuser
                              </Button>
                            </>
                          )}
                          {bonus.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateBonusStatus(bonus.id, 'paid')}
                              className="text-success hover:bg-success/10"
                            >
                              Marquer payée
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBonus} onOpenChange={() => setSelectedBonus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la prime</DialogTitle>
          </DialogHeader>
          {selectedBonus && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Employé</Label>
                  <p className="font-medium">{selectedBonus.profiles?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedBonus.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Période</Label>
                  <p>{format(new Date(selectedBonus.period_start), 'dd/MM/yyyy', { locale: fr })} - {format(new Date(selectedBonus.period_end), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant prime</Label>
                  <p className="text-xl font-bold text-success">{selectedBonus.bonus_amount?.toFixed(2)} €</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ventes</Label>
                  <p>{selectedBonus.total_sales || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CA</Label>
                  <p>{selectedBonus.total_amount?.toFixed(2) || '-'} €</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Commission</Label>
                  <p>{selectedBonus.total_commission?.toFixed(2) || '-'} €</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Atteinte objectif</Label>
                  <p>{selectedBonus.achievement_percent?.toFixed(0) || '-'}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Taux bonus</Label>
                  <p>{selectedBonus.bonus_rate?.toFixed(0) || '-'}%</p>
                </div>
              </div>
              {selectedBonus.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedBonus.notes}</p>
                </div>
              )}
              {selectedBonus.approved_at && (
                <div>
                  <Label className="text-muted-foreground">Approuvée le</Label>
                  <p className="text-sm">{format(new Date(selectedBonus.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
              )}
              {selectedBonus.paid_at && (
                <div>
                  <Label className="text-muted-foreground">Payée le</Label>
                  <p className="text-sm">{format(new Date(selectedBonus.paid_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
