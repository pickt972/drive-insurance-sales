import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { InsuranceType } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

// Données de fallback en cas de problème avec Supabase
const FALLBACK_INSURANCE_TYPES: InsuranceType[] = [
  {
    id: 'fallback-1',
    name: 'Assurance Annulation',
    commission: 15.00,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fallback-2',
    name: 'Assurance Bagages',
    commission: 12.50,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fallback-3',
    name: 'Assurance Médicale',
    commission: 20.00,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fallback-4',
    name: 'Assurance Responsabilité Civile',
    commission: 8.00,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fallback-5',
    name: 'Assurance Vol/Perte',
    commission: 10.00,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  },
  {
    id: 'fallback-6',
    name: 'Assurance Rapatriement',
    commission: 18.00,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }
];

export const useSupabaseCommissions = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const { toast } = useToast();

  const fetchInsuranceTypes = async () => {
    setLoading(true);
    console.log('🔄 Tentative de récupération des types d\'assurance...');
    
    try {
      // Tentative simple avec timeout
      const { data, error } = await Promise.race([
        supabase
          .from('insurance_types')
          .select('id,name,commission,is_active,created_at,updated_at')
          .eq('is_active', true)
          .order('name', { ascending: true }),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Timeout')), 5000)
        )
      ]) as any;

      if (!error && data && data.length > 0) {
        console.log('✅ Types d\'assurance récupérés depuis Supabase:', data.length);
        setInsuranceTypes(data);
        setUsingFallback(false);
        return;
      }
      
      throw new Error(error?.message || 'Aucune donnée trouvée');
      
    } catch (error: any) {
      console.warn('⚠️ Échec Supabase, utilisation des données de fallback:', error.message);
      
      // Utiliser les données de fallback
      setInsuranceTypes(FALLBACK_INSURANCE_TYPES);
      setUsingFallback(true);
      
      toast({
        title: "Mode hors ligne",
        description: "Utilisation des types d'assurance de base (connexion Supabase indisponible)",
        variant: "default",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateCommission = async (insuranceId: string, newCommission: number) => {
    if (usingFallback) {
      toast({
        title: "Mode hors ligne",
        description: "Impossible de modifier les commissions en mode hors ligne",
        variant: "destructive",
      });
      return { success: false, error: "Mode hors ligne" };
    }

    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({ commission: newCommission })
        .eq('id', insuranceId);

      if (error) throw error;

      toast({
        title: "Commission mise à jour",
        description: "La commission a été modifiée avec succès",
      });

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
    if (usingFallback) {
      toast({
        title: "Mode hors ligne",
        description: "Impossible d'ajouter des types d'assurance en mode hors ligne",
        variant: "destructive",
      });
      return { success: false, error: "Mode hors ligne" };
    }

    try {
      const { error } = await supabase
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
    if (usingFallback) {
      toast({
        title: "Mode hors ligne",
        description: "Impossible de modifier le statut en mode hors ligne",
        variant: "destructive",
      });
      return { success: false, error: "Mode hors ligne" };
    }

    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({ is_active: isActive })
        .eq('id', insuranceId);

      if (error) throw error;

      toast({
        title: isActive ? "Type d'assurance activé" : "Type d'assurance désactivé",
        description: "Le statut a été modifié avec succès",
      });

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
    usingFallback,
    updateCommission,
    addInsuranceType,
    toggleInsuranceType,
    refreshInsuranceTypes: fetchInsuranceTypes,
  };
};