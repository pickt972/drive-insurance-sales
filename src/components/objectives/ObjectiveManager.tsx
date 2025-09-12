import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Target, Edit, Trash2, Archive } from "lucide-react";
import { useObjectives } from "@/hooks/useObjectives";
import { useObjectiveHistory } from "@/hooks/useObjectiveHistory";
import { ObjectiveProgressCard } from "./ObjectiveProgressCard";
import ObjectiveHistoryView from "./ObjectiveHistoryView";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { EmployeeObjective } from "@/types/objectives";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
export const ObjectiveManager = () => {
  const { objectivesProgress, loading, createObjective, updateObjective, deleteObjective } = useObjectives();
  const { profile } = useSupabaseAuth();
  const { archiveObjective } = useObjectiveHistory();
  const { toast } = useToast();
  
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingObjective, setEditingObjective] = useState<EmployeeObjective | null>(null);
  const [formData, setFormData] = useState({
    employee_name: '',
    objective_type: 'monthly' as 'monthly' | 'weekly' | 'yearly',
    target_type: 'both' as 'commission' | 'sales' | 'both',
    target_amount: '',
    target_sales_count: '',
    period_start: '',
    period_end: '',
    description: '',
    use_custom_dates: false, // Nouveau: pour activer/désactiver les dates personnalisées
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

      setEmployees((data || [])
        .map((p: any) => p.username)
        .filter((username: string) => username && username.trim() !== ''));
    };

    loadEmployees();
  }, []);
  const isAdmin = profile?.role === 'admin';

  // Fonction pour calculer les dates automatiquement
  const calculatePeriodDates = (objectiveType: 'monthly' | 'weekly' | 'yearly') => {
    const today = new Date();
    let startDate: Date;
    let endDate: Date;

    switch (objectiveType) {
      case 'weekly':
        // Début de la semaine (lundi)
        const dayOfWeek = today.getDay();
        const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
        startDate = new Date(today);
        startDate.setDate(today.getDate() + mondayOffset);
        
        // Fin de la semaine (dimanche)
        endDate = new Date(startDate);
        endDate.setDate(startDate.getDate() + 6);
        break;
        
      case 'monthly':
        // Début du mois courant
        startDate = new Date(today.getFullYear(), today.getMonth(), 1);
        // Fin du mois suivant (dernier jour du mois suivant)
        endDate = new Date(today.getFullYear(), today.getMonth() + 2, 0);
        break;
        
      case 'yearly':
        // Début de l'année
        startDate = new Date(today.getFullYear(), 0, 1);
        // Fin de l'année
        endDate = new Date(today.getFullYear(), 11, 31);
        break;
    }

    return {
      start: startDate.toISOString().split('T')[0],
      end: endDate.toISOString().split('T')[0]
    };
  };

  const resetForm = () => {
    const dates = calculatePeriodDates('monthly');
    setFormData({
      employee_name: '',
      objective_type: 'monthly' as 'monthly' | 'weekly' | 'yearly',
      target_type: 'both' as 'commission' | 'sales' | 'both',
      target_amount: '',
      target_sales_count: '',
      period_start: dates.start,
      period_end: dates.end,
      description: '',
      use_custom_dates: false,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Calculer les dates si pas en mode personnalisé
    let finalStartDate = formData.period_start;
    let finalEndDate = formData.period_end;
    
    if (!formData.use_custom_dates) {
      const dates = calculatePeriodDates(formData.objective_type);
      finalStartDate = dates.start;
      finalEndDate = dates.end;
    }
    
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
      period_start: finalStartDate,
      period_end: finalEndDate,
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
      use_custom_dates: true, // En mode édition, on considère que les dates sont personnalisées
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

  const handleArchive = async (id: string) => {
    const objectiveProgress = objectivesProgress.find(op => op.objective.id === id);
    if (!objectiveProgress) return;

    if (window.confirm('Êtes-vous sûr de vouloir archiver cet objectif ? Il sera déplacé vers l\'historique.')) {
      const success = await archiveObjective(
        id,
        objectiveProgress.current_amount,
        objectiveProgress.current_sales_count,
        objectiveProgress.progress_percentage_amount,
        objectiveProgress.progress_percentage_sales,
        objectiveProgress.progress_percentage_amount >= 100 || objectiveProgress.progress_percentage_sales >= 100
      );

      if (success) {
        // Les objectifs seront rechargés automatiquement
      }
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
      <Tabs defaultValue="objectives" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="objectives">Objectifs actifs</TabsTrigger>
          <TabsTrigger value="history">Historique</TabsTrigger>
        </TabsList>
        
        <TabsContent value="objectives" className="space-y-6">
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
                      <Label htmlFor="objective_type">Période</Label>
                      <Select 
                        value={formData.objective_type} 
                        onValueChange={(value: 'monthly' | 'weekly' | 'yearly') => {
                          const dates = calculatePeriodDates(value);
                          setFormData({
                            ...formData, 
                            objective_type: value,
                            period_start: formData.use_custom_dates ? formData.period_start : dates.start,
                            period_end: formData.use_custom_dates ? formData.period_end : dates.end
                          });
                        }}
                      >
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

                    <div className="space-y-4">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id="use_custom_dates"
                          checked={formData.use_custom_dates}
                          onChange={(e) => {
                            const useCustom = e.target.checked;
                            if (!useCustom) {
                              // Recalculer les dates automatiques
                              const dates = calculatePeriodDates(formData.objective_type);
                              setFormData({
                                ...formData, 
                                use_custom_dates: useCustom,
                                period_start: dates.start,
                                period_end: dates.end
                              });
                            } else {
                              setFormData({...formData, use_custom_dates: useCustom});
                            }
                          }}
                          className="rounded border-gray-300"
                        />
                        <Label htmlFor="use_custom_dates" className="text-sm">
                          Utiliser des dates personnalisées
                        </Label>
                      </div>

                      {formData.use_custom_dates && (
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
                      )}

                      {!formData.use_custom_dates && (
                        <div className="text-sm text-muted-foreground bg-blue-50 p-3 rounded-md">
                          📅 <strong>Période automatique :</strong> 
                          {formData.objective_type === 'weekly' && ' Semaine en cours (lundi au dimanche)'}
                          {formData.objective_type === 'monthly' && ' Mois en cours (1er au dernier jour)'}
                          {formData.objective_type === 'yearly' && ' Année en cours (1er janvier au 31 décembre)'}
                          <br />
                          Du {new Date(formData.period_start).toLocaleDateString('fr-FR')} au {new Date(formData.period_end).toLocaleDateString('fr-FR')}
                        </div>
                      )}
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
            <div key={progress.objective.id} className="space-y-3">
              <ObjectiveProgressCard 
                progress={progress} 
                showEmployeeName={isAdmin}
              />
              {isAdmin && (
                <div className="flex justify-end gap-2 px-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleArchive(progress.objective.id)}
                    className="h-8 w-8 p-0 text-orange-600 hover:text-orange-700 sm:w-auto sm:px-3"
                    title="Archiver l'objectif"
                  >
                    <Archive className="h-4 w-4" />
                    <span className="hidden sm:ml-2 sm:inline">Archiver</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(progress.objective)}
                    className="h-8 w-8 p-0 sm:w-auto sm:px-3"
                  >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:ml-2 sm:inline">Éditer</span>
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(progress.objective.id)}
                    className="h-8 w-8 p-0 sm:w-auto sm:px-3"
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="hidden sm:ml-2 sm:inline">Supprimer</span>
                  </Button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
        </TabsContent>
        
        <TabsContent value="history">
          <ObjectiveHistoryView />
        </TabsContent>
      </Tabs>
    </div>
  );
};