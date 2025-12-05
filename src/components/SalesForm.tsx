import React, { useState, useEffect, useMemo, useRef } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Calendar } from "@/components/ui/calendar";
import { Progress } from "@/components/ui/progress";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Plus, Calculator, CalendarIcon, TrendingUp, Target, Trophy, Lightbulb, HelpCircle } from "lucide-react";
import { SalesPitchGenerator } from "@/components/SalesPitchGenerator";
import { FAQViewer } from "@/components/FAQViewer";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";
import { useSales } from "@/hooks/useSales";
import { useInsuranceTypes, InsuranceType } from "@/hooks/useInsuranceTypes";
import { useAppSettings } from "@/hooks/useAppSettings";
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
  const [saleDate, setSaleDate] = useState<Date>(new Date());
  const [showCelebration, setShowCelebration] = useState(false);
  const [lastSaleAmount, setLastSaleAmount] = useState(0);
  const [insuranceTypesLocal, setInsuranceTypesLocal] = useState<InsuranceType[]>([]);
  const [objectiveReachedNotified, setObjectiveReachedNotified] = useState(false);
  
  const { profile } = useAuth();
  const { sales, addSale, loading: saleLoading, fetchSales } = useSales();
  const { insuranceTypes, loading: insuranceLoading } = useInsuranceTypes();
  const { settings: appSettings } = useAppSettings();

  const loading = saleLoading || insuranceLoading;
  const dailyObjective = appSettings.daily_objective || 5;

  // Charger les types d'assurance au montage
  useEffect(() => {
    setInsuranceTypesLocal(insuranceTypes);
  }, [insuranceTypes]);

  // Récapitulatif des ventes du jour
  const todaySummary = useMemo(() => {
    const today = format(new Date(), 'yyyy-MM-dd');
    const todaySales = sales.filter(sale => sale.sale_date === today);
    const totalCommission = todaySales.reduce((sum, sale) => sum + (sale.commission || 0), 0);
    const progress = Math.min((todaySales.length / dailyObjective) * 100, 100);
    return {
      count: todaySales.length,
      totalCommission: Math.round(totalCommission * 100) / 100,
      progress,
      objective: dailyObjective,
      isComplete: todaySales.length >= dailyObjective,
    };
  }, [sales, dailyObjective]);

  // Notification quand l'objectif est atteint
  useEffect(() => {
    if (todaySummary.isComplete && !objectiveReachedNotified) {
      setObjectiveReachedNotified(true);
      toast({
        title: "🏆 Objectif atteint !",
        description: `Félicitations ! Vous avez atteint votre objectif de ${dailyObjective} ventes aujourd'hui !`,
        duration: 8000,
      });
    }
    // Reset notification flag at midnight
    if (!todaySummary.isComplete && objectiveReachedNotified) {
      setObjectiveReachedNotified(false);
    }
  }, [todaySummary.isComplete, objectiveReachedNotified, dailyObjective]);

  // Calcul de la commission simulée (uniquement commissions fixes)
  const simulatedCommission = useMemo(() => {
    return selectedInsurances.map(insuranceName => {
      const insurance = insuranceTypesLocal.find(ins => ins.name === insuranceName);
      if (!insurance) return { name: insuranceName, commission: 0, id: '' };
      
      // Utiliser le montant fixe de commission
      const commission = insurance.commission_amount || 0;
      
      return {
        name: insuranceName,
        commission: Math.round(commission * 100) / 100,
        id: insurance.id,
      };
    });
  }, [selectedInsurances, insuranceTypesLocal]);

  const totalSimulatedCommission = useMemo(() => {
    return simulatedCommission.reduce((sum, item) => sum + item.commission, 0);
  }, [simulatedCommission]);

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

    try {
      const previousCount = todaySummary.count;
      
      // Créer une vente pour chaque assurance sélectionnée
      const salePromises = simulatedCommission.map(async (insuranceItem) => {
        return addSale({
          sale_date: format(saleDate, 'yyyy-MM-dd'),
          employee_id: profile?.id || '',
          employee_name: profile?.full_name || '',
          insurance_type: insuranceItem.name,
          insurance_type_id: insuranceItem.id,
          contract_number: reservationNumber,
          amount: insuranceItem.commission,
          commission: insuranceItem.commission,
          customer_name: clientName,
          vehicle_type: null,
          rental_duration_days: 1,
          notes: notes || null,
        });
      });

      await Promise.all(salePromises);

      // Vérifier si l'objectif vient d'être atteint avec cette vente
      const newCount = previousCount + selectedInsurances.length;
      if (newCount >= dailyObjective && previousCount < dailyObjective) {
        // La notification sera affichée via le useEffect
      }

      // Déclencher l'animation de célébration
      setLastSaleAmount(totalSimulatedCommission);
      setShowCelebration(true);

    } catch (error) {
      console.error('Error creating sales:', error);
    }
  };

  // Handler quand la célébration se ferme
  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setClientName("");
    setReservationNumber("");
    setSelectedInsurances([]);
    setNotes("");
    setSaleDate(new Date());
    fetchSales();
    onSaleAdded();
  };

  // Couleur de la barre de progression
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return "bg-emerald-500";
    if (progress >= 75) return "bg-blue-500";
    if (progress >= 50) return "bg-yellow-500";
    return "bg-orange-500";
  };

  return (
    <div className="modern-form animate-gentle-fade-in max-w-4xl mx-auto w-full overflow-x-hidden">
      {/* Récapitulatif du jour avec objectif */}
      <div className={cn(
        "modern-card p-4 mb-6 border",
        todaySummary.isComplete 
          ? "bg-gradient-to-r from-emerald-500/20 to-yellow-500/10 border-emerald-500/30" 
          : "bg-gradient-to-r from-emerald-500/10 to-blue-500/10 border-emerald-500/20"
      )}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={cn(
              "p-2 rounded-full",
              todaySummary.isComplete ? "bg-emerald-500/30" : "bg-emerald-500/20"
            )}>
              {todaySummary.isComplete ? (
                <Trophy className="h-5 w-5 text-yellow-600" />
              ) : (
                <TrendingUp className="h-5 w-5 text-emerald-600" />
              )}
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Vos ventes aujourd'hui</p>
              <p className="text-lg font-bold text-foreground">
                {todaySummary.count} vente{todaySummary.count > 1 ? 's' : ''}
                {todaySummary.isComplete && " 🏆"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Commission du jour</p>
            <p className="text-xl font-bold text-emerald-600">
              {todaySummary.totalCommission.toFixed(2)} €
            </p>
          </div>
        </div>
        
        {/* Objectif journalier */}
        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium">Objectif journalier</span>
            </div>
            <span className={cn(
              "text-sm font-bold",
              todaySummary.isComplete && "text-emerald-600"
            )}>
              {todaySummary.count} / {todaySummary.objective}
              {todaySummary.isComplete && " ✓"}
            </span>
          </div>
          <div className="relative h-3 bg-muted rounded-full overflow-hidden">
            <div 
              className={cn(
                "absolute top-0 left-0 h-full rounded-full transition-all duration-500",
                getProgressColor(todaySummary.progress)
              )}
              style={{ width: `${todaySummary.progress}%` }}
            />
          </div>
          <p className={cn(
            "text-xs mt-1 text-center",
            todaySummary.isComplete ? "text-emerald-600 font-medium" : "text-muted-foreground"
          )}>
            {todaySummary.isComplete 
              ? "🎉 Objectif atteint ! Bravo ! Continuez comme ça ! 🎉" 
              : `Plus que ${todaySummary.objective - todaySummary.count} vente${todaySummary.objective - todaySummary.count > 1 ? 's' : ''} pour atteindre votre objectif`}
          </p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-6 lg:mb-8">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="icon-wrapper">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl lg:text-3xl font-bold gradient-text">✨ Nouvelle Vente</h2>
        </div>
        <FAQViewer />
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6">
          <div className="space-y-2">
            <Label htmlFor="clientName" className="text-sm lg:text-base font-bold text-foreground">👤 Nom du client <span className="text-destructive">*</span></Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client"
              className="friendly-input text-sm lg:text-base h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservationNumber" className="text-sm lg:text-base font-bold text-foreground">🎫 N° de réservation <span className="text-destructive">*</span></Label>
            <Input
              id="reservationNumber"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="Ex: LOC-2024-001"
              className="friendly-input text-sm lg:text-base h-11"
              required
            />
          </div>

          <div className="space-y-2">
            <Label className="text-sm lg:text-base font-bold text-foreground">📅 Date de vente</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full h-11 justify-start text-left font-normal friendly-input",
                    !saleDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {saleDate ? format(saleDate, "dd MMMM yyyy", { locale: fr }) : "Sélectionner une date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={saleDate}
                  onSelect={(date) => date && setSaleDate(date)}
                  disabled={(date) => date > new Date()}
                  initialFocus
                  locale={fr}
                  className={cn("p-3 pointer-events-auto")}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-sm lg:text-base font-bold text-foreground">
            🛡️ Assurances souscrites <span className="text-destructive">*</span>
            {selectedInsurances.length > 0 && (
              <span className="ml-2 text-primary font-normal">
                ({selectedInsurances.length} sélectionnée{selectedInsurances.length > 1 ? 's' : ''})
              </span>
            )}
          </Label>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4">
              {insuranceTypesLocal.filter(ins => ins.is_active).map((insurance) => (
                <div 
                  key={insurance.id} 
                  className={cn(
                    "modern-card p-3 lg:p-4 cursor-pointer hover:scale-105 transition-all duration-300 group",
                    selectedInsurances.includes(insurance.name) && "ring-2 ring-primary bg-primary/5"
                  )}
                  onClick={() => {
                    if (selectedInsurances.includes(insurance.name)) {
                      setSelectedInsurances(selectedInsurances.filter(name => name !== insurance.name));
                    } else {
                      setSelectedInsurances([...selectedInsurances, insurance.name]);
                    }
                  }}
                >
                  <div className="flex items-center justify-between">
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
                        onClick={(e) => e.stopPropagation()}
                      />
                      <Label className="font-semibold text-sm lg:text-base group-hover:text-primary transition-colors duration-300 cursor-pointer">
                        {insurance.name}
                      </Label>
                    </div>
                    <div onClick={(e) => e.stopPropagation()}>
                      <SalesPitchGenerator 
                        insuranceType={insurance.name}
                        insuranceDescription={insurance.description}
                      />
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="notes" className="text-sm lg:text-base font-bold text-foreground">📝 Notes (optionnel)</Label>
            <Input
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations complémentaires..."
              className="friendly-input text-sm lg:text-base h-11"
            />
        </div>

        {selectedInsurances.length > 0 && (
          <div className="modern-card p-4 lg:p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30">
            <div className="flex items-center gap-2 mb-3">
              <Calculator className="h-5 w-5 text-primary" />
              <span className="text-base lg:text-lg font-semibold text-primary">
                Commission estimée ({selectedInsurances.length} assurance{selectedInsurances.length > 1 ? 's' : ''})
              </span>
            </div>
            
            <div className="space-y-2 mb-4">
              {simulatedCommission.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm bg-background/50 rounded-lg p-2">
                  <span className="font-medium">{item.name}</span>
                  <span className="font-semibold text-success">+{item.commission.toFixed(2)} €</span>
                </div>
              ))}
            </div>
            
            <div className="flex items-center justify-between pt-3 border-t border-primary/20">
              <span className="text-base lg:text-lg font-semibold text-success">💰 Commission totale</span>
              <span className="text-xl lg:text-2xl font-bold text-success animate-gentle-bounce">
                {totalSimulatedCommission.toFixed(2)} €
              </span>
            </div>
          </div>
        )}

        <Button 
          type="submit" 
          className="modern-button w-full h-12 lg:h-14 text-base lg:text-lg font-bold" 
          disabled={loading}
        >
          {loading ? "🔄 Enregistrement..." : `🚀 Enregistrer ${selectedInsurances.length > 1 ? `les ${selectedInsurances.length} ventes` : 'la vente'}`}
        </Button>
      </form>
      
      {/* Animation de célébration */}
      <CelebrationPopup
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        saleAmount={lastSaleAmount}
      />
    </div>
  );
};
