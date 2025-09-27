import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Save } from "lucide-react";
import { useFirebase } from "@/hooks/useFirebase";
import { Sale } from "@/types";

interface SalesFormProps {
  onSaleAdded: () => void;
}

export const SalesForm = ({ onSaleAdded }: SalesFormProps) => {
  const [clientName, setClientName] = useState("");
  const [reservationNumber, setReservationNumber] = useState("");
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { profile, insuranceTypes, addSale } = useFirebase();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!clientName || !reservationNumber || selectedInsurances.length === 0) {
      return;
    }

    setLoading(true);

    const totalCommission = selectedInsurances.reduce((sum, insuranceName) => {
      const insurance = insuranceTypes.find(ins => ins.name === insuranceName);
      return sum + (insurance?.commission || 0);
    }, 0);

    const saleData: Omit<Sale, 'id'> = {
      employeeName: profile?.username || '',
      clientName,
      reservationNumber: reservationNumber.toUpperCase(),
      insuranceTypes: selectedInsurances,
      commissionAmount: totalCommission,
      createdAt: new Date().toISOString()
    };

    const result = await addSale(saleData);
    
    if (result.success) {
      setClientName("");
      setReservationNumber("");
      setSelectedInsurances([]);
      onSaleAdded();
    }
    
    setLoading(false);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Nouvelle Vente
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="clientName">Nom du client *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client"
              required
            />
          </div>

          <div>
            <Label htmlFor="reservationNumber">N° de réservation *</Label>
            <Input
              id="reservationNumber"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="Ex: RES-2024-001"
              required
            />
          </div>

          <div className="space-y-3">
            <Label>Assurances souscrites *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insuranceTypes.map((insurance) => (
                <div key={insurance.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    checked={selectedInsurances.includes(insurance.name)}
                    onCheckedChange={(checked) => {
                      if (checked) {
                        setSelectedInsurances([...selectedInsurances, insurance.name]);
                      } else {
                        setSelectedInsurances(selectedInsurances.filter(name => name !== insurance.name));
                      }
                    }}
                  />
                  <div className="flex-1">
                    <Label className="font-medium">{insurance.name}</Label>
                    <p className="text-sm text-success">{insurance.commission.toFixed(2)} €</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? "Enregistrement..." : "Enregistrer la vente"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};