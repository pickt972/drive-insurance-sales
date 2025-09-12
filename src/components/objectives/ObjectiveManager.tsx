import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Target, Edit, Trash2 } from "lucide-react";
import { useObjectives } from "@/hooks/useObjectives";
import { ObjectiveProgressCard } from "./ObjectiveProgressCard";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { EmployeeObjective } from "@/types/objectives";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
export const ObjectiveManager = () => {
  const { objectivesProgress, loading, createObjective, updateObjective, deleteObjective } = useObjectives();
  const { profile } = useSupabaseAuth();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<EmployeeObjective | null>(null);
  const [formData, setFormData] = useState({
    employee_name: '',
    objective_type: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    target_type: 'both' as 'commission' | 'sales' | 'both', // Nouveau: type d'objectif
    target_amount: '',
    target_sales_count: '',
    period_start: '',
    period_end: '',
    description: '',
  });

  const [employees, setEmployees] = useState<string[]>([]);

  useEffect(() => {
    const loadEmployees = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('username, role, is_active')
        .eq('is_active', true)
        .eq('role', 'employee')
        .order('username', { ascending: true });

      if (error) {
        console.error('Erreur chargement employés:', error);
        return;
      }

      setEmployees((data || []).map((p: any) => p.username));
    };

    loadEmployees();
  }, []);
  const isAdmin = profile?.role === 'admin';

  const resetForm = () => {
    setFormData({
      employee_name: '',
      objective_type: 'monthly' as 'monthly' | 'weekly' | 'yearly',
      target_type: 'both' as 'commission' | 'sales' | 'both',
      target_amount: '',
      target_sales_count: '',
      period_start: '',
      period_end: '',
      description: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation selon le type d'objectif choisi
    if (formData.target_type === 'commission' && (!formData.target_amount || parseFloat(formData.target_amount) <= 0)) {
      toast({
        title: "Erreur",
        description: "Veuillez définir un objectif de commissions valide",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.target_type === 'sales' && (!formData.target_sales_count || parseInt(formData.target_sales_count) <= 0)) {
      toast({
        title: "Erreur", 
        description: "Veuillez définir un objectif de ventes valide",
        variant: "destructive",
      });
      return;
    }
    
    if (formData.target_type === 'both' && 
        ((!formData.target_amount || parseFloat(formData.target_amount) <= 0) || 
         (!formData.target_sales_count || parseInt(formData.target_sales_count) <= 0))) {
      toast({
        title: "Erreur",
        description: "Veuillez définir des objectifs valides pour les commissions et les ventes",
        variant: "destructive",
      });
      return;
    }
    
    const objectiveData = {
      employee_name: formData.employee_name,
      objective_type: formData.objective_type,
      target_amount: (formData.target_type === 'commission' || formData.target_type === 'both') 
        ? parseFloat(formData.target_amount) || 0 
        : 0,
      target_sales_count: (formData.target_type === 'sales' || formData.target_type === 'both') 
        ? parseInt(formData.target_sales_count) || 0 
        : 0,
      period_start: formData.period_start,
      period_end: formData.period_end,
      description: formData.description,
      is_active: true,
    };

    let result;
    if (editingObjective) {
      result = await updateObjective(editingObjective.id, objectiveData);
    } else {
      result = await createObjective(objectiveData);
    }

    if (result.success) {
      toast({
        title: editingObjective ? "Objectif modifié" : "Objectif créé",
        description: editingObjective ? "L'objectif a été modifié avec succès" : "Le nouvel objectif a été créé avec succès",
      });
      setIsCreateDialogOpen(false);
      setEditingObjective(null);
      resetForm();
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (objective: EmployeeObjective) => {
    setEditingObjective(objective);
    
    // Déterminer le type d'objectif selon les valeurs
    let targetType: 'commission' | 'sales' | 'both' = 'both';
    if (objective.target_amount > 0 && objective.target_sales_count === 0) {
      targetType = 'commission';
    } else if (objective.target_amount === 0 && objective.target_sales_count > 0) {
      targetType = 'sales';
    }
    
    setFormData({
      employee_name: objective.employee_name,
      objective_type: objective.objective_type,
      target_type: targetType,
      target_amount: objective.target_amount > 0 ? objective.target_amount.toString() : '',
      target_sales_count: objective.target_sales_count > 0 ? objective.target_sales_count.toString() : '',
      period_start: objective.period_start,
      period_end: objective.period_end,
      description: objective.description || '',
    });
    setIsCreateDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    const result = await deleteObjective(id);
    if (result.success) {
      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé avec succès",
      });
    } else {
      toast({
        title: "Erreur",
        description: result.error || "Une erreur est survenue",
        variant: "destructive",
      });
    }
  };

  const filteredProgress = isAdmin 
    ? objectivesProgress 
    : objectivesProgress.filter(progress => progress.objective.employee_name === profile?.username);

  if (loading) {
    return <div className="text-center py-8">Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              Gestion des Objectifs
            </CardTitle>
            {isAdmin && (
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={resetForm} className="flex items-center gap-2">
                    <Plus className="h-4 w-4" />
                    Nouvel objectif
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingObjective ? 'Modifier l\'objectif' : 'Créer un objectif'}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="employee_name">Employé</Label>
                      <Select value={formData.employee_name} onValueChange={(value) => setFormData({...formData, employee_name: value})}>
                        <SelectTrigger>
                          <SelectValue placeholder="Sélectionner un employé" />
                        </SelectTrigger>
                        <SelectContent>
                          {employees.map(employee => (
                            <SelectItem key={employee} value={employee}>{employee}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="objective_type">Type d'objectif</Label>
                      <Select value={formData.objective_type} onValueChange={(value: 'monthly' | 'weekly' | 'yearly') => setFormData({...formData, objective_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Hebdomadaire</SelectItem>
                          <SelectItem value="monthly">Mensuel</SelectItem>
                          <SelectItem value="yearly">Annuel</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="target_type">Type d'objectif</Label>
                      <Select value={formData.target_type} onValueChange={(value: 'commission' | 'sales' | 'both') => setFormData({...formData, target_type: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="commission">Objectif de commissions uniquement</SelectItem>
                          <SelectItem value="sales">Objectif de ventes uniquement</SelectItem>
                          <SelectItem value="both">Objectif de commissions et ventes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {(formData.target_type === 'commission' || formData.target_type === 'both') && (
                      <div className="space-y-2">
                        <Label htmlFor="target_amount">Objectif commissions (€)</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={formData.target_amount}
                          onChange={(e) => setFormData({...formData, target_amount: e.target.value})}
                          placeholder="0.00"
                        />
                      </div>
                    )}

                    {(formData.target_type === 'sales' || formData.target_type === 'both') && (
                      <div className="space-y-2">
                        <Label htmlFor="target_sales_count">Objectif ventes</Label>
                        <Input
                          type="number"
                          value={formData.target_sales_count}
                          onChange={(e) => setFormData({...formData, target_sales_count: e.target.value})}
                          placeholder="0"
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="period_start">Date de début</Label>
                        <Input
                          type="date"
                          value={formData.period_start}
                          onChange={(e) => setFormData({...formData, period_start: e.target.value})}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="period_end">Date de fin</Label>
                        <Input
                          type="date"
                          value={formData.period_end}
                          onChange={(e) => setFormData({...formData, period_end: e.target.value})}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description (optionnel)</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({...formData, description: e.target.value})}
                        placeholder="Description de l'objectif..."
                      />
                    </div>

                    <div className="flex gap-2">
                      <Button type="submit" className="flex-1">
                        {editingObjective ? 'Modifier' : 'Créer'}
                      </Button>
                      <Button type="button" variant="outline" onClick={() => {
                        setIsCreateDialogOpen(false);
                        setEditingObjective(null);
                        resetForm();
                      }}>
                        Annuler
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
      </Card>

      {filteredProgress.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="text-center py-8">
            <Target className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-muted-foreground">Aucun objectif défini</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-6">
          {filteredProgress.map((progress) => (
            <div key={progress.objective.id} className="relative">
              <ObjectiveProgressCard 
                progress={progress} 
                showEmployeeName={isAdmin}
              />
              {isAdmin && (
                <div className="absolute top-4 right-4 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(progress.objective)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(progress.objective.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};