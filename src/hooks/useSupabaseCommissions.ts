import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseCommissions = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInsuranceTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .schema('api')
        .from('insurance_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) {
        console.error('Erreur récupération types assurance:', error);
        toast({
          title: "Erreur",
          description: "Impossible de récupérer les types d'assurance",
          variant: "destructive",
        });
        return;
      }

      setInsuranceTypes(data || []);
    } catch (error: any) {
      console.error('Erreur fetchInsuranceTypes:', error);
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCommission = async (insuranceId: string, newCommission: number) => {
    try {
      const { error } = await (supabase as any)
        .schema('api')
        .from('insurance_types')
        .update({ commission: newCommission })
        .eq('id', insuranceId);

      if (error) throw error;

      toast({
        title: "Commission mise à jour",
        description: "La commission a été modifiée avec succès",
      });

      // Recharger les types d'assurance
      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const addInsuranceType = async (name: string, commission: number) => {
    try {
      const { error } = await (supabase as any)
        .schema('api')
        .from('insurance_types')
        .insert({
          name,
          commission,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Type d'assurance ajouté",
        description: `${name} a été ajouté avec succès`,
      });

      // Recharger les types d'assurance
      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const toggleInsuranceType = async (insuranceId: string, isActive: boolean) => {
    try {
      const { error } = await (supabase as any)
        .schema('api')
        .from('insurance_types')
        .update({ is_active: isActive })
        .eq('id', insuranceId);

      if (error) throw error;

      toast({
        title: isActive ? "Type d'assurance activé" : "Type d'assurance désactivé",
        description: "Le statut a été modifié avec succès",
      });

      // Recharger les types d'assurance
      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    fetchInsuranceTypes();
  }, []);

  return {
    insuranceTypes,
    loading,
    updateCommission,
    addInsuranceType,
    toggleInsuranceType,
    refreshInsuranceTypes: fetchInsuranceTypes,
  };
};