import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export const useSupabaseCommissions = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInsuranceTypes = async () => {
    try {
      setLoading(true);
      
      const { data, error } = await supabase
        .from('insurance_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;

      setInsuranceTypes(data as InsuranceType[]);
    } catch (error) {
      console.error('Erreur chargement types assurance:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les types d'assurance",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCommission = async (insuranceId: string, newCommission: number) => {
    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({ 
          commission: newCommission,
          updated_at: new Date().toISOString()
        })
        .eq('id', insuranceId);

      if (error) throw error;

      await fetchInsuranceTypes();
      
      toast({
        title: "Commission mise à jour",
        description: "La commission a été mise à jour avec succès",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur mise à jour commission:', error);
      toast({
        title: "Erreur",
        description: "Impossible de mettre à jour la commission",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const addInsuranceType = async (name: string, commission: number) => {
    try {
      const { error } = await supabase
        .from('insurance_types')
        .insert({
          name,
          commission,
          is_active: true
        });

      if (error) throw error;

      await fetchInsuranceTypes();
      
      toast({
        title: "Type d'assurance ajouté",
        description: `${name} a été ajouté avec succès`,
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout type assurance:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'ajouter le type d'assurance",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const toggleInsuranceType = async (insuranceId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({ 
          is_active: isActive,
          updated_at: new Date().toISOString()
        })
        .eq('id', insuranceId);

      if (error) throw error;

      await fetchInsuranceTypes();
      
      toast({
        title: isActive ? "Type d'assurance activé" : "Type d'assurance désactivé",
        description: "Le statut a été mis à jour avec succès",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur changement statut:', error);
      toast({
        title: "Erreur",
        description: "Impossible de changer le statut",
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
    fetchInsuranceTypes,
    updateCommission,
    addInsuranceType,
    toggleInsuranceType,
  };
};
