import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

// Temporary workaround for Supabase types
const supabaseAny = supabase as any;

export interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  commission_rate: number;
  commission_amount: number;
  is_active: boolean;
  // Compatibilité anciens champs
  description?: string;
  price?: number;
  isActive?: boolean;
}

export function useInsuranceTypes() {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchInsuranceTypes();
  }, []);

  const fetchInsuranceTypes = async () => {
    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('insurance_types')
        .select('*')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (error) throw error;

      // Mapper pour compatibilité
      const mapped = (data || []).map((type: any) => ({
        ...type,
        commission: type.commission_amount > 0 ? type.commission_amount : type.commission_rate,
        commission_rate: type.commission_rate || 0,
        commission_amount: type.commission_amount || 0,
        isActive: type.is_active,
        price: type.commission_amount > 0 ? type.commission_amount : type.commission_rate,
        description: type.name,
      }));

      setInsuranceTypes(mapped);
    } catch (error) {
      console.error('Error fetching insurance types:', error);
      // En cas d'erreur, utiliser des types par défaut
      setInsuranceTypes([
        { id: '1', name: 'CDW', description: 'Collision Damage Waiver', commission: 15, commission_rate: 15, commission_amount: 0, price: 15, is_active: true, isActive: true },
        { id: '2', name: 'TP', description: 'Theft Protection', commission: 12, commission_rate: 12, commission_amount: 0, price: 12, is_active: true, isActive: true },
        { id: '3', name: 'PAI', description: 'Personal Accident Insurance', commission: 8, commission_rate: 8, commission_amount: 0, price: 8, is_active: true, isActive: true },
        { id: '4', name: 'Super Cover', description: 'CDW + TP + PAI', commission: 30, commission_rate: 0, commission_amount: 30, price: 30, is_active: true, isActive: true },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const addInsuranceType = async (typeData: Partial<InsuranceType>) => {
    try {
      const { data, error } = await supabaseAny
        .from('insurance_types')
        .insert({
          name: typeData.name,
          commission: typeData.commission || typeData.price,
          is_active: true,
        })
        .select()
        .single();

      if (error) throw error;

      await fetchInsuranceTypes();
      return data;
    } catch (error) {
      console.error('Error adding insurance type:', error);
      throw error;
    }
  };

  const updateInsuranceType = async (id: string, updates: Partial<InsuranceType>) => {
    try {
      const { error } = await supabaseAny
        .from('insurance_types')
        .update({
          name: updates.name,
          commission: updates.commission || updates.price,
        })
        .eq('id', id);

      if (error) throw error;

      await fetchInsuranceTypes();
    } catch (error) {
      console.error('Error updating insurance type:', error);
      throw error;
    }
  };

  const removeInsuranceType = async (id: string) => {
    try {
      const { error } = await supabaseAny
        .from('insurance_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      await fetchInsuranceTypes();
    } catch (error) {
      console.error('Error removing insurance type:', error);
      throw error;
    }
  };

  return {
    insuranceTypes,
    loading,
    fetchInsuranceTypes,
    addInsuranceType,
    updateInsuranceType,
    removeInsuranceType,
  };
}
