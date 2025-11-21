import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types during migration
const supabaseAny = supabase as any;

export interface Objective {
  id: string;
  employee_name: string;
  objective_type: string;
  target_amount: number;
  target_sales_count: number;
  period_start: string;
  period_end: string;
  description: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export function useObjectives() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Récupérer tous les objectifs (admin only)
  const getObjectives = async (activeOnly: boolean = true) => {
    if (!isAdmin) throw new Error('Accès refusé - Admin uniquement');

    try {
      setLoading(true);

      let query = supabaseAny
        .from('employee_objectives')
        .select('*')
        .order('created_at', { ascending: false });

      if (activeOnly) {
        query = query.eq('is_active', true);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching objectives:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les objectifs',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Récupérer les objectifs d'un employé
  const getEmployeeObjectives = async (employeeName: string) => {
    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('employee_objectives')
        .select('*')
        .eq('employee_name', employeeName)
        .eq('is_active', true)
        .order('period_start', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching employee objectives:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Ajouter un objectif (admin only)
  const addObjective = async (objectiveData: Omit<Objective, 'id' | 'created_at' | 'updated_at'>) => {
    if (!isAdmin) throw new Error('Accès refusé - Admin uniquement');

    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('employee_objectives')
        .insert(objectiveData)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Objectif créé',
        description: `Pour ${objectiveData.employee_name}`,
      });

      return data;
    } catch (error) {
      console.error('Error adding objective:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de créer l\'objectif',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Mettre à jour un objectif (admin only)
  const updateObjective = async (id: string, updates: Partial<Objective>) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('employee_objectives')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Objectif modifié',
      });

      return data;
    } catch (error) {
      console.error('Error updating objective:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier l\'objectif',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Désactiver un objectif (admin only)
  const removeObjective = async (id: string) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      const { error } = await supabaseAny
        .from('employee_objectives')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Objectif désactivé',
      });
    } catch (error) {
      console.error('Error removing objective:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de désactiver l\'objectif',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getObjectives,
    getEmployeeObjectives,
    addObjective,
    updateObjective,
    removeObjective,
  };
}
