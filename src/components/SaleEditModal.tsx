import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Sale } from "@/types/sales";
import { useCommissions } from "@/hooks/useCommissions";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface SaleEditModalProps {
  sale: Sale | null;
  isOpen: boolean;
  onClose: () => void;
  onSaveSuccess: () => void;
}

interface InsuranceType {
  id: string;
  name: string;
  commission: number;
}

export const SaleEditModal = ({ sale, isOpen, onClose, onSaveSuccess }: SaleEditModalProps) => {
  const [formData, setFormData] = useState({
    clientName: '',
    reservationNumber: '',
    employeeName: '',
    selectedInsurances: [] as string[],
    date: ''
  });
  const [employees, setEmployees] = useState<string[]>([]);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { profile } = useSupabaseAuth();
  const { commissions } = useCommissions();
  const { toast } = useToast();

  // Charger les employés et types d'assurance
  useEffect(() => {
    const loadData = async () => {
      // Charger les employés
      const { data: profilesData } = await supabase
        .from('profiles')
        .select('username')
        .eq('is_active', true)
        .order('username');

      if (profilesData) {
        setEmployees(profilesData.map(p => p.username));
      }

      // Charger les types d'assurance
      const { data: insuranceData } = await supabase
        .from('insurance_types')
        .select('id, name, commission')
        .eq('is_active', true)
        .order('name');

      if (insuranceData) {
        setInsuranceTypes(insuranceData);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  // Pré-remplir le formulaire quand une vente est sélectionnée
  useEffect(() => {
    if (sale && isOpen) {
      setFormData({
        clientName: sale.clientName,
        reservationNumber: sale.reservationNumber,
        employeeName: sale.employeeName,
        selectedInsurances: sale.insuranceTypes,
        date: sale.date.split('T')[0] // Convertir au format date
      });
    }
  }, [sale, isOpen]);

  const handleInsuranceChange = (insuranceName: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedInsurances: checked 
        ? [...prev.selectedInsurances, insuranceName]
        : prev.selectedInsurances.filter(name => name !== insuranceName)
    }));
  };

  const calculateTotalCommission = () => {
    return formData.selectedInsurances.reduce((total, insuranceName) => {
      const insuranceType = insuranceTypes.find(type => type.name === insuranceName);
      return total + (insuranceType?.commission || 0);
    }, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!sale) return;

    if (!formData.clientName || !formData.reservationNumber || formData.selectedInsurances.length === 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs obligatoires",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);

    try {
      // Calculer la commission totale
      const totalCommission = calculateTotalCommission();
      
      // Mettre à jour la vente principale
      const { error: saleError } = await supabase
        .from('sales')
        .update({
          client_name: formData.clientName,
          reservation_number: formData.reservationNumber,
          employee_name: formData.employeeName,
          commission_amount: totalCommission,
          created_at: new Date(formData.date + 'T00:00:00.000Z').toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', sale.id);

      if (saleError) {
        throw saleError;
      }

      // Supprimer les anciennes assurances multiples
      const { error: deleteError } = await supabase
        .from('sale_insurances')
        .delete()
        .eq('sale_id', sale.id);

      if (deleteError) {
        throw deleteError;
      }

      // Ajouter les nouvelles assurances multiples
      if (formData.selectedInsurances.length > 0) {
        const saleInsurances = formData.selectedInsurances.map(insuranceName => {
          const insuranceType = insuranceTypes.find(type => type.name === insuranceName);
          return {
            sale_id: sale.id,
            insurance_type_id: insuranceType?.id || '',
            commission_amount: insuranceType?.commission || 0
          };
        });

        const { error: insertError } = await supabase
          .from('sale_insurances')
          .insert(saleInsurances);

        if (insertError) {
          throw insertError;
        }
      }

      toast({
        title: "Vente modifiée",
        description: "La vente a été modifiée avec succès",
      });

      onSaveSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erreur modification vente:', error);
      toast({
        title: "Erreur",
        description: error.message || "Une erreur est survenue lors de la modification",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!sale) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Modifier la vente</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="clientName">Nom du client *</Label>
            <Input
              id="clientName"
              value={formData.clientName}
              onChange={(e) => setFormData(prev => ({ ...prev, clientName: e.target.value }))}
              placeholder="Nom complet du client"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="reservationNumber">Numéro de réservation *</Label>
            <Input
              id="reservationNumber"
              value={formData.reservationNumber}
              onChange={(e) => setFormData(prev => ({ ...prev, reservationNumber: e.target.value }))}
              placeholder="Ex: RES-123456"
              required
            />
          </div>

          {profile?.role === 'admin' && (
            <div className="space-y-2">
              <Label htmlFor="employee">Employé</Label>
              <Select 
                value={formData.employeeName} 
                onValueChange={(value) => setFormData(prev => ({ ...prev, employeeName: value }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map(employee => (
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
              value={formData.date}
              onChange={(e) => setFormData(prev => ({ ...prev, date: e.target.value }))}
            />
          </div>

          <div className="space-y-3">
            <Label>Types d'assurance *</Label>
            <div className="grid grid-cols-1 gap-3 max-h-32 overflow-y-auto">
              {insuranceTypes.map((insurance) => (
                <div key={insurance.id} className="flex items-center space-x-3 p-2 rounded-lg border">
                  <Checkbox
                    id={insurance.id}
                    checked={formData.selectedInsurances.includes(insurance.name)}
                    onCheckedChange={(checked) => 
                      handleInsuranceChange(insurance.name, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor={insurance.id} className="text-sm font-medium cursor-pointer">
                      {insurance.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Commission: {insurance.commission}€
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {formData.selectedInsurances.length > 0 && (
            <div className="p-3 bg-muted rounded-lg">
              <p className="text-sm font-medium">
                Commission totale: {calculateTotalCommission().toFixed(2)}€
              </p>
            </div>
          )}

          <div className="flex gap-2 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1">
              Annuler
            </Button>
            <Button type="submit" disabled={loading} className="flex-1">
              {loading ? 'Modification...' : 'Modifier'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};