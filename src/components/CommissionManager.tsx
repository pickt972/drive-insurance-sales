import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { InsuranceType } from "@/types/database";
import { Euro, Plus, Trash2, Settings, Save } from "lucide-react";

export const CommissionManager = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(false);
  const [newType, setNewType] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchInsuranceTypes();
    // Retry si la première tentative échoue
    const timer = setTimeout(() => {
      if (insuranceTypes.length === 0) {
        fetchInsuranceTypes();
      }
    }, 2000);
    
    return () => clearTimeout(timer);
  }, []);

  const fetchInsuranceTypes = async () => {
    try {
      setLoading(true);
      console.log('🔍 Récupération des types d\'assurance...');

      const { data, error } = await (supabase as any)
        .from('insurance_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) {
        console.error('Erreur lors de la récupération des types d\'assurance:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les types d'assurance",
          variant: "destructive",
        });
        // Ne pas vider la liste en cas d'erreur
        return;
      }

      console.log('✅ Types d\'assurance récupérés:', data?.length || 0, 'éléments');
      setInsuranceTypes((data as InsuranceType[]) || []);
    } catch (error) {
      console.error('Erreur lors de la récupération des types d\'assurance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de récupérer les types d'assurance",
        variant: "destructive",
      });
      // Ne pas vider la liste en cas d'erreur
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateCommission = async (id: string, value: string) => {
    const amount = parseFloat(value);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await (supabase as any)
        .from('insurance_types')
        .update({ commission: amount })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la mise à jour:', error);
        toast({
          title: "Erreur",
          description: "Impossible de mettre à jour la commission",
          variant: "destructive",
        });
        return;
      }

      // Mettre à jour localement
      setInsuranceTypes(prev => 
        prev.map(type => 
          type.id === id ? { ...type, commission: amount } : type
        )
      );

      const insuranceName = insuranceTypes.find(t => t.id === id)?.name || '';
      toast({
        title: "Commission mise à jour",
        description: `${insuranceName}: ${amount.toFixed(2)} €`,
      });
    } catch (error) {
      console.error('Erreur lors de la mise à jour:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commission",
        variant: "destructive",
      });
    }
  };

  const handleAddCommission = async () => {
    if (!newType || !newAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await (supabase as any)
        .from('insurance_types')
        .insert({
          name: newType,
          commission: amount,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur lors de l\'ajout:', error);
        toast({
          title: "Erreur",
          description: "Impossible d'ajouter le type d'assurance",
          variant: "destructive",
        });
        return;
      }

      // Ajouter localement
      setInsuranceTypes(prev => [...prev, data as InsuranceType]);
      setNewType("");
      setNewAmount("");
      
      toast({
        title: "Commission ajoutée",
        description: `${newType}: ${amount.toFixed(2)} €`,
      });
    } catch (error) {
      console.error('Erreur lors de l\'ajout:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le type d'assurance",
        variant: "destructive",
      });
    }
  };

  const handleRemoveCommission = async (id: string) => {
    try {
      const { error } = await (supabase as any)
        .from('insurance_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) {
        console.error('Erreur lors de la suppression:', error);
        toast({
          title: "Erreur",
          description: "Impossible de supprimer le type d'assurance",
          variant: "destructive",
        });
        return;
      }

      // Retirer localement
      const insuranceName = insuranceTypes.find(t => t.id === id)?.name || '';
      setInsuranceTypes(prev => prev.filter(type => type.id !== id));
      
      toast({
        title: "Commission supprimée",
        description: `${insuranceName} a été supprimé`,
      });
    } catch (error) {
      console.error('Erreur lors de la suppression:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le type d'assurance",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Gestion des Commissions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Chargement des commissions...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Gestion des Commissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing commissions */}
        <div className="space-y-4">
          <h3 className="font-medium">Commissions actuelles</h3>
          <div className="space-y-3">
            {insuranceTypes.map((insurance) => (
              <div key={insurance.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{insurance.name}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={insurance.commission}
                    onChange={(e) => handleUpdateCommission(insurance.id, e.target.value)}
                    className="w-20 text-right"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveCommission(insurance.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add new commission */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-medium">Ajouter une nouvelle commission</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-type">Type d'assurance</Label>
              <Input
                id="new-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Ex: Garantie étendue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-amount">Montant (€)</Label>
              <Input
                id="new-amount"
                type="number"
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddCommission}
                className="w-full bg-gradient-primary hover:bg-primary-hover"
                disabled={loading}
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
