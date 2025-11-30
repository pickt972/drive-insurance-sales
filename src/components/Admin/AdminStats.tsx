import { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { useUsers } from '@/hooks/useUsers';
import { exportEmployeeStatsPDF } from '@/utils/pdfExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, DollarSign, Users as UsersIcon, Award, FileText } from 'lucide-react';
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
      {/* KPI Cards modernisées */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="stat-card group border-primary/20 hover:border-primary/40 hover:shadow-primary animate-gentle-fade-in">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Ventes totales
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 group-hover:scale-110 transition-transform duration-300">
              <DollarSign className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-br from-primary to-primary-variant bg-clip-text text-transparent">
              {monthStats.totalAmount.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {monthStats.salesCount} vente{monthStats.salesCount > 1 ? 's' : ''} ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card group border-success/20 hover:border-success/40 hover:shadow-success animate-gentle-fade-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Commission totale
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-success/5 group-hover:scale-110 transition-transform duration-300">
              <TrendingUp className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-br from-success to-success-variant bg-clip-text text-transparent">
              {monthStats.totalCommission.toFixed(2)} €
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Moyenne : {(monthStats.totalCommission / monthStats.salesCount || 0).toFixed(2)} €/vente
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card group border-info/20 hover:border-info/40 hover:shadow-primary animate-gentle-fade-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employés actifs
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-info/10 to-info/5 group-hover:scale-110 transition-transform duration-300">
              <UsersIcon className="h-5 w-5 text-info" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold bg-gradient-to-br from-info to-primary bg-clip-text text-transparent">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {employeeStats.length} ont vendu ce mois
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card group border-orange/20 hover:border-orange/40 hover:shadow-orange animate-gentle-fade-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Employé du mois
            </CardTitle>
            <div className="p-2 rounded-lg bg-gradient-to-br from-orange/10 to-orange/5 group-hover:scale-110 transition-transform duration-300">
              <Award className="h-5 w-5 text-orange" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-lg font-bold bg-gradient-to-r from-orange to-warning bg-clip-text text-transparent">
              {topSellers[0]?.name || 'N/A'}
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {topSellers[0]?.totalCommission.toFixed(2)} € de commission
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Graphique Top 10 modernisé */}
      <Card className="modern-card animate-elegant-slide" style={{ animationDelay: '0.1s' }}>
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <BarChart className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Top 10 vendeurs du mois</CardTitle>
              <CardDescription>Classement par montant total des ventes</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
              <XAxis 
                dataKey="name" 
                angle={-45}
                textAnchor="end"
                height={100}
                tick={{ fill: 'hsl(var(--muted-foreground))' }}
              />
              <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip 
                formatter={(value: number) => `${value.toFixed(2)} €`}
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                }}
              />
              <Legend />
              <Bar 
                dataKey="totalAmount" 
                fill="hsl(var(--primary))"
                name="Montant total"
                radius={[8, 8, 0, 0]}
              />
              <Bar 
                dataKey="totalCommission" 
                fill="hsl(var(--success))"
                name="Commission"
                radius={[8, 8, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Tableau classement modernisé */}
      <Card className="modern-card animate-elegant-slide" style={{ animationDelay: '0.2s' }}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-orange/10 to-orange/5">
                <Award className="h-5 w-5 text-orange" />
              </div>
              <div>
                <CardTitle>Classement détaillé</CardTitle>
                <CardDescription>Tous les vendeurs du mois</CardDescription>
              </div>
            </div>
            <Button 
              variant="outline" 
              onClick={() => exportEmployeeStatsPDF(employeeStats, 'Classement du mois')}
              className="hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-300"
            >
              <FileText className="mr-2 h-4 w-4" />
              Exporter PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {employeeStats.map((emp, index) => (
              <div 
                key={emp.name}
                className="modern-card p-4 flex items-center justify-between group hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  <div className="text-2xl font-bold text-muted-foreground w-10 text-center">
                    #{index + 1}
                  </div>
                  {index < 3 && (
                    <div className="text-3xl animate-float-gentle">
                      {index === 0 ? '🥇' : index === 1 ? '🥈' : '🥉'}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-lg">{emp.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {emp.salesCount} vente{emp.salesCount > 1 ? 's' : ''}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-xl bg-gradient-to-r from-primary to-primary-variant bg-clip-text text-transparent">
                    {emp.totalAmount.toFixed(2)} €
                  </p>
                  <p className="text-sm font-semibold bg-gradient-to-r from-success to-success-variant bg-clip-text text-transparent">
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
