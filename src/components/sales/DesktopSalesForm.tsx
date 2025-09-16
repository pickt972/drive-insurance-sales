import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, FileText, DollarSign, X, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useSupabaseCommissions } from "@/hooks/useSupabaseCommissions";
import { useToast } from "@/hooks/use-toast";
import { SuccessPopup } from "@/components/ui/success-popup";

const ENCOURAGEMENTS = [
  "Vente d'assurance enregistrée avec succès !",
  "Nouvelle commission ajoutée à votre total !",
  "Client assuré, mission accomplie !",
  "Protection supplémentaire vendue avec brio !",
  "Votre expertise en assurance porte ses fruits !",
  "Commission bien méritée pour cette vente !",
  "Encore une protection de plus pour votre client !",
  "Vente confirmée, commission créditée !",
  "Sécurité renforcée pour votre client !",
  "Parfait, votre portefeuille d'assurances grandit !"
];

interface DesktopSalesFormProps {
  onSaleAdded?: () => void;
}

export const DesktopSalesForm = ({ onSaleAdded }: DesktopSalesFormProps) => {
  const [clientName, setClientName] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsuranceIds, setSelectedInsuranceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  const { profile } = useSupabaseAuth();
  const { insuranceTypes } = useSupabaseCommissions();
  const { toast } = useToast();

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
    
    console.log('🚀 Début de soumission du formulaire');
    console.log('📝 Données du formulaire:', { clientName, reservationNumber, selectedInsuranceIds });
    console.log('👤 Utilisateur actuel:', profile);
    console.log('🛡️ Assurances sélectionnées:', selectedInsurances);
    
    if (!validateForm()) {
      console.log('❌ Validation du formulaire échouée');
      return;
    }
    
    if (!profile) {
      console.log('❌ Aucun utilisateur connecté');
      toast({
        title: "Erreur",
        description: "Utilisateur non connecté",
        variant: "destructive",
      });
      return;
    }
    
    if (selectedInsurances.length === 0) {
      console.log('❌ Aucune assurance sélectionnée');
      return;
    }

    setLoading(true);

    try {
      const totalCommission = selectedInsurances.reduce((sum, ins) => sum + ins.commission, 0);
      
      console.log('💾 Tentative d\'enregistrement:', {
        employee_name: profile.username,
        client_name: clientName.trim(),
        reservation_number: reservationNumber.trim().toUpperCase(),
        insurance_type_id: selectedInsuranceIds[0],
        commission_amount: totalCommission,
        notes: notes.trim() || null,
      });
      
      const { data: sale, error } = await (supabase as any)
        .from('sales')
        .insert({
          employee_name: profile.username,
          client_name: clientName.trim(),
          reservation_number: reservationNumber.trim().toUpperCase(),
          insurance_type_id: selectedInsuranceIds[0],
          commission_amount: totalCommission,
          notes: notes.trim() || null,
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erreur Supabase:', error);
        toast({
          title: "Erreur",
          description: `Impossible d'enregistrer la vente: ${error.message}`,
          variant: "destructive",
        });
        return;
      }
      
      console.log('✅ Vente enregistrée avec succès:', sale);

      // Insérer toutes les assurances sélectionnées dans sale_insurances
      try {
        const items = selectedInsurances.map((ins) => ({
          sale_id: sale.id,
          insurance_type_id: ins.id,
          commission_amount: ins.commission,
        }));
        const { error: siError } = await (supabase as any)
          .from('sale_insurances')
          .insert(items);
        if (siError) {
          console.error('⚠️ Erreur lors de l\'enregistrement des assurances multiples:', siError);
          toast({
            title: 'Assurances partielles enregistrées',
            description: "La vente est enregistrée, mais les assurances multiples n'ont pas toutes été sauvegardées.",
            variant: 'destructive',
          });
        }
      } catch (e) {
        console.error('⚠️ Exception insertion assurances multiples:', e);
      }

      // Message de succès avec animation
      const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      const insuranceNames = selectedInsurances.map(ins => ins.name).join(", ");
      const finalCommission = selectedInsurances.reduce((sum, ins) => sum + ins.commission, 0);
      
      console.log('🎉 SUCCESS - Préparation de l\'animation:', {
        encouragement,
        insuranceNames,
        finalCommission,
        showSuccessPopup: showSuccessPopup
      });
      
      // Afficher la popup de succès
      setSuccessMessage(encouragement);
      setShowSuccessPopup(true);
      
      console.log('🎉 SUCCESS - Animation déclenchée:', {
        successMessage: encouragement,
        showSuccessPopup: true
      });

      resetForm();
      // Ne pas changer d'onglet ici, attendre la fermeture de la popup
      // onSaleAdded?.();
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
    <>
      <SuccessPopup 
        isOpen={showSuccessPopup}
        onClose={() => { setShowSuccessPopup(false); onSaleAdded?.(); }}
        message={successMessage}
      />
      <div className="max-w-4xl mx-auto">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Plus className="h-6 w-6 text-primary" />
            Nouvelle Vente d'Assurance
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Colonne gauche - Informations client */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Informations Client
                  </h3>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="clientName">Nom complet *</Label>
                      <Input
                        id="clientName"
                        value={clientName}
                        onChange={(e) => setClientName(e.target.value)}
                        placeholder="Ex: Dupont Jean"
                        className="mt-1"
                      />
                    </div>

                    <div>
                      <Label htmlFor="reservationNumber">N° de réservation *</Label>
                      <Input
                        id="reservationNumber"
                        value={reservationNumber}
                        onChange={(e) => setReservationNumber(e.target.value)}
                        placeholder="Ex: RES12345"
                        className="mt-1 font-mono"
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="notes">Notes (optionnel)</Label>
                  <Textarea
                    id="notes"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Informations supplémentaires, conditions particulières..."
                    className="mt-1 min-h-[100px]"
                  />
                </div>
              </div>

              {/* Colonne droite - Assurance et commission */}
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <DollarSign className="h-5 w-5 text-primary" />
                    Type d'Assurance
                  </h3>
                  
                   <div className="space-y-3">
                     <Label className="text-sm font-medium">
                       Types d'assurance * (sélection multiple)
                     </Label>
                     <Select 
                       onValueChange={(value) => {
                         if (!selectedInsuranceIds.includes(value)) {
                           setSelectedInsuranceIds([...selectedInsuranceIds, value]);
                         }
                       }}
                     >
                       <SelectTrigger className="w-full">
                         <SelectValue placeholder="Sélectionner une assurance à ajouter" />
                       </SelectTrigger>
                       <SelectContent className="bg-background border shadow-lg z-50">
                         {insuranceTypes
                           .filter(insurance => !selectedInsuranceIds.includes(insurance.id))
                           .map((insurance) => (
                             <SelectItem key={insurance.id} value={insurance.id}>
                               <div className="flex items-center gap-2">
                                 <Shield className="h-4 w-4 text-primary" />
                                 <span>{insurance.name}</span>
                               </div>
                             </SelectItem>
                           ))}
                       </SelectContent>
                     </Select>
                   </div>
                </div>

                {/* Résumé des sélections */}
                {selectedInsurances.length > 0 && (
                  <Card className="bg-gradient-primary">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-sm text-white/80 mb-2">
                          Assurances sélectionnées ({selectedInsurances.length})
                        </div>
                        <div className="flex flex-wrap gap-2 justify-center mb-3">
                          {selectedInsurances.map((insurance) => (
                            <Badge 
                              key={insurance.id} 
                              variant="secondary" 
                              className="flex items-center gap-2"
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
                        <div className="text-2xl font-bold text-white mb-2">
                          {selectedInsurances.reduce((sum, ins) => sum + ins.commission, 0).toFixed(2)} €
                        </div>
                        <div className="text-sm text-white/80">
                          Commission totale prévue
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

              </div>
            </div>

            {/* Bouton de soumission */}
            <div className="pt-6 border-t">
              <Button
                type="submit"
                className="w-full lg:w-auto lg:min-w-[200px] primary-button h-12 text-base font-medium"
                disabled={loading}
                size="lg"
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
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
    </>
  );
};