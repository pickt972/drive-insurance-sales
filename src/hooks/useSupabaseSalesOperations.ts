import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { useToast } from '@/hooks/use-toast';

interface SaleData {
  client_name: string;
  client_email?: string;
  client_phone?: string;
  reservation_number: string;
  employee_name: string;
  insurance_type_id: string;
  commission_amount: number;
  notes?: string;
}

export const useSupabaseSalesOperations = () => {
  const [loading, setLoading] = useState(false);
  const { profile } = useSupabaseAuth();
  const { toast } = useToast();

  const addSale = async (saleData: SaleData) => {
    try {
      setLoading(true);
      
      const { data, error } = await (supabase as any)
        .schema('api')
        .from('sales')
        .insert({
          ...saleData,
          status: 'active'
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur ajout vente:', error);
        throw error;
      }

      toast({
        title: "Vente enregistrée",
        description: `Vente pour ${saleData.client_name} ajoutée avec succès`,
      });

      return { success: true, data };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible d'enregistrer la vente",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      setLoading(true);
      
      const { error } = await (supabase as any)
        .schema('api')
        .from('sales')
        .update({ status: 'deleted' })
        .eq('id', saleId);

      if (error) {
        console.error('Erreur suppression vente:', error);
        throw error;
      }

      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée avec succès",
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Impossible de supprimer la vente",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    } finally {
      setLoading(false);
    }
  };

  return {
    addSale,
    deleteSale,
    loading
  };
};