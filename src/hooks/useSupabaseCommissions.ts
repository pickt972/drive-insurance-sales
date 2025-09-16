import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseCommissions = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchInsuranceTypes = async () => {
    const MAX_RETRIES = 5;
    let attempt = 0;
    setLoading(true);
    
    console.log('🔄 Début fetchInsuranceTypes, session check...');
    
    // Attendre que l'auth soit prête (plus longue attente)
    let sessionReady = false;
    for (let i = 0; i < 10; i++) {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        sessionReady = true;
        console.log('✅ Session utilisateur détectée:', session.user.id);
        break;
      }
      console.log(`⏳ Attente session (${i + 1}/10)...`);
      await new Promise((r) => setTimeout(r, 300));
    }

    if (!sessionReady) {
      console.log('❌ Aucune session trouvée après 3s');
      setLoading(false);
      toast({
        title: "Erreur d'authentification",
        description: "Veuillez vous reconnecter",
        variant: "destructive",
      });
      return;
    }

    try {
      while (attempt < MAX_RETRIES) {
        console.log(`🔍 Tentative ${attempt + 1}/${MAX_RETRIES} - récupération insurance_types`);
        
        const { data, error } = await supabase
          .from('insurance_types')
          .select('id,name,commission,is_active,created_at,updated_at')
          .eq('is_active', true)
          .order('name', { ascending: true });

        if (!error && data) {
          console.log('✅ Insurance types récupérés:', data.length, 'éléments');
          setInsuranceTypes(data || []);
          return;
        }

        console.error(`❌ Erreur tentative ${attempt + 1}:`, error);
        attempt += 1;

        if (attempt >= MAX_RETRIES) {
          toast({
            title: "Erreur",
            description: `Impossible de récupérer les types d'assurance: ${error?.message || 'Erreur inconnue'}`,
            variant: "destructive",
          });
          return;
        }

        // Pause progressive entre les tentatives
        await new Promise((r) => setTimeout(r, 1000 * attempt));
      }
    } catch (error: any) {
      console.error('💥 Exception fetchInsuranceTypes:', error);
      toast({
        title: "Erreur",
        description: error?.message || 'Une erreur est survenue',
        variant: "destructive",
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