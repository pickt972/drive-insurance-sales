import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { useCommissions } from "@/hooks/useCommissions";
import { Euro, Plus, Trash2, Settings } from "lucide-react";

export const CommissionManager = () => {
  const { commissions, updateCommission, addCommission, removeCommission } = useCommissions();
  const [newType, setNewType] = useState("");
  const [newAmount, setNewAmount] = useState("");
  const { toast } = useToast();

  const handleUpdateCommission = (type: string, value: string) => {
    const amount = parseFloat(value);
    if (!isNaN(amount) && amount >= 0) {
      updateCommission(type, amount);
      toast({
        title: "Commission mise à jour",
        description: `${type}: ${amount.toFixed(2)} €`,
      });
    }
  };

  const handleAddCommission = () => {
    if (!newType || !newAmount) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    const amount = parseFloat(newAmount);
    if (isNaN(amount) || amount < 0) {
      toast({
        title: "Erreur",
        description: "Le montant doit être un nombre positif",
        variant: "destructive",
      });
      return;
    }

    addCommission(newType, amount);
    setNewType("");
    setNewAmount("");
    
    toast({
      title: "Commission ajoutée",
      description: `${newType}: ${amount.toFixed(2)} €`,
    });
  };

  const handleRemoveCommission = (type: string) => {
    removeCommission(type);
    toast({
      title: "Commission supprimée",
      description: `${type} a été supprimé`,
    });
  };

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings className="h-5 w-5 text-primary" />
          Gestion des Commissions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Existing commissions */}
        <div className="space-y-4">
          <h3 className="font-medium">Commissions actuelles</h3>
          <div className="space-y-3">
            {Object.entries(commissions).map(([type, amount]) => (
              <div key={type} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="flex-1">
                  <Label className="text-sm font-medium">{type}</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4 text-muted-foreground" />
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={amount}
                    onChange={(e) => handleUpdateCommission(type, e.target.value)}
                    className="w-20 text-right"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveCommission(type)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Add new commission */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="font-medium">Ajouter une nouvelle commission</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="new-type">Type d'assurance</Label>
              <Input
                id="new-type"
                value={newType}
                onChange={(e) => setNewType(e.target.value)}
                placeholder="Ex: Garantie étendue"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-amount">Montant (€)</Label>
              <Input
                id="new-amount"
                type="number"
                step="0.01"
                min="0"
                value={newAmount}
                onChange={(e) => setNewAmount(e.target.value)}
                placeholder="0.00"
              />
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddCommission}
                className="w-full bg-gradient-primary hover:bg-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        {/* Save button */}
        <div className="flex justify-end pt-4 border-t">
          <Button
            onClick={() => {
              toast({
                title: "Modifications enregistrées",
                description: "Les commissions ont été sauvegardées avec succès",
              });
            }}
            className="bg-gradient-primary hover:bg-primary-hover"
          >
            Enregistrer les modifications
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
