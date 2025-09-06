import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { useCommissions } from "@/hooks/useCommissions";
import { EMPLOYEES, ENCOURAGEMENTS } from "@/types/sales";
import { Plus, User, FileText, Shield, Euro } from "lucide-react";

interface SalesFormProps {
  onAddSale: (sale: {
    employeeName: string;
    clientName: string;
    reservationNumber: string;
    insuranceTypes: string[];
    date: string;
  }) => void;
  currentUser?: string;
  isAdmin?: boolean;
}

export const SalesForm = ({ onAddSale, currentUser, isAdmin }: SalesFormProps) => {
  const [employeeName, setEmployeeName] = useState<string>(currentUser || "");
  const [clientName, setClientName] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();
  const { commissions, calculateTotal, getCommissionTypes } = useCommissions();

  const handleInsuranceChange = (insurance: string, checked: boolean) => {
    if (checked) {
      setSelectedInsurances(prev => [...prev, insurance]);
    } else {
      setSelectedInsurances(prev => prev.filter(item => item !== insurance));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const finalEmployeeName = isAdmin && employeeName ? employeeName : currentUser || "";
    
    if (!finalEmployeeName || !clientName || !reservationNumber || selectedInsurances.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    // Input validation
    if (clientName.trim().length < 2) {
      toast({
        title: "Erreur",
        description: "Le nom du client doit contenir au moins 2 caractères",
        variant: "destructive",
      });
      return;
    }

    if (reservationNumber.trim().length < 3) {
      toast({
        title: "Erreur",
        description: "Le numéro de réservation doit contenir au moins 3 caractères",
        variant: "destructive",
      });
      return;
    }

    const totalCommission = calculateTotal(selectedInsurances);
    
    onAddSale({
      employeeName: finalEmployeeName,
      clientName: clientName.trim(),
      reservationNumber: reservationNumber.trim().toUpperCase(),
      insuranceTypes: selectedInsurances,
      date,
    });

    // Reset form
    if (!isAdmin) {
      setEmployeeName(currentUser || "");
    } else {
      setEmployeeName("");
    }
    setClientName("");
    setReservationNumber("");
    setSelectedInsurances([]);
    setDate(new Date().toISOString().split('T')[0]);

    // Encouraging toast message
    const encouragement = ENCOURAGEMENTS[Math.floor(Math.random() * ENCOURAGEMENTS.length)];
    toast({
      title: encouragement,
      description: `Commission: ${totalCommission.toFixed(2)} € • ${finalEmployeeName}`,
      variant: "default",
    });
  };

  return (
    <Card className="shadow-card bg-gradient-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Nouvelle vente d'assurance
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {isAdmin && (
              <div className="space-y-2">
                <Label htmlFor="employee" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Employé concerné *
                </Label>
                <Select value={employeeName} onValueChange={setEmployeeName}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un employé" />
                  </SelectTrigger>
                  <SelectContent>
                    {EMPLOYEES.map((employee) => (
                      <SelectItem key={employee} value={employee}>
                        {employee}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="client" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom du client *
              </Label>
              <Input
                id="client"
                value={clientName}
                onChange={(e) => setClientName(e.target.value)}
                placeholder="Nom complet du client"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="reservation" className="flex items-center gap-2">
                <FileText className="h-4 w-4" />
                N° de réservation *
              </Label>
              <Input
                id="reservation"
                value={reservationNumber}
                onChange={(e) => setReservationNumber(e.target.value)}
                placeholder="Numéro de réservation"
              />
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Assurances vendues *
            </Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {getCommissionTypes().map((insurance) => (
                <div key={insurance} className="flex items-center space-x-2 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id={insurance}
                    checked={selectedInsurances.includes(insurance)}
                    onCheckedChange={(checked) => 
                      handleInsuranceChange(insurance, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label 
                      htmlFor={insurance} 
                      className="text-sm font-medium leading-none cursor-pointer"
                    >
                      {insurance}
                    </Label>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                      <Euro className="h-3 w-3" />
                      <span>{commissions[insurance]?.toFixed(2)} €</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {selectedInsurances.length > 0 && (
              <div className="p-3 bg-primary/10 border border-primary/20 rounded-lg">
                <div className="flex items-center gap-2 text-sm font-medium text-primary">
                  <Euro className="h-4 w-4" />
                  Total commission: {calculateTotal(selectedInsurances).toFixed(2)} €
                </div>
              </div>
            )}
          </div>

          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:bg-primary-hover transition-all duration-200"
          >
            <Plus className="mr-2 h-4 w-4" />
            Enregistrer la vente
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};