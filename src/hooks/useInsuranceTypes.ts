import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types during migration
const supabaseAny = supabase as any;

export interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useInsuranceTypes() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Récupérer tous les types d'assurance
  const getInsuranceTypes = async (activeOnly: boolean = true) => {
    try {
      setLoading(true);

      let query = supabaseAny
        .from('insurance_types')
        .select('*')
        .order('name', { ascending: true });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching insurance types:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les types d\'assurance',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un type d'assurance (admin only)
  const addInsuranceType = async (insuranceData: Omit<InsuranceType, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isAdmin) throw new Error('Accès refusé - Admin uniquement');

    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('insurance_types')
        .insert(insuranceData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Type d\'assurance créé',
        description: insuranceData.name,
      });

      return data;
    } catch (error) {
      console.error('Error adding insurance type:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de créer le type d\'assurance',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un type d'assurance (admin only)
  const updateInsuranceType = async (id: string, updates: Partial<InsuranceType>) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('insurance_types')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Type d\'assurance modifié',
      });

      return data;
    } catch (error) {
      console.error('Error updating insurance type:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier le type d\'assurance',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Désactiver un type d'assurance (admin only, soft delete)
  const removeInsuranceType = async (id: string) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      const { error } = await supabaseAny
        .from('insurance_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Type d\'assurance désactivé',
      });
    } catch (error) {
      console.error('Error removing insurance type:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de désactiver le type d\'assurance',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getInsuranceTypes,
    addInsuranceType,
    updateInsuranceType,
    removeInsuranceType,
  };
}
