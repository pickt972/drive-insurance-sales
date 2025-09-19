import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseCommissions = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInsuranceTypes = async () => {
    setLoading(true);
    try {
      console.log("🔄 Récupération des types d'assurance...");

      // Multi-retry avec backoff pour contourner les erreurs PGRST002 (cache de schéma)
      const delays = [0, 1000, 2000]; // 3 tentatives: immédiate, +1s, +2s
      let lastError: any = null;

      for (let i = 0; i < delays.length; i++) {
        if (delays[i] > 0) {
          console.log(`⏳ Retry dans ${delays[i]}ms (tentative ${i + 1}/${delays.length})`);
          await new Promise((resolve) => setTimeout(resolve, delays[i]));
        }

        const { data, error } = await supabase
          .from('insurance_types')
          .select('id, name, commission, is_active, created_at, updated_at')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!error) {
          console.log(`✅ Types d'assurance récupérés: ${data?.length || 0} éléments${i > 0 ? ` (après retry ${i})` : ''}`);
          setInsuranceTypes(data || []);
          return;
        }

        lastError = error;
        console.warn('⚠️ Échec de récupération (tentative):', error);
      }

      console.error('❌ Erreur après plusieurs tentatives:', lastError);
      toast({
        title: 'Erreur',
        description: "Problème de connexion à la base de données. Réessayez en appuyant sur Réessayer.",
        variant: 'destructive',
      });
      setInsuranceTypes([]);
    } catch (error: any) {
      console.error('💥 Exception fetchInsuranceTypes:', error);
      toast({
        title: 'Erreur de connexion',
        description: 'Impossible de se connecter à la base de données. Vérifiez votre connexion.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  const updateCommission = async (insuranceId: string, newCommission: number) => {
    try {
      const { error } = await (supabase as any)
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