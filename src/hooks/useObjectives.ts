import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { EmployeeObjective, ObjectiveProgress } from '@/types/objectives';

export const useObjectives = () => {
  const [objectives, setObjectives] = useState<EmployeeObjective[]>([]);
  const [objectivesProgress, setObjectivesProgress] = useState<ObjectiveProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useSupabaseAuth();

  const fetchObjectives = async () => {
    try {
      setLoading(true);

      // Récupérer les objectifs
      const { data: objectivesData, error: objectivesError } = await supabase
        .from('employee_objectives')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (objectivesError) {
        console.error('Erreur lors de la récupération des objectifs:', objectivesError);
        return;
      }

      setObjectives((objectivesData || []) as EmployeeObjective[]);

      // Calculer la progression pour chaque objectif
      const progressData: ObjectiveProgress[] = [];

      for (const objective of objectivesData || []) {
        // Récupérer les ventes de l'employé pour la période
        const { data: salesData, error: salesError } = await supabase
          .from('sales')
          .select('commission_amount, created_at')
          .eq('employee_name', objective.employee_name)
          .eq('status', 'active')
          .gte('created_at', objective.period_start)
          .lte('created_at', objective.period_end);

        if (salesError) {
          console.error('Erreur lors de la récupération des ventes:', salesError);
          continue;
        }

        const currentAmount = salesData?.reduce((sum, sale) => sum + Number(sale.commission_amount), 0) || 0;
        const currentSalesCount = salesData?.length || 0;

        const progressPercentageAmount = objective.target_amount > 0 
          ? Math.min((currentAmount / objective.target_amount) * 100, 100) 
          : 0;
          
        const progressPercentageSales = objective.target_sales_count > 0 
          ? Math.min((currentSalesCount / objective.target_sales_count) * 100, 100) 
          : 0;

        const endDate = new Date(objective.period_end);
        const today = new Date();
        const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));

        progressData.push({
          objective: objective as EmployeeObjective,
          current_amount: currentAmount,
          current_sales_count: currentSalesCount,
          progress_percentage_amount: progressPercentageAmount,
          progress_percentage_sales: progressPercentageSales,
          days_remaining: daysRemaining,
        });
      }

      setObjectivesProgress(progressData);

    } catch (error) {
      console.error('Erreur lors du calcul de la progression:', error);
    } finally {
      setLoading(false);
    }
  };

  const createObjective = async (objectiveData: Omit<EmployeeObjective, 'id' | 'created_at' | 'updated_at'>) => {
    try {
      const { data, error } = await supabase
        .from('employee_objectives')
        .insert([objectiveData])
        .select();

      if (error) throw error;

      await fetchObjectives();
      return { success: true, data };
    } catch (error: any) {
      console.error('Erreur création objectif:', error);
      return { success: false, error: error.message };
    }
  };

  const updateObjective = async (id: string, updates: Partial<EmployeeObjective>) => {
    try {
      const { data, error } = await supabase
        .from('employee_objectives')
        .update(updates)
        .eq('id', id)
        .select();

      if (error) throw error;

      await fetchObjectives();
      return { success: true, data };
    } catch (error: any) {
      console.error('Erreur mise à jour objectif:', error);
      return { success: false, error: error.message };
    }
  };

  const deleteObjective = async (id: string) => {
    try {
      const { error } = await supabase
        .from('employee_objectives')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchObjectives();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression objectif:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchObjectives();
    }
  }, [profile]);

  return {
    objectives,
    objectivesProgress,
    loading,
    fetchObjectives,
    createObjective,
    updateObjective,
    deleteObjective,
  };
};