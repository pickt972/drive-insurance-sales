import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, FileText, X, Shield } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { InsuranceType } from "@/types/database";
import { useSalesData } from "@/hooks/useSalesData";

const ENCOURAGEMENTS = [
  "🎉 Fantastique ! Ta vente a été enregistrée !",
  "💪 Excellent travail ! Tu es sur la bonne voie !",
  "🚀 Bravo ! Encore une vente de plus !",
  "💰 Superbe ! Ta commission est ajoutée !",
  "⭐ Génial ! Continue comme ça !",
  "🏆 Champion ! Tes efforts paient !",
  "🎯 Parfait ! Tu vises dans le mille !",
  "💎 Top ! Qualité premium comme toujours !",
  "🔥 En feu ! Tu déchires tout !",
  "🌟 Magnifique ! Tu es une star !"
];

interface MobileSalesFormProps {
  onSaleAdded?: () => void;
}

// Composant d'animation de confettis
const ConfettiAnimation = () => {
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(50)].map((_, i) => (
        <div
          key={i}
          className="absolute w-3 h-3 animate-ping"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 20}%`,
            backgroundColor: ['#FFD700', '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#FF8A80', '#C5E1A5'][Math.floor(Math.random() * 8)],
            animationDelay: `${Math.random() * 1}s`,
            animationDuration: `${0.8 + Math.random() * 1.2}s`,
            transform: `rotate(${Math.random() * 360}deg)`,
            borderRadius: Math.random() > 0.5 ? '50%' : '0%',
            animationName: 'confetti-fall',
            animationTimingFunction: 'ease-out',
            animationFillMode: 'forwards'
          }}
        />
      ))}
      <style>
        {`
          @keyframes confetti-fall {
            0% {
              transform: translateY(-100vh) rotate(0deg);
              opacity: 1;
            }
            100% {
              transform: translateY(100vh) rotate(720deg);
              opacity: 0;
            }
          }
        `}
      </style>
    </div>
  );
};

export const MobileSalesForm = ({ onSaleAdded }: MobileSalesFormProps) => {
  const [clientName, setClientName] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsuranceIds, setSelectedInsuranceIds] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [showConfetti, setShowConfetti] = useState(false);
  
  const { currentUser } = useAuth();
  const { addSale } = useSalesData();
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
    
    console.log('🚀 Début de soumission du formulaire');
    console.log('📝 Données du formulaire:', { clientName, reservationNumber, selectedInsuranceIds });
    console.log('👤 Utilisateur actuel:', currentUser);
    console.log('🛡️ Assurances sélectionnées:', selectedInsurances);
    
    if (!validateForm()) {
      console.log('❌ Validation du formulaire échouée');
      return;
    }
    
    if (!currentUser) {
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
        employee_name: currentUser.username,
        client_name: clientName.trim(),
        reservation_number: reservationNumber.trim().toUpperCase(),
        insurance_type_id: selectedInsuranceIds[0],
        commission_amount: totalCommission,
        notes: notes.trim() || null,
      });
      
      const { data: sale, error } = await supabase
        .from('sales')
        .insert({
          employee_name: currentUser.username,
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
      
      // Message de succès avec animation
      const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      const finalCommission = selectedInsurances.reduce((sum, ins) => sum + ins.commission, 0);
      
      // Déclencher l'animation de confettis
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 3000);
      
      toast({
        title: encouragement,
        description: `${selectedInsurances.map(ins => ins.name).join(", ")} - Commission de ${finalCommission.toFixed(2)} € ajoutée ! 🎊`,
        className: "success-toast border-green-500 bg-green-50",
        duration: 5000,
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
    <>
      {showConfetti && <ConfettiAnimation />}
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
                <Select 
                  onValueChange={(value) => {
                    if (!selectedInsuranceIds.includes(value)) {
                      setSelectedInsuranceIds([...selectedInsuranceIds, value]);
                    }
                  }}
                >
                  <SelectTrigger className="w-full mt-2">
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
    </>
  );
};