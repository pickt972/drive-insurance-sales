import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Award, Edit, Trash2, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';

interface BonusRule {
  id: string;
  name: string;
  min_achievement_percent: number;
  max_achievement_percent: number | null;
  bonus_percent: number;
  is_active: boolean;
  created_at: string;
}

export function BonusManagement() {
  const { toast } = useToast();
  const [bonusRules, setBonusRules] = useState<BonusRule[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<BonusRule | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    min_achievement_percent: '',
    max_achievement_percent: '',
    bonus_percent: '',
  });

  useEffect(() => {
    fetchBonusRules();
  }, []);

  const fetchBonusRules = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('bonus_rules')
        .select('*')
        .order('min_achievement_percent', { ascending: true });

      if (error) throw error;
      setBonusRules(data || []);
    } catch (error) {
      console.error('Error fetching bonus rules:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      min_achievement_percent: '',
      max_achievement_percent: '',
      bonus_percent: '',
    });
    setEditingRule(null);
  };

  const handleOpenDialog = (rule?: BonusRule) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        min_achievement_percent: rule.min_achievement_percent.toString(),
        max_achievement_percent: rule.max_achievement_percent?.toString() || '',
        bonus_percent: rule.bonus_percent.toString(),
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const ruleData = {
        name: formData.name,
        min_achievement_percent: parseFloat(formData.min_achievement_percent),
        max_achievement_percent: formData.max_achievement_percent 
          ? parseFloat(formData.max_achievement_percent) 
          : null,
        bonus_percent: parseFloat(formData.bonus_percent),
        is_active: true,
      };

      if (editingRule) {
        const { error } = await (supabase as any)
          .from('bonus_rules')
          .update(ruleData)
          .eq('id', editingRule.id);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Règle de bonus modifiée',
        });
      } else {
        const { error } = await (supabase as any)
          .from('bonus_rules')
          .insert([ruleData]);

        if (error) throw error;

        toast({
          title: 'Succès',
          description: 'Règle de bonus créée',
        });
      }

      await fetchBonusRules();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving bonus rule:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder la règle',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Confirmer la suppression de "${name}" ?`)) return;

    try {
      const { error } = await (supabase as any)
        .from('bonus_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Règle supprimée',
      });

      await fetchBonusRules();
    } catch (error) {
      console.error('Error deleting bonus rule:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer la règle',
        variant: 'destructive',
      });
    }
  };

  return (
    <Card className="modern-card animate-gentle-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange/10 to-orange/5">
              <Award className="h-5 w-5 text-orange" />
            </div>
            <div>
              <CardTitle>Gestion des primes et bonus</CardTitle>
              <CardDescription>
                Configurez les règles de calcul des primes selon les performances
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
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingRule ? 'Modifier la règle' : 'Nouvelle règle de bonus'}
                  </DialogTitle>
                  <DialogDescription>
                    Définissez les seuils et pourcentages de bonus
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nom de la règle <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: Bonus Bronze, Argent, Or..."
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="min">
                        Atteinte min (%) <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="min"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000"
                        value={formData.min_achievement_percent}
                        onChange={(e) => setFormData({ ...formData, min_achievement_percent: e.target.value })}
                        placeholder="Ex: 100"
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="max">Atteinte max (%)</Label>
                      <Input
                        id="max"
                        type="number"
                        step="0.01"
                        min="0"
                        max="1000"
                        value={formData.max_achievement_percent}
                        onChange={(e) => setFormData({ ...formData, max_achievement_percent: e.target.value })}
                        placeholder="Ex: 120 ou vide"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="bonus">
                      Bonus (%) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="bonus"
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      value={formData.bonus_percent}
                      onChange={(e) => setFormData({ ...formData, bonus_percent: e.target.value })}
                      placeholder="Ex: 10"
                      required
                    />
                  </div>

                  <div className="rounded-lg bg-muted/50 p-4 space-y-2">
                    <p className="text-sm font-semibold">💡 Exemples de règles</p>
                    <p className="text-xs text-muted-foreground">
                      • Bronze : 80-100% d'atteinte → 5% de bonus<br />
                      • Argent : 100-120% d'atteinte → 10% de bonus<br />
                      • Or : 120%+ d'atteinte → 15% de bonus
                    </p>
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} className="modern-button">
                    {loading ? 'Enregistrement...' : editingRule ? 'Modifier' : 'Créer'}
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
            <p className="text-muted-foreground mb-4">Aucune règle de bonus configurée</p>
            <p className="text-sm text-muted-foreground">
              Créez des règles pour récompenser automatiquement les performances
            </p>
          </div>
        ) : (
          <>
            <div className="rounded-md border mb-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Règle</TableHead>
                    <TableHead>Seuil minimum</TableHead>
                    <TableHead>Seuil maximum</TableHead>
                    <TableHead className="text-right">Bonus</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bonusRules.map((rule) => (
                    <TableRow key={rule.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-semibold">{rule.name}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {rule.min_achievement_percent}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {rule.max_achievement_percent ? (
                          <Badge variant="outline" className="font-mono">
                            {rule.max_achievement_percent}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">Illimité</span>
                        )}
                      </TableCell>
                      <TableCell className="text-right">
                        <Badge className="bg-gradient-to-r from-orange to-warning font-semibold">
                          <TrendingUp className="h-3 w-3 mr-1" />
                          +{rule.bonus_percent}%
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={rule.is_active ? 'default' : 'outline'}>
                          {rule.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(rule)}
                            className="hover:bg-primary/10 hover:text-primary"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(rule.id, rule.name)}
                            className="hover:bg-destructive/10 hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="modern-card p-4 bg-gradient-to-br from-info/5 to-primary/5">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-info/10">
                  <TrendingUp className="h-5 w-5 text-info" />
                </div>
                <div className="flex-1">
                  <h4 className="font-semibold mb-1">Comment ça fonctionne ?</h4>
                  <p className="text-sm text-muted-foreground">
                    Les bonus sont calculés automatiquement selon le pourcentage d'atteinte des objectifs. 
                    Par exemple, si un employé atteint 110% de son objectif et qu'une règle "Argent" 
                    offre 10% de bonus entre 100-120%, il recevra 10% supplémentaires sur sa commission de base.
                  </p>
                </div>
              </div>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
