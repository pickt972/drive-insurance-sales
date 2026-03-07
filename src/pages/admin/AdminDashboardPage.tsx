import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, Users, DollarSign, Target, Clock, User } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface TodaySale {
  id: string;
  amount: number;
  commission_amount: number;
  client_name: string | null;
  contract_number: string | null;
  created_at: string;
  profiles: { full_name: string };
  insurance_types: { name: string } | null;
}

export function AdminDashboardPage() {
  const [stats, setStats] = useState({
    totalSales: 0,
    totalCommission: 0,
    activeUsers: 0,
    monthSales: 0,
  });
  const [topSellers, setTopSellers] = useState<any[]>([]);
  const [todaySales, setTodaySales] = useState<TodaySale[]>([]);

  useEffect(() => {
    loadStats();
    loadTopSellers();
    loadTodaySales();
  }, []);

  const loadTodaySales = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data } = await (supabase as any)
        .from('insurance_sales')
        .select('id, amount, commission_amount, client_name, contract_number, created_at, profiles!inner(full_name), insurance_types(name)')
        .eq('sale_date', today)
        .order('created_at', { ascending: false });

      setTodaySales(data || []);
    } catch (error) {
      console.error('Error loading today sales:', error);
    }
  };

  const loadStats = async () => {
    try {
      const supabaseAny = supabase as any;
      const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
      const { data: sales } = await supabaseAny
        .from('insurance_sales')
        .select('amount, commission_amount')
        .gte('sale_date', startOfMonth.toISOString().split('T')[0]);

      const totalSales = sales?.reduce((sum: number, s: any) => sum + Number(s.amount), 0) || 0;
      const totalCommission = sales?.reduce((sum: number, s: any) => sum + Number(s.commission_amount), 0) || 0;

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

  const todayTotal = todaySales.reduce((sum, s) => sum + Number(s.amount), 0);
  const todayCommission = todaySales.reduce((sum, s) => sum + Number(s.commission_amount || 0), 0);

  const statCards = [
    {
      title: 'Ventes du jour',
      value: `${todaySales.length}`,
      description: `${todayTotal.toFixed(2)} € aujourd'hui`,
      icon: Clock,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
    },
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

      {/* Today's Sales Detail */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-amber-600" />
                Ventes du jour — {format(new Date(), 'EEEE d MMMM yyyy', { locale: fr })}
              </CardTitle>
              <CardDescription>
                {todaySales.length} vente{todaySales.length !== 1 ? 's' : ''} • {todayTotal.toFixed(2)} € • Commission: {todayCommission.toFixed(2)} €
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {todaySales.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune vente enregistrée aujourd'hui</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Heure</TableHead>
                  <TableHead>Vendeur</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead>Type d'assurance</TableHead>
                  <TableHead>N° Contrat</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {todaySales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(sale.created_at), 'HH:mm')}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="h-3.5 w-3.5 text-primary" />
                        </div>
                        <span className="font-medium">{sale.profiles?.full_name}</span>
                      </div>
                    </TableCell>
                    <TableCell>{sale.client_name || '—'}</TableCell>
                    <TableCell>
                      {sale.insurance_types?.name ? (
                        <Badge variant="secondary">{sale.insurance_types.name}</Badge>
                      ) : '—'}
                    </TableCell>
                    <TableCell className="font-mono text-sm">{sale.contract_number || '—'}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(sale.amount).toFixed(2)} €</TableCell>
                    <TableCell className="text-right text-green-600">{Number(sale.commission_amount || 0).toFixed(2)} €</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

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
