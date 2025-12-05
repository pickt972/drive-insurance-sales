import { useState, useMemo } from 'react';
import { useObjectives, ObjectiveMode, TargetByInsuranceType } from '@/hooks/useObjectives';
import { useUsers } from '@/hooks/useUsers';
import { useInsuranceTypes } from '@/hooks/useInsuranceTypes';
import { useSales } from '@/hooks/useSales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PlusCircle, Target, Euro, Hash, ListChecks, Trash2, TrendingUp, Award } from 'lucide-react';
import { format, isWithinInterval, parseISO } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ObjectivesManagement() {
  const { objectives, addObjective, removeObjective, loading } = useObjectives();
  const { users } = useUsers();
  const { insuranceTypes } = useInsuranceTypes();
  const { sales } = useSales();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    user_id: '',
    objective_type: 'monthly',
    objective_mode: 'amount' as ObjectiveMode,
    target_amount: '',
    target_sales_count: '',
    target_by_insurance_type: {} as TargetByInsuranceType,
    period_start: '',
    period_end: '',
    description: '',
  });

  // Calculate progress for each objective
  const objectivesWithProgress = useMemo(() => {
    return objectives.filter(obj => obj.is_active).map(obj => {
      // Filter sales within objective period
      const periodSales = sales.filter(sale => {
        const saleDate = parseISO(sale.sale_date);
        const periodStart = parseISO(obj.period_start);
        const periodEnd = parseISO(obj.period_end);
        
        const inPeriod = isWithinInterval(saleDate, { start: periodStart, end: periodEnd });
        const matchesUser = !obj.user_id || sale.user_id === obj.user_id;
        
        return inPeriod && matchesUser;
      });

      // Calculate actual values
      const actualAmount = periodSales.reduce((sum, s) => sum + (s.amount || 0), 0);
      const actualCount = periodSales.length;
      
      // Calculate by type
      const actualByType: TargetByInsuranceType = {};
      periodSales.forEach(sale => {
        const typeId = sale.insurance_type_id || '';
        if (typeId) {
          actualByType[typeId] = (actualByType[typeId] || 0) + 1;
        }
      });

      // Calculate progress percentages
      let progressPercent = 0;
      let progressDetails: { label: string; actual: number; target: number; percent: number }[] = [];

      switch (obj.objective_mode) {
        case 'amount':
          progressPercent = obj.target_amount > 0 ? (actualAmount / obj.target_amount) * 100 : 0;
          progressDetails = [{
            label: 'Montant',
            actual: actualAmount,
            target: obj.target_amount,
            percent: progressPercent
          }];
          break;
        case 'count':
          progressPercent = obj.target_sales_count > 0 ? (actualCount / obj.target_sales_count) * 100 : 0;
          progressDetails = [{
            label: 'Ventes',
            actual: actualCount,
            target: obj.target_sales_count,
            percent: progressPercent
          }];
          break;
        case 'by_type':
          const targets = obj.target_by_insurance_type || {};
          const totalTarget = Object.values(targets).reduce((a, b) => a + b, 0);
          const totalActual = Object.keys(targets).reduce((sum, typeId) => {
            return sum + (actualByType[typeId] || 0);
          }, 0);
          progressPercent = totalTarget > 0 ? (totalActual / totalTarget) * 100 : 0;
          
          Object.entries(targets).forEach(([typeId, target]) => {
            if (target > 0) {
              const actual = actualByType[typeId] || 0;
              progressDetails.push({
                label: getInsuranceTypeName(typeId),
                actual,
                target,
                percent: (actual / target) * 100
              });
            }
          });
          break;
        case 'mixed':
          const amountPercent = obj.target_amount > 0 ? (actualAmount / obj.target_amount) * 100 : 0;
          const countPercent = obj.target_sales_count > 0 ? (actualCount / obj.target_sales_count) * 100 : 0;
          progressPercent = (amountPercent + countPercent) / 2;
          progressDetails = [
            { label: 'Montant', actual: actualAmount, target: obj.target_amount, percent: amountPercent },
            { label: 'Ventes', actual: actualCount, target: obj.target_sales_count, percent: countPercent }
          ];
          break;
      }

      return {
        ...obj,
        actualAmount,
        actualCount,
        actualByType,
        progressPercent: Math.min(progressPercent, 100),
        progressDetails,
      };
    });
  }, [objectives, sales, insuranceTypes]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await addObjective({
      user_id: formData.user_id,
      objective_type: formData.objective_type,
      objective_mode: formData.objective_mode,
      target_amount: parseFloat(formData.target_amount) || 0,
      target_sales_count: parseInt(formData.target_sales_count) || 0,
      target_by_insurance_type: formData.target_by_insurance_type,
      period_start: formData.period_start,
      period_end: formData.period_end,
      description: formData.description,
    });

    setOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      objective_type: 'monthly',
      objective_mode: 'amount',
      target_amount: '',
      target_sales_count: '',
      target_by_insurance_type: {},
      period_start: '',
      period_end: '',
      description: '',
    });
  };

  const handleInsuranceTypeTargetChange = (typeId: string, value: string) => {
    const numValue = parseInt(value) || 0;
    setFormData(prev => ({
      ...prev,
      target_by_insurance_type: {
        ...prev.target_by_insurance_type,
        [typeId]: numValue,
      },
    }));
  };

  const getObjectiveModeLabel = (mode: ObjectiveMode) => {
    switch (mode) {
      case 'amount': return 'Montant (€)';
      case 'count': return 'Nombre de ventes';
      case 'by_type': return 'Par type';
      case 'mixed': return 'Mixte';
      default: return mode;
    }
  };

  const getObjectiveModeIcon = (mode: ObjectiveMode) => {
    switch (mode) {
      case 'amount': return <Euro className="h-4 w-4" />;
      case 'count': return <Hash className="h-4 w-4" />;
      case 'by_type': return <ListChecks className="h-4 w-4" />;
      default: return <Target className="h-4 w-4" />;
    }
  };

  const getUserName = (userId: string) => {
    const user = users.find(u => u.id === userId);
    return user?.full_name || 'Tous les employés';
  };

  const getInsuranceTypeName = (typeId: string) => {
    const type = insuranceTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const getProgressColor = (percent: number) => {
    if (percent >= 100) return 'bg-green-500';
    if (percent >= 75) return 'bg-blue-500';
    if (percent >= 50) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getProgressBadge = (percent: number) => {
    if (percent >= 100) return { label: 'Atteint ✓', variant: 'default' as const };
    if (percent >= 75) return { label: 'Bon', variant: 'secondary' as const };
    if (percent >= 50) return { label: 'En cours', variant: 'outline' as const };
    return { label: 'À améliorer', variant: 'destructive' as const };
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des objectifs</CardTitle>
            <CardDescription>
              Définir et suivre les objectifs de vente par montant, nombre ou type d'assurance
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvel objectif
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Créer un objectif</DialogTitle>
                <DialogDescription>
                  Définir un objectif de vente pour un employé
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label>Employé *</Label>
                  <Select
                    value={formData.user_id}
                    onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner un employé..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'user').map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Période *</Label>
                  <Select
                    value={formData.objective_type}
                    onValueChange={(value) => setFormData({ ...formData, objective_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="monthly">Mensuel</SelectItem>
                      <SelectItem value="quarterly">Trimestriel</SelectItem>
                      <SelectItem value="yearly">Annuel</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Type d'objectif *</Label>
                  <Select
                    value={formData.objective_mode}
                    onValueChange={(value) => setFormData({ ...formData, objective_mode: value as ObjectiveMode })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="amount">
                        <div className="flex items-center gap-2">
                          <Euro className="h-4 w-4" />
                          <span>Montant en euros</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="count">
                        <div className="flex items-center gap-2">
                          <Hash className="h-4 w-4" />
                          <span>Nombre total de ventes</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="by_type">
                        <div className="flex items-center gap-2">
                          <ListChecks className="h-4 w-4" />
                          <span>Par type d'assurance</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="mixed">
                        <div className="flex items-center gap-2">
                          <Target className="h-4 w-4" />
                          <span>Mixte (montant + nombre)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {(formData.objective_mode === 'amount' || formData.objective_mode === 'mixed') && (
                  <div>
                    <Label>Montant cible (€) *</Label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.target_amount}
                      onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                      placeholder="Ex: 5000"
                      required={formData.objective_mode === 'amount'}
                    />
                  </div>
                )}

                {(formData.objective_mode === 'count' || formData.objective_mode === 'mixed') && (
                  <div>
                    <Label>Nombre de ventes cible *</Label>
                    <Input
                      type="number"
                      min="0"
                      value={formData.target_sales_count}
                      onChange={(e) => setFormData({ ...formData, target_sales_count: e.target.value })}
                      placeholder="Ex: 50"
                      required={formData.objective_mode === 'count'}
                    />
                  </div>
                )}

                {formData.objective_mode === 'by_type' && (
                  <div className="space-y-3">
                    <Label>Objectifs par type d'assurance</Label>
                    <div className="border rounded-lg p-3 space-y-2 bg-muted/30">
                      {insuranceTypes.map(type => (
                        <div key={type.id} className="flex items-center justify-between gap-3">
                          <Label className="font-normal flex-1">{type.name}</Label>
                          <Input
                            type="number"
                            min="0"
                            className="w-24"
                            placeholder="0"
                            value={formData.target_by_insurance_type[type.id] || ''}
                            onChange={(e) => handleInsuranceTypeTargetChange(type.id, e.target.value)}
                          />
                        </div>
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Définissez le nombre de ventes cible pour chaque type d'assurance
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Date début *</Label>
                    <Input
                      type="date"
                      value={formData.period_start}
                      onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label>Date fin *</Label>
                    <Input
                      type="date"
                      value={formData.period_end}
                      onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Input
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Objectif du mois..."
                  />
                </div>

                <Button type="submit" className="w-full">
                  Créer l'objectif
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="progress" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Progression
            </TabsTrigger>
            <TabsTrigger value="list" className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              Liste des objectifs
            </TabsTrigger>
          </TabsList>

          {/* Onglet Progression */}
          <TabsContent value="progress" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : objectivesWithProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun objectif actif à afficher.
              </div>
            ) : (
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Employé</TableHead>
                      <TableHead>Période</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead className="w-[300px]">Progression</TableHead>
                      <TableHead className="text-right">Statut</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {objectivesWithProgress.map((obj) => (
                      <TableRow key={obj.id}>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-2">
                            {obj.progressPercent >= 100 && (
                              <Award className="h-4 w-4 text-yellow-500" />
                            )}
                            {getUserName(obj.user_id || '')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            {format(new Date(obj.period_start), 'dd MMM', { locale: fr })} - {format(new Date(obj.period_end), 'dd MMM yyyy', { locale: fr })}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="flex items-center gap-1 w-fit">
                            {getObjectiveModeIcon(obj.objective_mode)}
                            {getObjectiveModeLabel(obj.objective_mode)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-2">
                            {obj.progressDetails.map((detail, idx) => (
                              <div key={idx} className="space-y-1">
                                <div className="flex justify-between text-xs">
                                  <span className="text-muted-foreground">{detail.label}</span>
                                  <span className="font-medium">
                                    {obj.objective_mode === 'amount' || (obj.objective_mode === 'mixed' && detail.label === 'Montant')
                                      ? `${detail.actual.toFixed(0)}€ / ${detail.target.toFixed(0)}€`
                                      : `${detail.actual} / ${detail.target}`
                                    }
                                  </span>
                                </div>
                                <div className="relative">
                                  <Progress value={Math.min(detail.percent, 100)} className="h-2" />
                                  <div
                                    className={`absolute top-0 left-0 h-2 rounded-full transition-all ${getProgressColor(detail.percent)}`}
                                    style={{ width: `${Math.min(detail.percent, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Badge variant={getProgressBadge(obj.progressPercent).variant}>
                            {Math.round(obj.progressPercent)}% - {getProgressBadge(obj.progressPercent).label}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {/* Résumé des performances */}
            {objectivesWithProgress.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                <Card className="bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Award className="h-5 w-5 text-green-600" />
                      <span className="text-sm font-medium text-green-700 dark:text-green-400">Objectifs atteints</span>
                    </div>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400 mt-1">
                      {objectivesWithProgress.filter(o => o.progressPercent >= 100).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-900">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      <span className="text-sm font-medium text-blue-700 dark:text-blue-400">En bonne voie (≥75%)</span>
                    </div>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400 mt-1">
                      {objectivesWithProgress.filter(o => o.progressPercent >= 75 && o.progressPercent < 100).length}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-orange-50 dark:bg-orange-950/20 border-orange-200 dark:border-orange-900">
                  <CardContent className="pt-4">
                    <div className="flex items-center gap-2">
                      <Target className="h-5 w-5 text-orange-600" />
                      <span className="text-sm font-medium text-orange-700 dark:text-orange-400">Progression moyenne</span>
                    </div>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400 mt-1">
                      {objectivesWithProgress.length > 0
                        ? Math.round(objectivesWithProgress.reduce((sum, o) => sum + o.progressPercent, 0) / objectivesWithProgress.length)
                        : 0}%
                    </p>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>

          {/* Onglet Liste */}
          <TabsContent value="list" className="mt-4">
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">Chargement...</div>
            ) : objectivesWithProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                Aucun objectif défini. Cliquez sur "Nouvel objectif" pour en créer un.
              </div>
            ) : (
              <div className="space-y-4">
                {objectivesWithProgress.map((obj) => (
                  <div key={obj.id} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                    <div className="flex items-start gap-4">
                      <div className="p-2 rounded-full bg-primary/10 text-primary">
                        {getObjectiveModeIcon(obj.objective_mode)}
                      </div>
                      <div className="space-y-1">
                        <p className="font-semibold">{getUserName(obj.user_id || '')}</p>
                        <p className="text-sm text-muted-foreground">
                          {format(new Date(obj.period_start), 'dd MMM yyyy', { locale: fr })} - {format(new Date(obj.period_end), 'dd MMM yyyy', { locale: fr })}
                        </p>
                        {obj.description && (
                          <p className="text-sm text-muted-foreground">{obj.description}</p>
                        )}
                        
                        {obj.objective_mode === 'by_type' && obj.target_by_insurance_type && Object.keys(obj.target_by_insurance_type).length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {Object.entries(obj.target_by_insurance_type).map(([typeId, target]) => (
                              target > 0 && (
                                <Badge key={typeId} variant="outline" className="text-xs">
                                  {getInsuranceTypeName(typeId)}: {obj.actualByType[typeId] || 0}/{target}
                                </Badge>
                              )
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-start gap-4">
                      <div className="text-right">
                        {(obj.objective_mode === 'amount' || obj.objective_mode === 'mixed') && obj.target_amount > 0 && (
                          <p className="text-lg font-bold">{obj.actualAmount.toFixed(0)}€ / {obj.target_amount.toFixed(0)}€</p>
                        )}
                        {(obj.objective_mode === 'count' || obj.objective_mode === 'mixed') && obj.target_sales_count > 0 && (
                          <p className="text-lg font-bold">{obj.actualCount} / {obj.target_sales_count} ventes</p>
                        )}
                        {obj.objective_mode === 'by_type' && (
                          <p className="text-lg font-bold">
                            {Object.keys(obj.target_by_insurance_type || {}).reduce((sum, typeId) => sum + (obj.actualByType[typeId] || 0), 0)} / {Object.values(obj.target_by_insurance_type || {}).reduce((a, b) => a + b, 0)} ventes
                          </p>
                        )}
                        <Badge variant={getProgressBadge(obj.progressPercent).variant} className="mt-1">
                          {Math.round(obj.progressPercent)}%
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive hover:bg-destructive/10"
                        onClick={() => removeObjective(obj.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
