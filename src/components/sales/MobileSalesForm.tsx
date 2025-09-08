import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Check, Phone, Mail, FileText } from "lucide-react";
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

                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <Label htmlFor="clientEmail" className="text-xs text-muted-foreground flex items-center gap-1">
                      <Mail className="h-3 w-3" />
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
                    <Label htmlFor="clientPhone" className="text-xs text-muted-foreground flex items-center gap-1">
                      <Phone className="h-3 w-3" />
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

            {/* Type d'assurance */}
            <div>
              <Label htmlFor="insuranceType" className="text-xs text-muted-foreground">
                Type d'assurance *
              </Label>
              <Select value={selectedInsuranceId} onValueChange={setSelectedInsuranceId}>
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Sélectionner une assurance" />
                </SelectTrigger>
                <SelectContent>
                  {insuranceTypes.map((insurance) => (
                    <SelectItem key={insurance.id} value={insurance.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{insurance.name}</span>
                        <Badge variant="outline" className="ml-2">
                          {insurance.commission.toFixed(2)} €
                        </Badge>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Commission preview */}
            {selectedInsurance && (
              <div className="p-3 bg-success-light rounded-lg border border-success/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-success">
                    Commission prévue
                  </span>
                  <span className="text-lg font-bold text-success">
                    {selectedInsurance.commission.toFixed(2)} €
                  </span>
                </div>
              </div>
            )}

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