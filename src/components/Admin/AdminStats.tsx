import { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, DollarSign, Users as UsersIcon, Award } from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { startOfMonth, endOfMonth } from 'date-fns';

export function AdminStats() {
  const { sales } = useSales();
  const { users } = useUsers();

  // Stats globales du mois
  const monthStats = useMemo(() => {
    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= firstDay && saleDate <= lastDay;
    });

    const totalAmount = monthSales.reduce((sum, s) => sum + s.amount, 0);
    const totalCommission = monthSales.reduce((sum, s) => sum + s.commission, 0);
    const salesCount = monthSales.length;

    return { totalAmount, totalCommission, salesCount };
  }, [sales]);

  // Stats par employé (mois en cours)
  const employeeStats = useMemo(() => {
    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= firstDay && saleDate <= lastDay;
    });

    // Grouper par employé
    const grouped = monthSales.reduce((acc, sale) => {
      if (!acc[sale.employee_id]) {
        acc[sale.employee_id] = {
          employee_name: sale.employee_name,
          sales: [],
        };
      }
      acc[sale.employee_id].sales.push(sale);
      return acc;
    }, {} as Record<string, any>);

    // Calculer stats par employé
    const stats = Object.values(grouped).map((emp: any) => ({
      name: emp.employee_name,
      totalAmount: emp.sales.reduce((sum: number, s: any) => sum + s.amount, 0),
      totalCommission: emp.sales.reduce((sum: number, s: any) => sum + s.commission, 0),
      salesCount: emp.sales.length,
    }));

    // Trier par montant décroissant
    stats.sort((a, b) => b.totalAmount - a.totalAmount);

    return stats;
  }, [sales]);

  // Top 3 vendeurs
  const topSellers = employeeStats.slice(0, 3);

  // Données pour le graphique
  const chartData = employeeStats.slice(0, 10); // Top 10

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Ventes totales
            </CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {monthStats.totalAmount.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground">
              {monthStats.salesCount} vente{monthStats.salesCount > 1 ? 's' : ''} ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Commission totale
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {monthStats.totalCommission.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground">
              Moyenne : {(monthStats.totalCommission / monthStats.salesCount || 0).toFixed(2)} €/vente
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Employés actifs
            </CardTitle>
            <UsersIcon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground">
              {employeeStats.length} ont vendu ce mois
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Employé du mois
            </CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold">
              {topSellers[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground">
              {topSellers[0]?.totalCommission.toFixed(2)} € de commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Top 10 */}
      <Card>
        <CardHeader>
          <CardTitle>Top 10 vendeurs du mois</CardTitle>
          <CardDescription>Classement par montant total des ventes</CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)} €`}
              />
              <Legend />
              <Bar 
                dataKey="totalAmount" 
                fill="#2563eb" 
                name="Montant total"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="totalCommission" 
                fill="#16a34a" 
                name="Commission"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tableau classement */}
      <Card>
        <CardHeader>
          <CardTitle>Classement détaillé</CardTitle>
          <CardDescription>Tous les vendeurs du mois</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeeStats.map((emp, index) => (
              <div 
                key={emp.name}
                className="flex items-center justify-between p-4 rounded-lg border bg-card"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-muted-foreground w-8">
                    #{index + 1}
                  </div>
                  {index < 3 && (
                    <div className="text-2xl">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {emp.salesCount} vente{emp.salesCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-lg">
                    {emp.totalAmount.toFixed(2)} €
                  </p>
                  <p className="text-sm text-green-600">
                    {emp.totalCommission.toFixed(2)} € commission
                  </p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
