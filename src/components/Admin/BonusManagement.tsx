import { useState, useEffect, useMemo } from 'react';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Award, Edit, Trash2, TrendingUp, X, Plus, Euro, Hash, Percent, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  description: string | null;
  base: BaseType;
  calculation_mode: CalculationMode;
  bonus_type: BonusType;
  tiers: Tier[];
  is_active: boolean;
  created_at: string;
}

const BASE_LABELS: Record<BaseType, { label: string; unit: string; icon: React.ElementType }> = {
  sales_amount: { label: 'Montant des ventes (CA)', unit: '€', icon: Euro },
  sales_count: { label: 'Nombre de ventes', unit: 'ventes', icon: Hash },
  commission: { label: 'Total des commissions', unit: '€', icon: Euro },
};

export function BonusManagement() {
  const { toast } = useToast();
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    base: 'sales_amount' as BaseType,
    calculation_mode: 'highest' as CalculationMode,
    bonus_type: 'fixed' as BonusType,
    is_active: true,
  });
  const [tiers, setTiers] = useState<Tier[]>([
    { threshold: 100, bonus: 50 },
    { threshold: 200, bonus: 75 },
  ]);
  const [simulationValue, setSimulationValue] = useState('150');

  useEffect(() => {
    fetchBonusRules();
  }, []);

  const fetchBonusRules = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('bonus_rules')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      const normalized = (data || []).map((r: any) => ({
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
      name: '',
      description: '',
      base: 'sales_amount',
      calculation_mode: 'highest',
      bonus_type: 'fixed',
      is_active: true,
    });
    setTiers([
      { threshold: 100, bonus: 50 },
      { threshold: 200, bonus: 75 },
    ]);
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: BonusRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        description: rule.description || '',
        base: rule.base,
        calculation_mode: rule.calculation_mode,
        bonus_type: rule.bonus_type,
        is_active: rule.is_active,
      });
      setTiers(rule.tiers.length ? [...rule.tiers] : [{ threshold: 0, bonus: 0 }]);
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const addTier = () => {
    const last = tiers[tiers.length - 1];
    setTiers([...tiers, { threshold: (last?.threshold || 0) + 100, bonus: (last?.bonus || 0) + 25 }]);
  };

  const removeTier = (idx: number) => {
    if (tiers.length === 1) return;
    setTiers(tiers.filter((_, i) => i !== idx));
  };

  const updateTier = (idx: number, field: 'threshold' | 'bonus', value: string) => {
    // Autorise champ vide et supprime les zéros initiaux
    const cleaned = value.replace(/^0+(?=\d)/, '');
    const num = cleaned === '' ? 0 : parseFloat(cleaned);
    setTiers(tiers.map((t, i) => (i === idx ? { ...t, [field]: isNaN(num) ? 0 : num } : t)));
  };

  // Calcul de la simulation
  const simulationResult = useMemo(() => {
    const value = parseFloat(simulationValue) || 0;
    const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);

    if (formData.calculation_mode === 'highest') {
      const reached = sorted.filter(t => value >= t.threshold);
      const top = reached[reached.length - 1];
      return top ? top.bonus : 0;
    } else {
      // cumulative
      return sorted.filter(t => value >= t.threshold).reduce((sum, t) => sum + t.bonus, 0);
    }
  }, [simulationValue, tiers, formData.calculation_mode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const sorted = [...tiers].sort((a, b) => a.threshold - b.threshold);
      const ruleData: any = {
        name: formData.name,
        description: formData.description || null,
        base: formData.base,
        calculation_mode: formData.calculation_mode,
        bonus_type: formData.bonus_type,
        tiers: sorted,
        is_active: formData.is_active,
        // Legacy fields for backward compatibility
        min_achievement_percent: sorted[0]?.threshold || 0,
        bonus_percent: sorted[0]?.bonus || 0,
      };

      if (editingRule) {
        const { error } = await (supabase as any)
          .from('bonus_rules')
          .update(ruleData)
          .eq('id', editingRule.id);
        if (error) throw error;
        toast({ title: '✅ Règle modifiée' });
      } else {
        const { error } = await (supabase as any)
          .from('bonus_rules')
          .insert([ruleData]);
        if (error) throw error;
        toast({ title: '✅ Règle créée' });
      }

      await fetchBonusRules();
      setIsDialogOpen(false);
      resetForm();
    } catch (error: any) {
      console.error('Error saving bonus rule:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de sauvegarder',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Supprimer la règle "${name}" ?`)) return;
    try {
      const { error } = await (supabase as any).from('bonus_rules').delete().eq('id', id);
      if (error) throw error;
      toast({ title: '✅ Règle supprimée' });
      await fetchBonusRules();
    } catch (error) {
      toast({ title: 'Erreur', description: 'Suppression impossible', variant: 'destructive' });
    }
  };

  const toggleActive = async (rule: BonusRule) => {
    try {
      const { error } = await (supabase as any)
        .from('bonus_rules')
        .update({ is_active: !rule.is_active })
        .eq('id', rule.id);
      if (error) throw error;
      await fetchBonusRules();
    } catch (e) {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const formatBonus = (bonus: number, type: BonusType) =>
    type === 'fixed' ? `+${bonus}€` : `+${bonus}%`;

  const formatThreshold = (val: number, base: BaseType) => {
    const cfg = BASE_LABELS[base];
    return `${val} ${cfg.unit}`;
  };

  return (
    <Card className="modern-card animate-gentle-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange/10 to-orange/5">
              <Award className="h-5 w-5 text-orange" />
            </div>
            <div>
              <CardTitle>Règles de primes par paliers</CardTitle>
              <CardDescription>
                Configurez des paliers personnalisés : ex. 100€ vendus → +50€, 200€ vendus → +75€
              </CardDescription>
            </div>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={() => handleOpenDialog()} className="modern-button">
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvelle règle
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Modifier la règle' : 'Nouvelle règle de prime'}
                  </DialogTitle>
                  <DialogDescription>
                    Définissez librement vos paliers et le mode de calcul
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-5 py-4">
                  {/* Nom + description */}
                  <div className="space-y-2">
                    <Label>Nom de la règle *</Label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Prime mensuelle CA"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Description (optionnelle)</Label>
                    <Textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="À quoi sert cette règle..."
                      rows={2}
                    />
                  </div>

                  {/* Paramétrage */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg bg-muted/30 border">
                    <div className="space-y-2">
                      <Label className="text-xs">Base de calcul *</Label>
                      <Select
                        value={formData.base}
                        onValueChange={(v) => setFormData({ ...formData, base: v as BaseType })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="sales_amount">💰 Montant des ventes (€)</SelectItem>
                          <SelectItem value="sales_count">🔢 Nombre de ventes</SelectItem>
                          <SelectItem value="commission">📊 Total commissions (€)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Type de bonus *</Label>
                      <Select
                        value={formData.bonus_type}
                        onValueChange={(v) => setFormData({ ...formData, bonus_type: v as BonusType })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="fixed">💶 Montant fixe (€)</SelectItem>
                          <SelectItem value="percent">% Pourcentage</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label className="text-xs">Mode de calcul *</Label>
                      <Select
                        value={formData.calculation_mode}
                        onValueChange={(v) => setFormData({ ...formData, calculation_mode: v as CalculationMode })}
                      >
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="highest">🏆 Palier le + élevé</SelectItem>
                          <SelectItem value="cumulative">➕ Cumul des paliers</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Paliers dynamiques */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-base font-semibold">Paliers de prime *</Label>
                      <Button type="button" variant="outline" size="sm" onClick={addTier}>
                        <Plus className="h-4 w-4 mr-1" /> Ajouter un palier
                      </Button>
                    </div>

                    <div className="space-y-2">
                      {tiers.map((tier, idx) => (
                        <div key={idx} className="flex items-center gap-2 p-3 rounded-lg border bg-card">
                          <Badge variant="outline" className="font-mono shrink-0">#{idx + 1}</Badge>
                          <div className="flex-1 grid grid-cols-2 gap-2 items-center">
                            <div>
                              <Label className="text-xs text-muted-foreground">Si {formData.base === 'sales_count' ? 'ventes' : 'CA'} ≥</Label>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={tier.threshold}
                                  onChange={(e) => updateTier(idx, 'threshold', e.target.value)}
                                  required
                                />
                                <span className="text-sm text-muted-foreground shrink-0">
                                  {BASE_LABELS[formData.base].unit}
                                </span>
                              </div>
                            </div>
                            <div>
                              <Label className="text-xs text-muted-foreground">Alors bonus =</Label>
                              <div className="flex items-center gap-1">
                                <Input
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  value={tier.bonus}
                                  onChange={(e) => updateTier(idx, 'bonus', e.target.value)}
                                  required
                                />
                                <span className="text-sm text-muted-foreground shrink-0">
                                  {formData.bonus_type === 'fixed' ? '€' : '%'}
                                </span>
                              </div>
                            </div>
                          </div>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            onClick={() => removeTier(idx)}
                            disabled={tiers.length === 1}
                            className="text-destructive shrink-0"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Simulation */}
                  <div className="rounded-lg border-2 border-dashed border-primary/30 p-4 bg-primary/5">
                    <div className="flex items-center gap-2 mb-3">
                      <Info className="h-4 w-4 text-primary" />
                      <Label className="font-semibold">Simulation</Label>
                    </div>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-sm">Si le vendeur réalise</span>
                      <Input
                        type="number"
                        value={simulationValue}
                        onChange={(e) => setSimulationValue(e.target.value)}
                        className="w-32"
                      />
                      <span className="text-sm">{BASE_LABELS[formData.base].unit}</span>
                      <span className="text-sm">→ il gagnera</span>
                      <Badge className="bg-gradient-to-r from-orange to-warning text-base px-3 py-1">
                        {formatBonus(simulationResult, formData.bonus_type)}
                      </Badge>
                    </div>
                  </div>
                </div>

                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} className="modern-button">
                    {loading ? 'Enregistrement...' : editingRule ? 'Enregistrer' : 'Créer la règle'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {bonusRules.length === 0 ? (
          <div className="text-center py-12">
            <Award className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-2">Aucune règle de prime configurée</p>
            <p className="text-sm text-muted-foreground">
              Créez votre première règle : ex. 100€ vendus → +50€ de prime
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {bonusRules.map((rule) => {
              const BaseIcon = BASE_LABELS[rule.base].icon;
              return (
                <div
                  key={rule.id}
                  className={`rounded-xl border-2 p-4 transition-all ${
                    rule.is_active ? 'bg-card hover:shadow-md' : 'bg-muted/30 opacity-60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-lg">{rule.name}</h3>
                        <Badge variant={rule.is_active ? 'default' : 'outline'}>
                          {rule.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                        <Badge variant="secondary" className="gap-1">
                          <BaseIcon className="h-3 w-3" />
                          {BASE_LABELS[rule.base].label}
                        </Badge>
                        <Badge variant="outline">
                          {rule.calculation_mode === 'highest' ? '🏆 Palier max' : '➕ Cumulatif'}
                        </Badge>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-muted-foreground mt-1">{rule.description}</p>
                      )}
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button variant="ghost" size="icon" onClick={() => toggleActive(rule)} title={rule.is_active ? 'Désactiver' : 'Activer'}>
                        <Percent className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(rule)} className="hover:bg-primary/10 hover:text-primary">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => handleDelete(rule.id, rule.name)} className="hover:bg-destructive/10 hover:text-destructive">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="rounded-lg border bg-muted/20 overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-12">#</TableHead>
                          <TableHead>Si atteint au moins</TableHead>
                          <TableHead className="text-right">Prime obtenue</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {rule.tiers.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={3} className="text-center text-muted-foreground text-sm py-4">
                              Aucun palier défini — éditez la règle pour en ajouter
                            </TableCell>
                          </TableRow>
                        ) : (
                          [...rule.tiers].sort((a, b) => a.threshold - b.threshold).map((tier, idx) => (
                            <TableRow key={idx}>
                              <TableCell><Badge variant="outline" className="font-mono">{idx + 1}</Badge></TableCell>
                              <TableCell className="font-medium">
                                {formatThreshold(tier.threshold, rule.base)}
                              </TableCell>
                              <TableCell className="text-right">
                                <Badge className="bg-gradient-to-r from-orange to-warning font-semibold">
                                  <TrendingUp className="h-3 w-3 mr-1" />
                                  {formatBonus(tier.bonus, rule.bonus_type)}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
