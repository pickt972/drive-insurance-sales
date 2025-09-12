import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ObjectiveHistory } from '@/types/objectiveHistory';
import { toast } from '@/components/ui/use-toast';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';

export const useObjectiveHistory = () => {
  const [history, setHistory] = useState<ObjectiveHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useSupabaseAuth();

  const fetchObjectiveHistory = async () => {
    try {
      setLoading(true);
      
      // Si pas de profil, on ne peut pas charger les données
      if (!profile) {
        setHistory([]);
        return;
      }

      const { data, error } = await supabase
        .from('objective_history')
        .select('*')
        .order('archived_at', { ascending: false });

      if (error) {
        console.error('Error fetching objective history:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible de charger l'historique des objectifs.",
        });
        return;
      }

      setHistory(data || []);
    } catch (error) {
      console.error('Error in fetchObjectiveHistory:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors du chargement de l'historique.",
      });
    } finally {
      setLoading(false);
    }
  };

  const archiveObjective = async (
    objectiveId: string,
    achievedAmount: number,
    achievedSalesCount: number,
    progressPercentageAmount: number,
    progressPercentageSales: number,
    objectiveAchieved: boolean
  ) => {
    try {
      const { error } = await supabase.rpc('archive_completed_objective', {
        p_objective_id: objectiveId,
        p_achieved_amount: achievedAmount,
        p_achieved_sales_count: achievedSalesCount,
        p_progress_percentage_amount: progressPercentageAmount,
        p_progress_percentage_sales: progressPercentageSales,
        p_objective_achieved: objectiveAchieved
      });

      if (error) {
        console.error('Error archiving objective:', error);
        toast({
          variant: "destructive",
          title: "Erreur",
          description: "Impossible d'archiver l'objectif.",
        });
        return false;
      }

      toast({
        title: "Objectif archivé",
        description: "L'objectif a été archivé avec succès dans l'historique.",
      });

      await fetchObjectiveHistory();
      return true;
    } catch (error) {
      console.error('Error in archiveObjective:', error);
      toast({
        variant: "destructive",
        title: "Erreur",
        description: "Une erreur est survenue lors de l'archivage.",
      });
      return false;
    }
  };

  useEffect(() => {
    if (profile) {
      fetchObjectiveHistory();
    }
  }, [profile]);

  return {
    history,
    loading,
    fetchObjectiveHistory,
    archiveObjective
  };
};