import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

export interface Sale {
  id: string;
  employee_name: string;
  client_name: string;
  reservation_number: string;
  commission_amount: number;
  created_at: string;
  insurance_types: string[];
}

export const useSalesData = () => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isAdmin } = useAuth();

  const fetchSales = async () => {
    try {
      setLoading(true);
      
      let query = supabase
        .from('sales')
        .select(`
          id,
          employee_name,
          client_name,
          reservation_number,
          commission_amount,
          created_at,
          sale_insurances (
            insurance_type_id,
            insurance_types (
              name
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      // If not admin, only show own sales
      if (!isAdmin && profile?.username) {
        query = query.eq('employee_name', profile.username);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Transform data to include insurance types
      const transformedSales = data?.map(sale => ({
        id: sale.id,
        employee_name: sale.employee_name,
        client_name: sale.client_name,
        reservation_number: sale.reservation_number,
        commission_amount: sale.commission_amount,
        created_at: sale.created_at,
        insurance_types: sale.sale_insurances?.map(si => si.insurance_types?.name || '').filter(Boolean) || []
      })) || [];

      setSales(transformedSales);
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const refreshSales = () => {
    fetchSales();
  };

  useEffect(() => {
    if (profile) {
      fetchSales();
    }
  }, [profile, isAdmin]);

  return {
    sales,
    loading,
    refreshSales
  };
};