import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types
const supabaseAny = supabase as any;

export interface Sale {
  id: string;
  sale_date: string;
  user_id: string;
  // Compatibility fields
  employee_id?: string;
  employee_name?: string;
  insurance_type_id?: string;
  insurance_type: string;
  contract_number: string;
  amount: number;
  commission: number;
  commission_amount?: number;
  customer_name?: string;
  client_name?: string;
  vehicle_type?: string;
  rental_duration_days?: number;
  notes?: string;
  agency?: string;
  status?: string;
  created_at: string;
  updated_at: string;
}

export function useSales() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(false);

  // Charger les ventes automatiquement
  useEffect(() => {
    if (user) {
      fetchSales();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]); // Only refetch when user.id changes

  const fetchSales = async () => {
    try {
      setLoading(true);

      let query = supabaseAny
        .from('insurance_sales')
        .select(`
          *,
          insurance_types(name),
          profiles:user_id(full_name)
        `)
        .order('sale_date', { ascending: false });

      // Si pas admin, filtrer par user_id
      if (!isAdmin && user) {
        query = query.eq('user_id', user.id);
      }

      const { data, error } = await query;
      if (error) {
        console.error('Error fetching sales:', error);
      }

      // Map data to expected format with compatibility fields
      const mappedSales = (data || []).map((sale: any) => ({
        ...sale,
        insurance_type: sale.insurance_types?.name || sale.insurance_type || 'N/A',
        commission: sale.commission_amount || sale.commission || 0,
        customer_name: sale.client_name || sale.customer_name,
        // Compatibility mappings
        employee_id: sale.user_id,
        employee_name: sale.profiles?.full_name || 'N/A',
      }));

      setSales(mappedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSale = async (saleData: Partial<Sale>) => {
    if (!user) return;

    try {
      // Get insurance_type_id from insurance_types table if needed
      let insurance_type_id = saleData.insurance_type_id;
      
      if (!insurance_type_id && saleData.insurance_type) {
        const { data: insuranceType } = await supabaseAny
          .from('insurance_types')
          .select('id')
          .eq('name', saleData.insurance_type)
          .maybeSingle();
        
        insurance_type_id = insuranceType?.id;
      }

      const insertData = {
        user_id: user.id,
        insurance_type_id,
        contract_number: saleData.contract_number,
        client_name: saleData.customer_name || saleData.client_name,
        amount: saleData.amount,
        commission_amount: saleData.commission || saleData.commission_amount,
        sale_date: saleData.sale_date || new Date().toISOString().split('T')[0],
        agency: saleData.agency,
        notes: saleData.notes,
        status: 'validated',
      };

      const { data, error } = await supabaseAny
        .from('insurance_sales')
        .insert(insertData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Vente enregistrée',
        description: `Montant : ${saleData.amount?.toFixed(2) || 0}€`,
      });

      await fetchSales();
      return data;
    } catch (error: any) {
      console.error('Error adding sale:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible d\'ajouter la vente',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateSale = async (id: string, updates: Partial<Sale>) => {
    try {
      const updateData: any = {};
      
      if (updates.contract_number) updateData.contract_number = updates.contract_number;
      if (updates.customer_name || updates.client_name) updateData.client_name = updates.customer_name || updates.client_name;
      if (updates.amount) updateData.amount = updates.amount;
      if (updates.commission || updates.commission_amount) updateData.commission_amount = updates.commission || updates.commission_amount;
      if (updates.notes) updateData.notes = updates.notes;
      if (updates.status) updateData.status = updates.status;

      const { error } = await supabaseAny
        .from('insurance_sales')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Vente modifiée',
      });

      await fetchSales();
    } catch (error) {
      console.error('Error updating sale:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier la vente',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const deleteSale = async (id: string) => {
    try {
      // Try soft delete first, then hard delete if column doesn't exist
      const { error } = await supabaseAny
        .from('insurance_sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Vente supprimée',
      });

      await fetchSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de supprimer la vente',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    sales,
    loading,
    fetchSales,
    addSale,
    updateSale,
    deleteSale,
  };
}
