import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/hooks/useSupabaseAuth';
import { DashboardStats, SaleWithDetails } from '@/types/database';

export const useSupabaseSales = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCommission: 0,
    salesThisWeek: 0,
    topSellers: [],
    recentSales: [],
    weeklyEvolution: [],
  });
  const [loading, setLoading] = useState(true);
  const { profile } = useSupabaseAuth();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Calculer la date d'il y a 7 jours
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      const weekAgoIso = weekAgo.toISOString();

      // Récupérer toutes les ventes avec les détails
      const { data: sales, error } = await (supabase as any)
        .schema('api')
        .from('sales')
        .select(`
          *,
          insurance_types!inner(name, commission)
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Erreur lors de la récupération des ventes:', error);
        return;
      }

      const salesWithDetails: SaleWithDetails[] = sales?.map(sale => ({
        ...sale,
        insurance_name: sale.insurance_types?.name || 'Inconnu',
        employee_id: sale.employee_name, // Utiliser employee_name comme employee_id pour la compatibilité
      } as SaleWithDetails)) || [];

      // Filtrer selon le rôle
      const filteredSales = profile?.role === 'admin' 
        ? salesWithDetails 
        : salesWithDetails.filter(sale => sale.employee_name === profile?.username);

      // Calculer les statistiques
      const totalSales = filteredSales.length;
      const totalCommission = filteredSales.reduce((sum, sale) => sum + Number(sale.commission_amount), 0);
      
      const salesThisWeek = filteredSales.filter(
        sale => new Date(sale.created_at) >= weekAgo
      ).length;

      // Top vendeurs
      const topSellers = (() => {
        const sellerStats = filteredSales.reduce((acc, sale) => {
          const employeeName = sale.employee_name;
          if (!acc[employeeName]) {
            acc[employeeName] = {
              employee_name: employeeName,
              sales_count: 0,
              total_commission: 0,
            };
          }
          acc[employeeName].sales_count++;
          acc[employeeName].total_commission += Number(sale.commission_amount);
          return acc;
        }, {} as Record<string, any>);

        return Object.values(sellerStats)
          .sort((a: any, b: any) => b.total_commission - a.total_commission)
          .slice(0, 5);
      })();

      // Évolution hebdomadaire
      const weeklyEvolution = (() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
          const date = new Date();
          date.setDate(date.getDate() - i);
          const dateStr = date.toISOString().split('T')[0];
          
          const daySales = filteredSales.filter(sale => 
            sale.created_at.startsWith(dateStr)
          );
          
          days.push({
            date: dateStr,
            sales: daySales.length,
            commission: daySales.reduce((sum, sale) => sum + Number(sale.commission_amount), 0),
          });
        }
        return days;
      })();

      setStats({
        totalSales,
        totalCommission,
        salesThisWeek,
        topSellers,
        recentSales: filteredSales.slice(0, 10),
        weeklyEvolution,
      });

    } catch (error) {
      console.error('Erreur lors du calcul des statistiques:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fonction pour supprimer une vente
  const deleteSale = async (saleId: string) => {
    try {
      const { error } = await (supabase as any)
        .schema('api')
        .from('sales')
        .update({ status: 'deleted' })
        .eq('id', saleId);

      if (error) throw error;

      // Recharger les stats après suppression
      await fetchStats();
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression vente:', error);
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile]);

  return {
    stats,
    loading,
    refreshStats: fetchStats,
    deleteSale,
  };
};