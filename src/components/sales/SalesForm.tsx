import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Save, Euro } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface SalesFormProps {
  onSaleAdded: () => void;
}

interface InsuranceType {
  id: string;
  name: string;
  commission: number;
}

interface Employee {
  username: string;
}

export const SalesForm: React.FC<SalesFormProps> = ({ onSaleAdded }) => {
  const { profile, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Form data
  const [employeeName, setEmployeeName] = useState('');
  const [clientName, setClientName] = useState('');
  const [reservationNumber, setReservationNumber] = useState('');
  const [selectedInsurances, setSelectedInsurances] = useState<string[]>([]);
  
  // Data
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  // Calculate total commission
  const totalCommission = selectedInsurances.reduce((total, insuranceId) => {
    const insurance = insuranceTypes.find(ins => ins.id === insuranceId);
    return total + (insurance?.commission || 0);
  }, 0);

  const fetchData = async () => {
    try {
      setLoadingData(true);
      
      // Fetch insurance types
      const { data: insurances, error: insuranceError } = await supabase
        .from('insurance_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (insuranceError) throw insuranceError;
      setInsuranceTypes(insurances || []);

      // Fetch employees if admin
      if (isAdmin) {
        const { data: employeesData, error: employeesError } = await supabase
          .from('profiles')
          .select('username')
          .eq('is_active', true)
          .order('username');

        if (employeesError) throw employeesError;
        setEmployees(employeesData || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les données",
        variant: "destructive",
      });
    } finally {
      setLoadingData(false);
    }
  };

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

    const finalEmployeeName = isAdmin ? employeeName : profile?.username;
    if (!finalEmployeeName) {
      toast({
        title: "Erreur",
        description: "Employé non sélectionné",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);

      // Create sale
      const { data: sale, error: saleError } = await supabase
        .from('sales')
        .insert({
          employee_name: finalEmployeeName,
          client_name: clientName,
          reservation_number: reservationNumber,
          commission_amount: totalCommission,
          insurance_type_id: selectedInsurances[0] // Legacy field
        })
        .select()
        .single();

      if (saleError) throw saleError;

      // Create sale insurances
      const saleInsurances = selectedInsurances.map(insuranceId => {
        const insurance = insuranceTypes.find(ins => ins.id === insuranceId);
        return {
          sale_id: sale.id,
          insurance_type_id: insuranceId,
          commission_amount: insurance?.commission || 0
        };
      });

      const { error: insurancesError } = await supabase
        .from('sale_insurances')
        .insert(saleInsurances);

      if (insurancesError) throw insurancesError;

      // Reset form
      setClientName('');
      setReservationNumber('');
      setSelectedInsurances([]);
      if (isAdmin) setEmployeeName('');

      toast({
        title: "Vente enregistrée !",
        description: `Commission de ${totalCommission.toFixed(2)} € ajoutée`,
      });

      onSaleAdded();
    } catch (error) {
      console.error('Error creating sale:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'enregistrer la vente",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInsuranceChange = (insuranceId: string, checked: boolean) => {
    if (checked) {
      setSelectedInsurances([...selectedInsurances, insuranceId]);
    } else {
      setSelectedInsurances(selectedInsurances.filter(id => id !== insuranceId));
    }
  };

  useEffect(() => {
    fetchData();
  }, [isAdmin]);

  if (loadingData) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Plus className="h-5 w-5 text-primary" />
          Nouvelle vente
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Employee selection (admin only) */}
          {isAdmin && (
            <div className="space-y-2">
              <Label htmlFor="employee">Employé *</Label>
              <Select value={employeeName} onValueChange={setEmployeeName}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionnez un employé" />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.username} value={employee.username}>
                      {employee.username}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Client name */}
          <div className="space-y-2">
            <Label htmlFor="clientName">Nom du client *</Label>
            <Input
              id="clientName"
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Nom du client"
              required
            />
          </div>

          {/* Reservation number */}
          <div className="space-y-2">
            <Label htmlFor="reservationNumber">Numéro de réservation *</Label>
            <Input
              id="reservationNumber"
              value={reservationNumber}
              onChange={(e) => setReservationNumber(e.target.value)}
              placeholder="Ex: RES-2024-001"
              required
            />
          </div>

          {/* Insurance types */}
          <div className="space-y-4">
            <Label>Assurances souscrites *</Label>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {insuranceTypes.map((insurance) => (
                <div key={insurance.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                  <Checkbox
                    id={insurance.id}
                    checked={selectedInsurances.includes(insurance.id)}
                    onCheckedChange={(checked) => 
                      handleInsuranceChange(insurance.id, checked as boolean)
                    }
                  />
                  <div className="flex-1">
                    <Label htmlFor={insurance.id} className="font-medium">
                      {insurance.name}
                    </Label>
                    <p className="text-sm text-success font-medium">
                      {insurance.commission.toFixed(2)} €
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Total commission */}
          {selectedInsurances.length > 0 && (
            <div className="p-4 bg-success-light rounded-lg">
              <div className="flex items-center justify-between">
                <span className="font-medium">Commission totale :</span>
                <span className="text-xl font-bold text-success flex items-center gap-1">
                  <Euro className="h-5 w-5" />
                  {totalCommission.toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Submit button */}
          <Button 
            type="submit" 
            className="w-full primary-button"
            disabled={loading}
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                Enregistrement...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Enregistrer la vente
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};