import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Target } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommission: 0,
    activeUsers: 0,
    monthSales: 0,
  });
  const [topSellers, setTopSellers] = useState<any[]>([]);

  useEffect(() => {
    loadStats();
    loadTopSellers();
  }, []);

  const loadStats = async () => {
    try {
      const supabaseAny = supabase as any;
      
      // Total sales this month
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { data: sales } = await supabaseAny
        .from('insurance_sales')
        .select('amount, commission_amount')
        .gte('sale_date', startOfMonth.toISOString().split('T')[0]);

      const totalSales = sales?.reduce((sum: number, s: any) => sum + Number(s.amount), 0) || 0;
      const totalCommission = sales?.reduce((sum: number, s: any) => sum + Number(s.commission_amount), 0) || 0;

      // Active users
      const { count: userCount } = await supabaseAny
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
        .eq('role', 'user');

      setStats({
        totalSales,
        totalCommission,
        activeUsers: userCount || 0,
        monthSales: sales?.length || 0,
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadTopSellers = async () => {
    try {
      const supabaseAny = supabase as any;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      
      const { data: sales } = await supabaseAny
        .from('insurance_sales')
        .select('user_id, amount, commission_amount, profiles!inner(full_name)')
        .gte('sale_date', startOfMonth.toISOString().split('T')[0]);

      // Group by user
      const grouped = sales?.reduce((acc: any, sale: any) => {
        const userId = sale.user_id;
        if (!acc[userId]) {
          acc[userId] = {
            name: sale.profiles.full_name,
            totalAmount: 0,
            totalCommission: 0,
            count: 0,
          };
        }
        acc[userId].totalAmount += Number(sale.amount);
        acc[userId].totalCommission += Number(sale.commission_amount);
        acc[userId].count += 1;
        return acc;
      }, {});

      const topSellers = Object.values(grouped || {})
        .sort((a: any, b: any) => b.totalAmount - a.totalAmount)
        .slice(0, 10);

      setTopSellers(topSellers);
    } catch (error) {
      console.error('Error loading top sellers:', error);
    }
  };

  const statCards = [
    {
      title: 'Ventes du mois',
      value: `${stats.totalSales.toFixed(2)} €`,
      description: `${stats.monthSales} ventes`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      title: 'Commissions',
      value: `${stats.totalCommission.toFixed(2)} €`,
      description: 'Total du mois',
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      title: 'Utilisateurs actifs',
      value: stats.activeUsers,
      description: 'Employés',
      icon: Users,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
    {
      title: 'Objectifs',
      value: '0',
      description: 'En cours',
      icon: Target,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold text-gray-900">Tableau de bord</h2>
        <p className="text-gray-600">Vue d'ensemble de l'activité</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
              <div className={`${stat.bgColor} p-2 rounded-lg`}>
                <stat.icon className={`h-4 w-4 ${stat.color}`} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <p className="text-xs text-muted-foreground">{stat.description}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Top Sellers Chart */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 vendeurs du mois</CardTitle>
          <CardDescription>Classement par montant total de ventes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={topSellers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="totalAmount" fill="#3b82f6" name="Ventes (€)" />
              <Bar dataKey="totalCommission" fill="#10b981" name="Commissions (€)" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
