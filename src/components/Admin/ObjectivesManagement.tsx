import { useState } from 'react';
import { useObjectives } from '@/hooks/useObjectives';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { PlusCircle, Target } from 'lucide-react';
import { format } from 'date-fns';

export function ObjectivesManagement() {
  const { objectives, addObjective } = useObjectives();
  const { users } = useUsers();

  const [open, setOpen] = useState(false);
  const [formData, setFormData] = useState({
    employee_name: '',
    objective_type: 'monthly',
    target_amount: '',
    period_start: '',
    period_end: '',
    description: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    await addObjective({
      employee_name: formData.employee_name,
      objective_type: formData.objective_type,
      target_amount: parseFloat(formData.target_amount),
      target_sales_count: 0,
      period_start: formData.period_start,
      period_end: formData.period_end,
      description: formData.description,
    });

    setOpen(false);
    setFormData({
      employee_name: '',
      objective_type: 'monthly',
      target_amount: '',
      period_start: '',
      period_end: '',
      description: '',
    });
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Gestion des objectifs</CardTitle>
            <CardDescription>
              Définir et suivre les objectifs de vente
            </CardDescription>
          </div>
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button>
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouvel objectif
              </Button>
            </DialogTrigger>
            <DialogContent>
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
                    value={formData.employee_name}
                    onValueChange={(value) => setFormData({ ...formData, employee_name: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {users.filter(u => u.role === 'user').map(user => (
                        <SelectItem key={user.id} value={user.full_name}>
                          {user.full_name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Type d'objectif *</Label>
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
                  <Label>Montant cible (€) *</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={formData.target_amount}
                    onChange={(e) => setFormData({ ...formData, target_amount: e.target.value })}
                    required
                  />
                </div>

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
        <div className="space-y-4">
          {objectives.map((obj) => (
            <div key={obj.id} className="flex items-center justify-between p-4 rounded-lg border">
              <div className="flex items-center gap-4">
                <Target className="h-8 w-8 text-primary" />
                <div>
                  <p className="font-semibold">{obj.employee_name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(obj.period_start), 'dd/MM/yyyy')} - 
                    {format(new Date(obj.period_end), 'dd/MM/yyyy')}
                  </p>
                  {obj.description && (
                    <p className="text-sm text-muted-foreground">{obj.description}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold">{obj.target_amount.toFixed(2)} €</p>
                <p className="text-sm text-muted-foreground">{obj.objective_type}</p>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
