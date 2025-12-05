import { useState } from 'react';
import { useObjectives, ObjectiveMode, TargetByInsuranceType } from '@/hooks/useObjectives';
import { useUsers } from '@/hooks/useUsers';
import { useInsuranceTypes } from '@/hooks/useInsuranceTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
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
import { PlusCircle, Target, Euro, Hash, ListChecks, Trash2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ObjectivesManagement() {
  const { objectives, addObjective, removeObjective, loading } = useObjectives();
  const { users } = useUsers();
  const { insuranceTypes } = useInsuranceTypes();

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
      case 'by_type': return 'Par type d\'assurance';
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
    return user?.full_name || 'Utilisateur inconnu';
  };

  const getInsuranceTypeName = (typeId: string) => {
    const type = insuranceTypes.find(t => t.id === typeId);
    return type?.name || typeId;
  };

  const activeObjectives = objectives.filter(obj => obj.is_active);

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

                {/* Champs conditionnels selon le mode */}
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
        {loading ? (
          <div className="text-center py-8 text-muted-foreground">Chargement...</div>
        ) : activeObjectives.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun objectif défini. Cliquez sur "Nouvel objectif" pour en créer un.
          </div>
        ) : (
          <div className="space-y-4">
            {activeObjectives.map((obj) => (
              <div key={obj.id} className="flex items-start justify-between p-4 rounded-lg border bg-card hover:bg-muted/50 transition-colors">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-full bg-primary/10 text-primary">
                    {getObjectiveModeIcon(obj.objective_mode)}
                  </div>
                  <div className="space-y-1">
                    <p className="font-semibold">{obj.user_id ? getUserName(obj.user_id) : 'Tous les employés'}</p>
                    <p className="text-sm text-muted-foreground">
                      {format(new Date(obj.period_start), 'dd MMM yyyy', { locale: fr })} - {format(new Date(obj.period_end), 'dd MMM yyyy', { locale: fr })}
                    </p>
                    {obj.description && (
                      <p className="text-sm text-muted-foreground">{obj.description}</p>
                    )}
                    
                    {/* Affichage des cibles par type */}
                    {obj.objective_mode === 'by_type' && obj.target_by_insurance_type && Object.keys(obj.target_by_insurance_type).length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {Object.entries(obj.target_by_insurance_type).map(([typeId, target]) => (
                          target > 0 && (
                            <Badge key={typeId} variant="outline" className="text-xs">
                              {getInsuranceTypeName(typeId)}: {target}
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
                      <p className="text-lg font-bold">{obj.target_amount.toFixed(2)} €</p>
                    )}
                    {(obj.objective_mode === 'count' || obj.objective_mode === 'mixed') && obj.target_sales_count > 0 && (
                      <p className="text-lg font-bold">{obj.target_sales_count} ventes</p>
                    )}
                    {obj.objective_mode === 'by_type' && (
                      <p className="text-lg font-bold">
                        {Object.values(obj.target_by_insurance_type || {}).reduce((a, b) => a + b, 0)} ventes
                      </p>
                    )}
                    <Badge variant="secondary" className="mt-1">
                      {getObjectiveModeLabel(obj.objective_mode)}
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
      </CardContent>
    </Card>
  );
}
