import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  ShoppingCart,
  Euro,
  Users,
  TrendingUp,
  Target,
  Award,
  Building2,
  Calendar
} from 'lucide-react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

interface DashboardStats {
  totalSales: number;
  totalAmount: number;
  totalCommission: number;
  salesCount: number;
  employeeCount: number;
  averagePerSale: number;
  objectiveProgress: number;
}

interface SalesByType {
  name: string;
  value: number;
  amount: number;
  [key: string]: string | number;
}

interface SalesByEmployee {
  name: string;
  sales: number;
  amount: number;
  commission: number;
}

interface SalesTrend {
  date: string;
  sales: number;
  amount: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    totalSales: 0,
    totalAmount: 0,
    totalCommission: 0,
    salesCount: 0,
    employeeCount: 0,
    averagePerSale: 0,
    objectiveProgress: 0,
  });
  const [salesByType, setSalesByType] = useState<SalesByType[]>([]);
  const [salesByEmployee, setSalesByEmployee] = useState<SalesByEmployee[]>([]);
  const [salesTrend, setSalesTrend] = useState<SalesTrend[]>([]);
  const [period, setPeriod] = useState('month');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, [period]);

  const getDateRange = () => {
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case 'week':
        startDate = new Date(now.setDate(now.getDate() - 7));
        break;
      case 'month':
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        break;
      case 'quarter':
        const quarter = Math.floor(now.getMonth() / 3);
        startDate = new Date(now.getFullYear(), quarter * 3, 1);
        break;
      case 'year':
        startDate = new Date(now.getFullYear(), 0, 1);
        break;
      default:
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    return { start: startDate.toISOString().split('T')[0], end: new Date().toISOString().split('T')[0] };
  };

  const fetchDashboardData = async () => {
    setIsLoading(true);
    const { start, end } = getDateRange();

    try {
      // Statistiques générales
      const { data: salesData, error: salesError } = await (supabase as any)
        .from('insurance_sales')
        .select(`
          id,
          amount,
          commission_amount,
          sale_date,
          user_id,
          insurance_type_id,
          profiles!inner(full_name),
          insurance_types!inner(name)
        `)
        .gte('sale_date', start)
        .lte('sale_date', end)
        .eq('status', 'validated');

      if (salesError) throw salesError;

      // Nombre d'employés actifs
      const { count: employeeCount } = await (supabase as any)
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true);

      // Calcul des stats
      const totalAmount = (salesData as any)?.reduce((sum: number, sale: any) => sum + Number(sale.amount), 0) || 0;
      const totalCommission = (salesData as any)?.reduce((sum: number, sale: any) => sum + Number(sale.commission_amount || 0), 0) || 0;
      const salesCount = (salesData as any)?.length || 0;

      setStats({
        totalSales: salesCount,
        totalAmount,
        totalCommission,
        salesCount,
        employeeCount: employeeCount || 0,
        averagePerSale: salesCount > 0 ? totalAmount / salesCount : 0,
        objectiveProgress: 75, // À calculer selon les objectifs
      });

      // Ventes par type
      const typeMap = new Map<string, { count: number; amount: number }>();
      (salesData as any)?.forEach((sale: any) => {
        const typeName = sale.insurance_types?.name || 'Inconnu';
        const existing = typeMap.get(typeName) || { count: 0, amount: 0 };
        typeMap.set(typeName, {
          count: existing.count + 1,
          amount: existing.amount + Number(sale.amount),
        });
      });

      setSalesByType(
        Array.from(typeMap.entries()).map(([name, data]) => ({
          name,
          value: data.count,
          amount: data.amount,
        }))
      );

      // Ventes par employé
      const employeeMap = new Map<string, { sales: number; amount: number; commission: number }>();
      (salesData as any)?.forEach((sale: any) => {
        const employeeName = sale.profiles?.full_name || 'Inconnu';
        const existing = employeeMap.get(employeeName) || { sales: 0, amount: 0, commission: 0 };
        employeeMap.set(employeeName, {
          sales: existing.sales + 1,
          amount: existing.amount + Number(sale.amount),
          commission: existing.commission + Number(sale.commission_amount || 0),
        });
      });

      setSalesByEmployee(
        Array.from(employeeMap.entries())
          .map(([name, data]) => ({ name, ...data }))
          .sort((a, b) => b.amount - a.amount)
      );

      // Tendance des ventes
      const trendMap = new Map<string, { sales: number; amount: number }>();
      (salesData as any)?.forEach((sale: any) => {
        const date = sale.sale_date;
        const existing = trendMap.get(date) || { sales: 0, amount: 0 };
        trendMap.set(date, {
          sales: existing.sales + 1,
          amount: existing.amount + Number(sale.amount),
        });
      });

      setSalesTrend(
        Array.from(trendMap.entries())
          .map(([date, data]) => ({ date, ...data }))
          .sort((a, b) => a.date.localeCompare(b.date))
      );

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
    }).format(value);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-gray-500">Vue d'ensemble des performances</p>
        </div>
        <Select value={period} onValueChange={setPeriod}>
          <SelectTrigger className="w-[180px]">
            <Calendar className="h-4 w-4 mr-2" />
            <SelectValue placeholder="Période" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Cette semaine</SelectItem>
            <SelectItem value="month">Ce mois</SelectItem>
            <SelectItem value="quarter">Ce trimestre</SelectItem>
            <SelectItem value="year">Cette année</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Ventes totales</p>
                <p className="text-2xl font-bold text-gray-900">{stats.totalSales}</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-full flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Chiffre d'affaires</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalAmount)}</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-full flex items-center justify-center">
                <Euro className="h-6 w-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Commissions</p>
                <p className="text-2xl font-bold text-gray-900">{formatCurrency(stats.totalCommission)}</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-full flex items-center justify-center">
                <Award className="h-6 w-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500">Employés actifs</p>
                <p className="text-2xl font-bold text-gray-900">{stats.employeeCount}</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Évolution des ventes */}
        <Card>
          <CardHeader>
            <CardTitle>Évolution des ventes</CardTitle>
            <CardDescription>Tendance sur la période sélectionnée</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'amount' ? formatCurrency(value) : value,
                      name === 'amount' ? 'Montant' : 'Ventes'
                    ]}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="amount"
                    name="Montant"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ fill: '#3b82f6' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Nombre"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: '#10b981' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition par type */}
        <Card>
          <CardHeader>
            <CardTitle>Répartition par type d'assurance</CardTitle>
            <CardDescription>Distribution des ventes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={salesByType}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {salesByType.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [value, 'Ventes']} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Performance par employé */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Performance par employé</CardTitle>
            <CardDescription>Classement des ventes par employé</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={salesByEmployee} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" tick={{ fontSize: 12 }} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 12 }} width={100} />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      name === 'amount' || name === 'commission'
                        ? formatCurrency(value)
                        : value,
                      name === 'amount' ? 'Montant' : name === 'commission' ? 'Commission' : 'Ventes'
                    ]}
                  />
                  <Legend />
                  <Bar dataKey="amount" name="Montant" fill="#3b82f6" />
                  <Bar dataKey="commission" name="Commission" fill="#10b981" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
