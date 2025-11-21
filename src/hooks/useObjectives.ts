import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types
const supabaseAny = supabase as any;

export interface Objective {
  id: string;
  employee_name: string;
  objective_type: string;
  target_amount: number;
  target_sales_count: number;
  period_start: string;
  period_end: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Compatibilité anciens champs
  employeeName?: string;
  startDate?: string;
  endDate?: string;
  createdAt?: string;
}

export function useObjectives() {
  const { user, isAdmin } = useAuth();
  const { toast } = useToast();
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      fetchObjectives();
    }
  }, [user, isAdmin]);

  const fetchObjectives = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('employee_objectives')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) {
        // Si la table n'existe pas encore, retourner un tableau vide
        console.log('Objectives table not ready yet');
        setObjectives([]);
        return;
      }

      // Mapper pour compatibilité
      const mapped = (data || []).map((obj: any) => ({
        ...obj,
        employeeName: obj.employee_name,
        startDate: obj.period_start,
        endDate: obj.period_end,
        createdAt: obj.created_at,
      }));

      setObjectives(mapped);
    } catch (error) {
      console.error('Error fetching objectives:', error);
      setObjectives([]);
    } finally {
      setLoading(false);
    }
  };

  const addObjective = async (objectiveData: Partial<Objective>) => {
    try {
      const { data, error } = await supabaseAny
        .from('employee_objectives')
        .insert({
          employee_name: objectiveData.employee_name || objectiveData.employeeName,
          objective_type: objectiveData.objective_type,
          target_amount: objectiveData.target_amount,
          target_sales_count: objectiveData.target_sales_count,
          period_start: objectiveData.period_start || objectiveData.startDate,
          period_end: objectiveData.period_end || objectiveData.endDate,
          description: objectiveData.description,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: '✅ Objectif créé',
      });

      await fetchObjectives();
      return data;
    } catch (error: any) {
      console.error('Error adding objective:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer l\'objectif',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateObjective = async (id: string, updates: Partial<Objective>) => {
    try {
      const { error } = await supabaseAny
        .from('employee_objectives')
        .update({
          employee_name: updates.employee_name || updates.employeeName,
          objective_type: updates.objective_type,
          target_amount: updates.target_amount,
          target_sales_count: updates.target_sales_count,
          period_start: updates.period_start || updates.startDate,
          period_end: updates.period_end || updates.endDate,
          description: updates.description,
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Objectif modifié',
      });

      await fetchObjectives();
    } catch (error) {
      console.error('Error updating objective:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier l\'objectif',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const removeObjective = async (id: string) => {
    try {
      const { error } = await supabaseAny
        .from('employee_objectives')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: '✅ Objectif supprimé',
      });

      await fetchObjectives();
    } catch (error) {
      console.error('Error removing objective:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de supprimer l\'objectif',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    objectives,
    loading,
    fetchObjectives,
    addObjective,
    updateObjective,
    removeObjective,
  };
}
