import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { CelebrationPopup } from "@/components/ui/celebration-popup";

interface SalesFormProps {
  onSaleAdded: () => void;
}

export const SalesForm = ({ onSaleAdded }: SalesFormProps) => {
  const [clientName, setClientName] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSaleAmount, setLastSaleAmount] = useState(0);
  
  const { profile, insuranceTypes, addSale } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !reservationNumber || selectedInsurances.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      const totalCommission = selectedInsurances.reduce((sum, insuranceName) => {
        const insurance = insuranceTypes.find(ins => ins.name === insuranceName);
        return sum + (insurance?.commission || 0);
      }, 0);

      const result = await addSale({
        employeeName: profile?.username || '',
        clientName,
        reservationNumber,
        insuranceTypes: selectedInsurances,
        commissionAmount: totalCommission,
        notes: notes || undefined
      });

      if (result.success) {
        // Déclencher l'animation de célébration
        setLastSaleAmount(totalCommission);
        setShowCelebration(true);
        
        // Réinitialiser le formulaire après un délai
        setTimeout(() => {
          setClientName("");
          setReservationNumber("");
          setSelectedInsurances([]);
          setNotes("");
          onSaleAdded();
        }, 6200); // Attendre que l'animation se termine
      }

    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la vente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modern-form animate-gentle-fade-in max-w-4xl mx-auto">
      <div className="flex items-center gap-3 lg:gap-4 mb-6 lg:mb-8">
        <div className="icon-wrapper">
          <Plus className="h-6 w-6 text-primary" />
        </div>
        <h2 className="text-xl lg:text-3xl font-bold gradient-text">✨ Nouvelle Vente</h2>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm lg:text-base font-semibold text-foreground">👤 Nom du client *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client"
              className="friendly-input text-sm lg:text-base"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservationNumber" className="text-sm lg:text-base font-semibold text-foreground">🎫 N° de réservation *</Label>
            <Input
              id="reservationNumber"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="Ex: LOC-2024-001"
              className="friendly-input text-sm lg:text-base"
              required
            />
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm lg:text-base font-semibold text-foreground">🛡️ Assurances souscrites *</Label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              {insuranceTypes.filter(ins => ins.isActive).map((insurance) => (
              <div key={insurance.id} className="modern-card p-3 lg:p-4 cursor-pointer hover:scale-105 transition-all duration-300 group">
                <div className="flex items-center space-x-3 lg:space-x-4">
                  <Checkbox
                    checked={selectedInsurances.includes(insurance.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedInsurances([...selectedInsurances, insurance.name]);
                      } else {
                        setSelectedInsurances(selectedInsurances.filter(name => name !== insurance.name));
                      }
                    }}
                    className="scale-110 lg:scale-125"
                  />
                  <div className="flex-1">
                    <Label className="font-semibold text-sm lg:text-base group-hover:text-primary transition-colors duration-300">{insurance.name}</Label>
                    <div className="success-indicator mt-1 lg:mt-2 text-xs lg:text-sm">
                      <span className="font-bold">+{insurance.commission.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              </div>
              ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm lg:text-base font-semibold text-foreground">📝 Notes (optionnel)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              className="friendly-input text-sm lg:text-base"
            />
        </div>

        {selectedInsurances.length > 0 && (
          <div className="modern-card p-4 lg:p-6 bg-gradient-to-r from-success/10 to-success/5 border-success/30 animate-gentle-bounce">
            <div className="flex items-center justify-between">
              <span className="text-base lg:text-lg font-semibold text-success">💰 Commission totale</span>
              <span className="text-xl lg:text-2xl font-bold text-success">
                {selectedInsurances.reduce((sum, insuranceName) => {
                  const insurance = insuranceTypes.find(ins => ins.name === insuranceName);
                  return sum + (insurance?.commission || 0);
                }, 0).toFixed(2)} €
              </span>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="modern-button w-full py-3 lg:py-4 text-base lg:text-lg font-bold" 
          disabled={loading}
        >
          {loading ? "🔄 Enregistrement..." : "🚀 Enregistrer la vente"}
        </Button>
      </form>
      
      {/* Animation de célébration */}
      <CelebrationPopup
        isOpen={showCelebration}
        onClose={() => setShowCelebration(false)}
        saleAmount={lastSaleAmount}
      />
    </div>
  );
};