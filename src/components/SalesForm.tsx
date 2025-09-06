import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { EMPLOYEES, INSURANCE_TYPES, Employee, InsuranceType } from "@/types/sales";
import { Plus, User, FileText, Shield } from "lucide-react";

interface SalesFormProps {
  onAddSale: (sale: {
    employeeName: string;
    clientName: string;
    reservationNumber: string;
    insuranceTypes: string[];
    date: string;
  }) => void;
}

export const SalesForm = ({ onAddSale }: SalesFormProps) => {
  const [employeeName, setEmployeeName] = useState<string>("");
  const [clientName, setClientName] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const { toast } = useToast();

  const handleInsuranceChange = (insurance: string, checked: boolean) => {
    if (checked) {
      setSelectedInsurances(prev => [...prev, insurance]);
    } else {
      setSelectedInsurances(prev => prev.filter(item => item !== insurance));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!employeeName || !clientName || !reservationNumber || selectedInsurances.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires.",
        variant: "destructive",
      });
      return;
    }

    onAddSale({
      employeeName,
      clientName,
      reservationNumber,
      insuranceTypes: selectedInsurances,
      date,
    });

    // Reset form
    setEmployeeName("");
    setClientName("");
    setReservationNumber("");
    setSelectedInsurances([]);
    setDate(new Date().toISOString().split('T')[0]);

    toast({
      title: "Vente enregistrée",
      description: `Vente ajoutée avec succès pour ${clientName}`,
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
            <div className="space-y-2">
              <Label htmlFor="employee" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Employé *
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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {INSURANCE_TYPES.map((insurance) => (
                <div key={insurance} className="flex items-center space-x-2 p-3 rounded-lg border bg-card">
                  <Checkbox
                    id={insurance}
                    checked={selectedInsurances.includes(insurance)}
                    onCheckedChange={(checked) => 
                      handleInsuranceChange(insurance, checked as boolean)
                    }
                  />
                  <Label 
                    htmlFor={insurance} 
                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {insurance}
                  </Label>
                </div>
              ))}
            </div>
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