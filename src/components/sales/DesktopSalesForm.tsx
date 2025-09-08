import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Phone, Mail, FileText, DollarSign } from "lucide-react";
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

interface DesktopSalesFormProps {
  onSaleAdded?: () => void;
}

export const DesktopSalesForm = ({ onSaleAdded }: DesktopSalesFormProps) => {
  const [clientName, setClientName] = useState("");
  const [clientEmail, setClientEmail] = useState("");
  const [clientPhone, setClientPhone] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsuranceId, setSelectedInsuranceId] = useState("");
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  
  const { profile } = useSupabaseAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchInsuranceTypes();
  }, []);

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

  const selectedInsurance = insuranceTypes.find(ins => ins.id === selectedInsuranceId);

  const resetForm = () => {
    setClientName("");
    setClientEmail("");
    setClientPhone("");
    setReservationNumber("");
    setSelectedInsuranceId("");
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

    if (!selectedInsuranceId) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un type d'assurance",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm() || !profile || !selectedInsurance) return;

    setLoading(true);

    try {
      const { error } = await supabase
        .from('sales')
        .insert({
          employee_id: profile.user_id,
          client_name: clientName.trim(),
          client_email: clientEmail.trim() || null,
          client_phone: clientPhone.trim() || null,
          reservation_number: reservationNumber.trim().toUpperCase(),
          insurance_type_id: selectedInsuranceId,
          commission_amount: selectedInsurance.commission,
          notes: notes.trim() || null,
        });

      if (error) {
        toast({
          title: "Erreur",
          description: "Impossible d'enregistrer la vente",
          variant: "destructive",
        });
        return;
      }

      // Message de succès amusant
      const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
      
      toast({
        title: encouragement,
        description: `Commission de ${selectedInsurance.commission.toFixed(2)} € ajoutée ! 🚀`,
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

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="clientEmail" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          Email (optionnel)
                        </Label>
                        <Input
                          id="clientEmail"
                          type="email"
                          value={clientEmail}
                          onChange={(e) => setClientEmail(e.target.value)}
                          placeholder="client@email.com"
                          className="mt-1"
                        />
                      </div>

                      <div>
                        <Label htmlFor="clientPhone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          Téléphone (optionnel)
                        </Label>
                        <Input
                          id="clientPhone"
                          type="tel"
                          value={clientPhone}
                          onChange={(e) => setClientPhone(e.target.value)}
                          placeholder="06 12 34 56 78"
                          className="mt-1"
                        />
                      </div>
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
                  
                  <div>
                    <Label htmlFor="insuranceType">Sélectionner une assurance *</Label>
                    <Select value={selectedInsuranceId} onValueChange={setSelectedInsuranceId}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choisir le type d'assurance" />
                      </SelectTrigger>
                      <SelectContent>
                        {insuranceTypes.map((insurance) => (
                          <SelectItem key={insurance.id} value={insurance.id}>
                            <div className="flex items-center justify-between w-full">
                              <span className="font-medium">{insurance.name}</span>
                              <Badge variant="outline" className="ml-3">
                                {insurance.commission.toFixed(2)} €
                              </Badge>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                {/* Preview de la commission */}
                {selectedInsurance && (
                  <Card className="bg-gradient-success border-success/20">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="text-sm text-success-foreground/80 mb-2">
                          Commission prévue
                        </div>
                        <div className="text-3xl font-bold text-white mb-2">
                          {selectedInsurance.commission.toFixed(2)} €
                        </div>
                        <div className="text-sm text-success-foreground/80">
                          pour {selectedInsurance.name}
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
  );
};