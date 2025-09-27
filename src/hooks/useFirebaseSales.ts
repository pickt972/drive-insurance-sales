import { useState, useEffect } from 'react';
import { 
  collection, 
  doc, 
  getDocs, 
  addDoc, 
  updateDoc, 
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  onSnapshot
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';
import { useToast } from '@/hooks/use-toast';

export interface Sale {
  id: string;
  employee_name: string;
  client_name: string;
  reservation_number: string;
  commission_amount: number;
  created_at: string;
  insurance_types: string[];
  notes?: string;
  status: 'active' | 'deleted';
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

export const useFirebaseSales = () => {
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
  const { profile } = useFirebaseAuth();
  const { toast } = useToast();

  const fetchStats = async () => {
    try {
      setLoading(true);
      
      // Récupérer toutes les ventes actives
      const q = query(
        collection(db, 'sales'),
        where('status', '==', 'active'),
        orderBy('created_at', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      const sales: Sale[] = [];
      
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        sales.push({
          id: doc.id,
          employee_name: data.employee_name,
          client_name: data.client_name,
          reservation_number: data.reservation_number,
          commission_amount: data.commission_amount,
          created_at: data.created_at,
          insurance_types: data.insurance_types || [],
          notes: data.notes,
          status: data.status
        });
      });

      // Filtrer selon le rôle
      const filteredSales = profile?.role === 'admin' 
        ? sales 
        : sales.filter(sale => sale.employee_name === profile?.username);

      setAllSales(filteredSales);

      // Calculer les statistiques
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const totalSales = filteredSales.length;
      const totalCommission = filteredSales.reduce((sum, sale) => sum + sale.commission_amount, 0);
      const salesThisWeek = filteredSales.filter(
        sale => new Date(sale.created_at) >= weekAgo
      ).length;

      // Top vendeurs
      const sellerStats = sales.reduce((acc, sale) => {
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
      console.error('Erreur lors du calcul des statistiques:', error);
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
      await updateDoc(doc(db, 'sales', saleId), {
        status: 'deleted',
        updatedAt: new Date().toISOString()
      });

      await fetchStats();
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
  }, [profile]);

  // Écouter les mises à jour en temps réel
  useEffect(() => {
    if (!profile) return;

    const q = query(
      collection(db, 'sales'),
      where('status', '==', 'active')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Modification de vente détectée, rafraîchissement...');
      fetchStats();
    });

    return () => unsubscribe();
  }, [profile]);

  // Calculer les statistiques d'assurances pour le camembert
  const getInsuranceStats = () => {
    const insuranceCount: Record<string, number> = {};
    
    allSales.forEach(sale => {
      sale.insurance_types.forEach((insurance: string) => {
        insuranceCount[insurance] = (insuranceCount[insurance] || 0) + 1;
      });
    });

    return Object.entries(insuranceCount)
      .map(([name, value]) => ({ name, value, color: '' }))
      .sort((a, b) => b.value - a.value);
  };

  return {
    stats,
    allSales,
    loading,
    refreshStats: fetchStats,
    deleteSale,
    insuranceStats: getInsuranceStats(),
  };
};