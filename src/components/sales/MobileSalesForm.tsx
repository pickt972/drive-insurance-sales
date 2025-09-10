import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Phone, Mail, FileText, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { InsuranceType } from "@/types/database";

const ENCOURAGEMENTS = [
  "🎉 Excellent ! Ta vente a été enregistrée avec succès !",
  "💪 Bravo, ta performance est remarquable !",
  "🚀 Encore une vente ! Tu es en feu !",
  "💰 Commission enregistrée. Direction le sommet !",
  "⭐ Bien joué, chaque vente compte !",
  "🏆 Tes efforts paient, continue sur cette lancée !",
  "🎯 Parfait ! Tu vises juste !",
  "💎 Qualité premium, comme d'habitude !"
];

interface MobileSalesFormProps {
  onSaleAdded?: () => void;
}

export const MobileSalesForm = ({ onSaleAdded }: MobileSalesFormProps) => {
  const [clientName, setClientName] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsuranceIds, setSelectedInsuranceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  
  const { profile } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchInsuranceTypes();
  }, []);

  // Fonction pour rafraîchir les types d'assurance
  const refreshInsuranceTypes = () => {
    fetchInsuranceTypes();
  };

  const fetchInsuranceTypes = async () => {
    try {
      console.log('🔍 Récupération des types d\'assurance...');
      
      const { data, error } = await (supabase as any)
        .schema('api')
        .from('insurance_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('❌ Erreur lors de la récupération des types d\'assurance:', error);
        toast({
          title: "Erreur",
          description: "Impossible de charger les types d'assurance",
          variant: "destructive",
        });
        return;
      }

      console.log('✅ Types d\'assurance récupérés:', data?.length || 0, 'éléments');
      setInsuranceTypes((data as InsuranceType[]) || []);
    } catch (error) {
      console.error('❌ Erreur:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement",
        variant: "destructive",
      });
    }
  };

  const selectedInsurances = insuranceTypes.filter(ins => selectedInsuranceIds.includes(ins.id));

  const resetForm = () => {
    setClientName("");
    setReservationNumber("");
    setSelectedInsuranceIds([]);
    setNotes("");
  };

  const validateForm = () => {
    if (!clientName.trim()) {
      toast({
        title: "Erreur",
        description: "Le nom du client est requis",
        variant: "destructive",
      });
      return false;
    }

    if (!reservationNumber.trim()) {
      toast({
        title: "Erreur",
        description: "Le numéro de réservation est requis",
        variant: "destructive",
      });
      return false;
    }

    if (selectedInsuranceIds.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner au moins un type d'assurance",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !profile || selectedInsurances.length === 0) return;

    setLoading(true);

    try {
      const totalCommission = selectedInsurances.reduce((sum, ins) => sum + ins.commission, 0);
      
      const { data: sale, error } = await (supabase as any)
        .schema('api')
        .from('sales')
        .insert({
          employee_id: profile.user_id,
          client_name: clientName.trim(),
          reservation_number: reservationNumber.trim().toUpperCase(),
          insurance_type_id: selectedInsuranceIds[0], // Premier pour compatibilité
          commission_amount: totalCommission,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer la vente",
          variant: "destructive",
        });
        return;
      }

      // Pour l'instant, on simplifie sans la table sale_insurances
      // car elle n'est pas dans les types générés

      // Message de succès amusant
      const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      const insuranceNames = selectedInsurances.map(ins => ins.name).join(", ");
      const finalCommission = selectedInsurances.reduce((sum, ins) => sum + ins.commission, 0);
      
      toast({
        title: encouragement,
        description: `${insuranceNames} - Commission de ${finalCommission.toFixed(2)} € ajoutée ! 🚀`,
        className: "success-toast",
      });

      resetForm();
      onSaleAdded?.();
    } catch (error) {
      console.error('Erreur lors de l\'ajout de la vente:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4 animate-fadeInUp">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <Plus className="h-5 w-5 text-primary" />
            Nouvelle Vente
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Informations client */}
            <div className="space-y-3">
              <Label className="text-sm font-medium flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Informations Client
              </Label>
              
              <div className="space-y-3">
                <div>
                  <Label htmlFor="clientName" className="text-xs text-muted-foreground">
                    Nom complet *
                  </Label>
                  <Input
                    id="clientName"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="Ex: Dupont Jean"
                    className="mt-1"
                  />
                </div>

              </div>
            </div>

            {/* Réservation */}
            <div>
              <Label htmlFor="reservationNumber" className="text-xs text-muted-foreground">
                N° de réservation *
              </Label>
              <Input
                id="reservationNumber"
                value={reservationNumber}
                onChange={(e) => setReservationNumber(e.target.value)}
                placeholder="Ex: RES12345"
                className="mt-1 font-mono"
              />
            </div>

            {/* Types d'assurance */}
            <div>
              <Label className="text-xs text-muted-foreground">
                Types d'assurance * (sélection multiple)
              </Label>
              <div className="mt-2 space-y-2">
                {insuranceTypes.map((insurance) => (
                  <div key={insurance.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-accent/50 transition-colors">
                    <Checkbox
                      id={insurance.id}
                      checked={selectedInsuranceIds.includes(insurance.id)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedInsuranceIds([...selectedInsuranceIds, insurance.id]);
                        } else {
                          setSelectedInsuranceIds(selectedInsuranceIds.filter(id => id !== insurance.id));
                        }
                      }}
                    />
                    <Label htmlFor={insurance.id} className="flex-1 cursor-pointer">
                      <span>{insurance.name}</span>
                    </Label>
                  </div>
                ))}
              </div>
              
              {/* Résumé des sélections */}
              {selectedInsurances.length > 0 && (
                <div className="mt-3 p-3 bg-primary-light rounded-lg">
                  <div className="text-sm font-medium text-primary mb-2">
                    Assurances sélectionnées ({selectedInsurances.length})
                  </div>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {selectedInsurances.map((insurance) => (
                      <Badge 
                        key={insurance.id} 
                        variant="secondary" 
                        className="flex items-center gap-1"
                      >
                        {insurance.name}
                        <button
                          type="button"
                          onClick={() => setSelectedInsuranceIds(selectedInsuranceIds.filter(id => id !== insurance.id))}
                          className="ml-1 hover:bg-destructive/10 rounded-full p-0.5"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </Badge>
                    ))}
                  </div>
                  <div className="text-sm font-bold text-primary">
                    Commission totale: {selectedInsurances.reduce((sum, ins) => sum + ins.commission, 0).toFixed(2)} €
                  </div>
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <Label htmlFor="notes" className="text-xs text-muted-foreground">
                Notes (optionnel)
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Informations supplémentaires..."
                className="mt-1 resize-none"
                rows={3}
              />
            </div>

            {/* Bouton de soumission */}
            <Button
              type="submit"
              className="w-full primary-button h-12 text-base font-medium"
              disabled={loading}
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Enregistrement...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="h-5 w-5" />
                  Enregistrer la vente
                </div>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};