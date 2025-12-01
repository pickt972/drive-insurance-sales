import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types
const supabaseAny = supabase as any;

export interface Sale {
  id: string;
  sale_date: string;
  employee_id: string;
  employee_name: string;
  insurance_type: string;
  contract_number: string;
  amount: number;
  commission: number;
  customer_name?: string;
  vehicle_type?: string;
  rental_duration_days?: number;
  notes?: string;
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
  }, [user]); // Only refetch when user changes, not when isAdmin changes

  const fetchSales = async () => {
    try {
      setLoading(true);

      let query = supabaseAny
        .from('insurance_sales')
        .select('*')
        .eq('is_deleted', false)
        .order('sale_date', { ascending: false });

      // Si pas admin, filtrer par employee_id
      if (!isAdmin && user) {
        query = query.eq('employee_id', user.id);
      }

      const { data, error } = await query;
      if (error) throw error;

      setSales(data || []);
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const addSale = async (saleData: Partial<Sale>) => {
    if (!user) return;

    try {
      const { data, error } = await supabaseAny
        .from('insurance_sales')
        .insert({
          ...saleData,
          employee_id: user.id,
          created_by: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Vente enregistrée',
        description: `Montant : ${saleData.amount}€`,
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
      const { error } = await supabaseAny
        .from('insurance_sales')
        .update(updates)
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
      const { error } = await supabaseAny
        .from('insurance_sales')
        .update({ is_deleted: true })
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
