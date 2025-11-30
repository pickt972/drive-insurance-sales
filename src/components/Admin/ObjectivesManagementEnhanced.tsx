import { useState, useMemo } from 'react';
import { useObjectives } from '@/hooks/useObjectives';
import { useUsers } from '@/hooks/useUsers';
import { useSales } from '@/hooks/useSales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { PlusCircle, Target, TrendingUp, Calendar, Edit, Trash2, Award } from 'lucide-react';
import { format, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

export function ObjectivesManagementEnhanced() {
  const { objectives, addObjective } = useObjectives();
  const { users } = useUsers();
  const { sales } = useSales();
  const { toast } = useToast();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    employee_id: '',
    objective_type: 'monthly',
    target_amount: '',
    target_sales_count: '',
    period_start: '',
    period_end: '',
    description: '',
  });

  // Calculer la progression pour chaque objectif
  const objectivesWithProgress = useMemo(() => {
    return objectives.map(obj => {
      // Trouver les ventes dans la période
      const periodSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        const start = new Date(obj.period_start);
        const end = new Date(obj.period_end);
        
        return isWithinInterval(saleDate, { start, end }) && 
               sale.employee_name === obj.employee_name;
      });

      const achievedAmount = periodSales.reduce((sum, s) => sum + s.commission, 0);
      const achievedCount = periodSales.length;
      const progressAmount = obj.target_amount > 0 
        ? (achievedAmount / obj.target_amount) * 100 
        : 0;
      const progressCount = obj.target_sales_count > 0 
        ? (achievedCount / obj.target_sales_count) * 100 
        : 0;

      return {
        ...obj,
        achievedAmount,
        achievedCount,
        progressAmount: Math.min(progressAmount, 100),
        progressCount: Math.min(progressCount, 100),
        isCompleted: progressAmount >= 100 || progressCount >= 100,
      };
    });
  }, [objectives, sales]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await addObjective({
        employee_name: formData.employee_name,
        objective_type: formData.objective_type,
        target_amount: parseFloat(formData.target_amount),
        target_sales_count: formData.target_sales_count ? parseInt(formData.target_sales_count) : 0,
        period_start: formData.period_start,
        period_end: formData.period_end,
        description: formData.description,
      });

      toast({
        title: 'Succès',
        description: 'Objectif créé avec succès',
      });

      setOpen(false);
      setFormData({
        employee_name: '',
        employee_id: '',
        objective_type: 'monthly',
        target_amount: '',
        target_sales_count: '',
        period_start: '',
        period_end: '',
        description: '',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible de créer l\'objectif',
        variant: 'destructive',
      });
    }
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'from-success to-success-variant';
    if (progress >= 80) return 'from-orange to-warning';
    if (progress >= 50) return 'from-info to-primary';
    return 'from-muted to-muted-foreground';
  };

  const getProgressBadge = (progress: number) => {
    if (progress >= 100) return { label: 'Atteint ✓', variant: 'default' as const };
    if (progress >= 80) return { label: 'En bonne voie', variant: 'secondary' as const };
    if (progress >= 50) return { label: 'En cours', variant: 'outline' as const };
    return { label: 'À suivre', variant: 'outline' as const };
  };

  return (
    <div className="space-y-6">
      <Card className="modern-card animate-gentle-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange/10 to-orange/5">
                <Target className="h-5 w-5 text-orange" />
              </div>
              <div>
                <CardTitle>Gestion des objectifs</CardTitle>
                <CardDescription>
                  Définir et suivre les objectifs de vente - {objectivesWithProgress.length} objectif{objectivesWithProgress.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="modern-button">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Nouvel objectif
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <form onSubmit={handleSubmit}>
                  <DialogHeader>
                    <DialogTitle>Créer un objectif</DialogTitle>
                    <DialogDescription>
                      Définir un objectif de vente pour un employé
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label>Employé <span className="text-destructive">*</span></Label>
                      <Select
                        value={formData.employee_name}
                        onValueChange={(value) => setFormData({ ...formData, employee_name: value })}
                        required
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un employé..." />
                        </SelectTrigger>
                        <SelectContent>
                          {users.filter(u => u.role === 'user' && u.is_active).map(user => (
                            <SelectItem key={user.id} value={user.full_name}>
                              {user.full_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Type d'objectif <span className="text-destructive">*</span></Label>
                      <Select
                        value={formData.objective_type}
                        onValueChange={(value) => setFormData({ ...formData, objective_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="monthly">📅 Mensuel</SelectItem>
                          <SelectItem value="quarterly">📊 Trimestriel</SelectItem>
                          <SelectItem value="yearly">🎯 Annuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="target_amount">
                          Objectif commission (€) <span className="text-destructive">*</span>
                        </Label>
                        <Input
                          id="target_amount"
                          type="number"
                          step="0.01"
                          min="0"
                          value={formData.target_amount}
                          onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                          placeholder="Ex: 1500"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="target_sales">Nombre de ventes cible</Label>
                        <Input
                          id="target_sales"
                          type="number"
                          min="0"
                          value={formData.target_sales_count}
                          onChange={(e) => setFormData({ ...formData, target_sales_count: e.target.value })}
                          placeholder="Ex: 20 (optionnel)"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="start">Date début <span className="text-destructive">*</span></Label>
                        <Input
                          id="start"
                          type="date"
                          value={formData.period_start}
                          onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="end">Date fin <span className="text-destructive">*</span></Label>
                        <Input
                          id="end"
                          type="date"
                          value={formData.period_end}
                          onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Input
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Ex: Objectif mensuel standard..."
                      />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                      Annuler
                    </Button>
                    <Button type="submit" className="modern-button">
                      Créer l'objectif
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>

        <CardContent>
          {objectivesWithProgress.length === 0 ? (
            <div className="text-center py-12">
              <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Aucun objectif défini</p>
              <p className="text-sm text-muted-foreground">
                Créez des objectifs pour motiver et suivre les performances
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {objectivesWithProgress.map((obj) => {
                const badge = getProgressBadge(obj.progressAmount);
                
                return (
                  <div key={obj.id} className="modern-card p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-gradient-to-br ${obj.isCompleted ? 'from-success/10 to-success/5' : 'from-orange/10 to-orange/5'}`}>
                          {obj.isCompleted ? (
                            <Award className="h-6 w-6 text-success" />
                          ) : (
                            <Target className="h-6 w-6 text-orange" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <p className="text-lg font-bold">{obj.employee_name}</p>
                            <Badge variant={badge.variant}>{badge.label}</Badge>
                          </div>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {format(new Date(obj.period_start), 'dd MMM', { locale: fr })} - 
                              {format(new Date(obj.period_end), 'dd MMM yyyy', { locale: fr })}
                            </span>
                            <Badge variant="outline" className="font-mono text-xs">
                              {obj.objective_type}
                            </Badge>
                          </div>
                          {obj.description && (
                            <p className="text-sm text-muted-foreground mt-1">{obj.description}</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="text-right">
                        <div className="text-2xl font-bold bg-gradient-to-r from-orange to-warning bg-clip-text text-transparent">
                          {obj.target_amount.toFixed(0)} €
                        </div>
                        <p className="text-xs text-muted-foreground">Objectif</p>
                      </div>
                    </div>

                    {/* Progression commission */}
                    <div className="space-y-3">
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="font-medium">Commission</span>
                          <span className="font-bold">
                            {obj.achievedAmount.toFixed(2)} € / {obj.target_amount.toFixed(2)} € 
                            <span className={`ml-2 ${obj.isCompleted ? 'text-success' : 'text-orange'}`}>
                              ({obj.progressAmount.toFixed(0)}%)
                            </span>
                          </span>
                        </div>
                        <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                          <div 
                            className={`h-full bg-gradient-to-r ${getProgressColor(obj.progressAmount)} transition-all duration-500 relative overflow-hidden`}
                            style={{ width: `${obj.progressAmount}%` }}
                          >
                            <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                          </div>
                        </div>
                      </div>

                      {/* Progression nombre de ventes (si défini) */}
                      {obj.target_sales_count > 0 && (
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="font-medium">Nombre de ventes</span>
                            <span className="font-bold">
                              {obj.achievedCount} / {obj.target_sales_count}
                              <span className={`ml-2 ${obj.progressCount >= 100 ? 'text-success' : 'text-orange'}`}>
                                ({obj.progressCount.toFixed(0)}%)
                              </span>
                            </span>
                          </div>
                          <div className="relative h-3 w-full bg-muted rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${getProgressColor(obj.progressCount)} transition-all duration-500`}
                              style={{ width: `${obj.progressCount}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Badge de performance */}
                    {obj.isCompleted && (
                      <div className="mt-4 p-3 rounded-lg bg-gradient-to-r from-success/10 to-success/5 border border-success/20 animate-gentle-bounce">
                        <p className="text-sm font-semibold text-success flex items-center gap-2">
                          <Award className="h-4 w-4" />
                          🎉 Objectif atteint ! Félicitations
                        </p>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Statistiques globales */}
      <div className="grid gap-4 md:grid-cols-3 animate-elegant-slide" style={{ animationDelay: '0.1s' }}>
        <Card className="modern-card border-success/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Objectifs atteints</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl">🏆</div>
              <div>
                <div className="text-3xl font-bold text-success">
                  {objectivesWithProgress.filter(o => o.isCompleted).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  sur {objectivesWithProgress.length} objectifs
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-orange/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">En bonne voie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl">🎯</div>
              <div>
                <div className="text-3xl font-bold text-orange">
                  {objectivesWithProgress.filter(o => o.progressAmount >= 80 && !o.isCompleted).length}
                </div>
                <p className="text-xs text-muted-foreground">
                  80-99% d'atteinte
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="modern-card border-info/20">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Progression moyenne</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className="text-4xl">📊</div>
              <div>
                <div className="text-3xl font-bold text-info">
                  {objectivesWithProgress.length > 0 
                    ? (objectivesWithProgress.reduce((sum, o) => sum + o.progressAmount, 0) / objectivesWithProgress.length).toFixed(0)
                    : 0}%
                </div>
                <p className="text-xs text-muted-foreground">
                  tous employés confondus
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
