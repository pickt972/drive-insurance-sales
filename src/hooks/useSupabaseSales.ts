import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useSupabaseAuth } from '@/contexts/SupabaseAuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Sale {
  id: string;
  employee_name: string;
  client_name: string;
  client_email?: string;
  client_phone?: string;
  reservation_number: string;
  commission_amount: number;
  insurance_type_id: string;
  notes?: string;
  status: 'active' | 'deleted' | 'archived';
  created_at: string;
  updated_at: string;
}

interface DashboardStats {
  totalSales: number;
  totalCommission: number;
  salesThisWeek: number;
  topSellers: Array<{
    employee_name: string;
    sales_count: number;
    total_commission: number;
  }>;
  recentSales: Sale[];
  weeklyEvolution: Array<{
    date: string;
    sales: number;
    commission: number;
  }>;
}

export const useSupabaseSales = () => {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalCommission: 0,
    salesThisWeek: 0,
    topSellers: [],
    recentSales: [],
    weeklyEvolution: [],
  });
  const [allSales, setAllSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile, isAdmin } = useSupabaseAuth();
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Récupérer les ventes actives du mois en cours
      const { data: sales, error } = await supabase
        .from('current_month_sales')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const salesData = sales as Sale[];

      // Filtrer selon le rôle
      const filteredSales = isAdmin 
        ? salesData 
        : salesData.filter(sale => sale.employee_name === profile?.username);

      setAllSales(filteredSales);

      // Calculer les statistiques
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const totalSales = filteredSales.length;
      const totalCommission = filteredSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
      const salesThisWeek = filteredSales.filter(
        sale => new Date(sale.created_at) >= weekAgo
      ).length;

      // Top vendeurs (toujours toutes les ventes pour les stats globales)
      const sellerStats = salesData.reduce((acc, sale) => {
        const employeeName = sale.employee_name;
        if (!acc[employeeName]) {
          acc[employeeName] = {
            employee_name: employeeName,
            sales_count: 0,
            total_commission: 0,
          };
        }
        acc[employeeName].sales_count++;
        acc[employeeName].total_commission += sale.commission_amount;
        return acc;
      }, {} as Record<string, any>);

      const topSellers = Object.values(sellerStats)
        .sort((a: any, b: any) => b.total_commission - a.total_commission)
        .slice(0, 5);

      // Évolution hebdomadaire
      const weeklyEvolution = [];
      for (let i = 6; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        const daySales = filteredSales.filter(sale => 
          sale.created_at.startsWith(dateStr)
        );
        
        weeklyEvolution.push({
          date: dateStr,
          sales: daySales.length,
          commission: daySales.reduce((sum, sale) => sum + sale.commission_amount, 0),
        });
      }

      setStats({
        totalSales,
        totalCommission,
        salesThisWeek,
        topSellers,
        recentSales: filteredSales.slice(0, 10),
        weeklyEvolution,
      });

    } catch (error) {
      console.error('Erreur chargement stats:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les statistiques",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const deleteSale = async (saleId: string) => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'deleted', updated_at: new Date().toISOString() })
        .eq('id', saleId);

      if (error) throw error;

      await fetchStats();
      
      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée avec succès",
      });
      
      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression vente:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer la vente",
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  useEffect(() => {
    if (profile) {
      fetchStats();
    }
  }, [profile, isAdmin]);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!profile) return;

    const channel = supabase
      .channel('sales-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'sales'
        },
        (payload) => {
          console.log('Modification de vente détectée:', payload);
          fetchStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [profile]);

  return {
    stats,
    allSales,
    loading,
    refreshStats: fetchStats,
    deleteSale,
  };
};
