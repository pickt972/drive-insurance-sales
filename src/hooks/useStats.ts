import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface Stats {
  totalAmount: number;
  totalCommission: number;
  salesCount: number;
  averageAmount: number;
}

export function useStats() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(false);

  // Calculer les statistiques
  const calculateStats = (sales: any[]): Stats => {
    const totalAmount = sales.reduce((sum, s) => sum + (s.amount || 0), 0);
    const totalCommission = sales.reduce((sum, s) => sum + (s.commission || 0), 0);
    const salesCount = sales.length;
    const averageAmount = salesCount > 0 ? totalAmount / salesCount : 0;

    return {
      totalAmount,
      totalCommission,
      salesCount,
      averageAmount,
    };
  };

  // Mes statistiques
  const getMyStats = async (startDate?: string, endDate?: string) => {
    if (!user) return null;

    try {
      setLoading(true);

      let query = supabase
        .from('insurance_sales')
        .select('*')
        .eq('employee_id', user.id)
        .eq('is_deleted', false);

      if (startDate) query = query.gte('sale_date', startDate);
      if (endDate) query = query.lte('sale_date', endDate);

      const { data, error } = await query;
      if (error) throw error;

      return calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching my stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Statistiques globales (admin only)
  const getGlobalStats = async (startDate?: string, endDate?: string) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      let query = supabase
        .from('insurance_sales')
        .select('*')
        .eq('is_deleted', false);

      if (startDate) query = query.gte('sale_date', startDate);
      if (endDate) query = query.lte('sale_date', endDate);

      const { data, error } = await query;
      if (error) throw error;

      return calculateStats(data || []);
    } catch (error) {
      console.error('Error fetching global stats:', error);
      return null;
    } finally {
      setLoading(false);
    }
  };

  // Statistiques par employé (admin only)
  const getStatsByEmployee = async (startDate?: string, endDate?: string) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      let query = supabase
        .from('insurance_sales')
        .select('employee_id, employee_name, amount, commission')
        .eq('is_deleted', false);

      if (startDate) query = query.gte('sale_date', startDate);
      if (endDate) query = query.lte('sale_date', endDate);

      const { data, error } = await query;
      if (error) throw error;

      // Grouper par employé
      const grouped = (data || []).reduce((acc, sale) => {
        if (!acc[sale.employee_id]) {
          acc[sale.employee_id] = {
            employee_id: sale.employee_id,
            employee_name: sale.employee_name,
            sales: [],
          };
        }
        acc[sale.employee_id].sales.push(sale);
        return acc;
      }, {} as Record<string, any>);

      // Calculer stats par employé
      return Object.values(grouped).map((emp: any) => ({
        employee_id: emp.employee_id,
        employee_name: emp.employee_name,
        ...calculateStats(emp.sales),
      }));
    } catch (error) {
      console.error('Error fetching stats by employee:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getMyStats,
    getGlobalStats,
    getStatsByEmployee,
  };
}
