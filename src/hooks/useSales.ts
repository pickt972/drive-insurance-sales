import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types during migration
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
  customer_name: string | null;
  vehicle_type: string | null;
  rental_duration_days: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export function useSales() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Créer une vente
  const createSale = async (saleData: Omit<Sale, 'id' | 'created_at' | 'updated_at'>) => {
    if (!user) throw new Error('Non authentifié');

    try {
      setLoading(true);

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
        title: '✅ Vente créée',
        description: `Montant : ${saleData.amount}€`,
      });

      return data;
    } catch (error: any) {
      console.error('Error creating sale:', error);
      
      let message = 'Erreur lors de la création';
      if (error.code === '23505') message = 'Ce numéro de contrat existe déjà';
      
      toast({
        title: '❌ Erreur',
        description: message,
        variant: 'destructive',
      });
      
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les ventes
  const getSales = async (filters?: {
    startDate?: string;
    endDate?: string;
    employeeId?: string;
    insuranceType?: string;
  }) => {
    try {
      setLoading(true);

      let query = supabaseAny
        .from('insurance_sales')
        .select('*')
        .eq('is_deleted', false);

      // Si pas admin, filtrer par employee_id
      if (!isAdmin && user) {
        query = query.eq('employee_id', user.id);
      }

      // Appliquer les filtres
      if (filters?.startDate) {
        query = query.gte('sale_date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('sale_date', filters.endDate);
      }
      if (filters?.employeeId && isAdmin) {
        query = query.eq('employee_id', filters.employeeId);
      }
      if (filters?.insuranceType) {
        query = query.eq('insurance_type', filters.insuranceType);
      }

      query = query.order('sale_date', { ascending: false });

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching sales:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les ventes',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer MES ventes uniquement
  const getMySales = async () => {
    if (!user) return [];
    return getSales();
  };

  // Mettre à jour une vente
  const updateSale = async (id: string, updates: Partial<Sale>) => {
    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('insurance_sales')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Vente modifiée',
      });

      return data;
    } catch (error: any) {
      console.error('Error updating sale:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier la vente',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Supprimer une vente (soft delete)
  const deleteSale = async (id: string) => {
    try {
      setLoading(true);

      const { error } = await supabaseAny
        .from('insurance_sales')
        .update({ is_deleted: true })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Vente supprimée',
      });
    } catch (error) {
      console.error('Error deleting sale:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de supprimer la vente',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    createSale,
    getSales,
    getMySales,
    updateSale,
    deleteSale,
  };
}
