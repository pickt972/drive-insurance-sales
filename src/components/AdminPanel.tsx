import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Settings, Plus, Euro } from "lucide-react";
import { useFirebase } from "@/hooks/useFirebase";

export const AdminPanel = () => {
  const [newInsuranceName, setNewInsuranceName] = useState("");
  const [newCommission, setNewCommission] = useState("");
  const { insuranceTypes, addInsuranceType } = useFirebase();

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInsuranceName || !newCommission) return;

    const result = await addInsuranceType(newInsuranceName, parseFloat(newCommission));
    
    if (result.success) {
      setNewInsuranceName("");
      setNewCommission("");
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Gestion des Assurances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddInsurance} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="insuranceName">Nom de l'assurance</Label>
                <Input
                  id="insuranceName"
                  value={newInsuranceName}
                  onChange={(e) => setNewInsuranceName(e.target.value)}
                  placeholder="Ex: Assurance annulation"
                />
              </div>
              <div>
                <Label htmlFor="commission">Commission (€)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  value={newCommission}
                  onChange={(e) => setNewCommission(e.target.value)}
                  placeholder="0.00"
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="font-medium">Assurances existantes</h3>
            {insuranceTypes.map((insurance) => (
              <div key={insurance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{insurance.name}</span>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  <span>{insurance.commission.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};