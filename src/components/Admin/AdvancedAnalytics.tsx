import { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { TrendingUp, TrendingDown, DollarSign, Target } from 'lucide-react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { startOfMonth, endOfMonth, format, subMonths, startOfWeek, endOfWeek } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--orange))',
  'hsl(var(--info))',
  'hsl(var(--purple))',
];

export function AdvancedAnalytics() {
  const { sales } = useSales();

  // Évolution mensuelle sur 6 mois
  const monthlyTrend = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const firstDay = startOfMonth(monthDate);
      const lastDay = endOfMonth(monthDate);
      
      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= firstDay && saleDate <= lastDay;
      });

      months.push({
        month: format(monthDate, 'MMM yyyy', { locale: fr }),
        ventes: monthSales.reduce((sum, s) => sum + s.amount, 0),
        commission: monthSales.reduce((sum, s) => sum + s.commission, 0),
        count: monthSales.length,
      });
    }
    return months;
  }, [sales]);

  // Évolution hebdomadaire du mois en cours
  const weeklyTrend = useMemo(() => {
    const now = new Date();
    const firstDay = startOfMonth(now);
    const weeks = [];
    let currentWeek = startOfWeek(firstDay, { locale: fr });

    while (currentWeek <= now) {
      const weekEnd = endOfWeek(currentWeek, { locale: fr });
      const weekSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= currentWeek && saleDate <= weekEnd;
      });

      weeks.push({
        week: `S${format(currentWeek, 'w', { locale: fr })}`,
        ventes: weekSales.reduce((sum, s) => sum + s.amount, 0),
        count: weekSales.length,
      });

      currentWeek = new Date(currentWeek.getTime() + (7 * 24 * 60 * 60 * 1000));
    }

    return weeks;
  }, [sales]);

  // Répartition par type d'assurance (valeur)
  const insuranceDistribution = useMemo(() => {
    const distribution = sales.reduce((acc, sale) => {
      const type = sale.insurance_type;
      if (!acc[type]) {
        acc[type] = { name: type, value: 0, count: 0 };
      }
      acc[type].value += sale.amount;
      acc[type].count += 1;
      return acc;
    }, {} as Record<string, { name: string; value: number; count: number }>);

    return Object.values(distribution).sort((a, b) => b.value - a.value);
  }, [sales]);

  // Performance par employé (top 5)
  const employeePerformance = useMemo(() => {
    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= firstDay && saleDate <= lastDay;
    });

    const byEmployee = monthSales.reduce((acc, sale) => {
      if (!acc[sale.employee_id]) {
        acc[sale.employee_id] = {
          name: sale.employee_name,
          ventes: 0,
          commission: 0,
        };
      }
      acc[sale.employee_id].ventes += sale.amount;
      acc[sale.employee_id].commission += sale.commission;
      return acc;
    }, {} as Record<string, { name: string; ventes: number; commission: number }>);

    return Object.values(byEmployee)
      .sort((a, b) => b.commission - a.commission)
      .slice(0, 5);
  }, [sales]);

  // Calcul de la tendance
  const trend = useMemo(() => {
    if (monthlyTrend.length < 2) return { percent: 0, isPositive: true };
    
    const current = monthlyTrend[monthlyTrend.length - 1].ventes;
    const previous = monthlyTrend[monthlyTrend.length - 2].ventes;
    
    if (previous === 0) return { percent: 100, isPositive: current > 0 };
    
    const percent = ((current - previous) / previous) * 100;
    return { percent: Math.abs(percent), isPositive: percent >= 0 };
  }, [monthlyTrend]);

  return (
    <div className="space-y-6 animate-gentle-fade-in">
      {/* Tendance globale */}
      <Card className="modern-card">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className={`p-2 rounded-lg bg-gradient-to-br ${trend.isPositive ? 'from-success/10 to-success/5' : 'from-destructive/10 to-destructive/5'}`}>
                {trend.isPositive ? (
                  <TrendingUp className="h-5 w-5 text-success" />
                ) : (
                  <TrendingDown className="h-5 w-5 text-destructive" />
                )}
              </div>
              <div>
                <CardTitle>Tendance des ventes</CardTitle>
                <CardDescription>Évolution par rapport au mois précédent</CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className={`text-3xl font-bold ${trend.isPositive ? 'text-success' : 'text-destructive'}`}>
                {trend.isPositive ? '+' : '-'}{trend.percent.toFixed(1)}%
              </div>
              <p className="text-sm text-muted-foreground">vs mois dernier</p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Graphiques principaux */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Évolution mensuelle */}
        <Card className="modern-card animate-elegant-slide" style={{ animationDelay: '0.1s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
                <DollarSign className="h-5 w-5 text-primary" />
              </div>
              <div>
                <CardTitle>Évolution mensuelle</CardTitle>
                <CardDescription>Ventes et commissions sur 6 mois</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={monthlyTrend}>
                <defs>
                  <linearGradient id="colorVentes" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorCommission" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis 
                  dataKey="month" 
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(2)} €`}
                />
                <Legend />
                <Area 
                  type="monotone" 
                  dataKey="ventes" 
                  stroke="hsl(var(--primary))" 
                  fillOpacity={1}
                  fill="url(#colorVentes)"
                  name="Ventes"
                />
                <Area 
                  type="monotone" 
                  dataKey="commission" 
                  stroke="hsl(var(--success))" 
                  fillOpacity={1}
                  fill="url(#colorCommission)"
                  name="Commission"
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Répartition par type */}
        <Card className="modern-card animate-elegant-slide" style={{ animationDelay: '0.2s' }}>
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-info/10 to-info/5">
                <Target className="h-5 w-5 text-info" />
              </div>
              <div>
                <CardTitle>Répartition par type</CardTitle>
                <CardDescription>Valeur des ventes par assurance</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={insuranceDistribution}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }: any) => `${name} ${((percent as number) * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {insuranceDistribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(2)} €`}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Graphiques secondaires */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Performance hebdomadaire */}
        <Card className="modern-card animate-elegant-slide" style={{ animationDelay: '0.3s' }}>
          <CardHeader>
            <CardTitle>Performance hebdomadaire</CardTitle>
            <CardDescription>Mois en cours</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={weeklyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis 
                  dataKey="week" 
                  tick={{ fill: 'hsl(var(--muted-foreground))' }}
                />
                <YAxis tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(2)} €`}
                />
                <Bar 
                  dataKey="ventes" 
                  fill="hsl(var(--info))" 
                  radius={[8, 8, 0, 0]}
                  name="Ventes"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top employés */}
        <Card className="modern-card animate-elegant-slide" style={{ animationDelay: '0.4s' }}>
          <CardHeader>
            <CardTitle>Top 5 employés du mois</CardTitle>
            <CardDescription>Classement par commission</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={employeePerformance} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))' }} />
                <YAxis 
                  dataKey="name" 
                  type="category" 
                  width={100}
                  tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                />
                <Tooltip 
                  contentStyle={{
                    backgroundColor: 'hsl(var(--card))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                  formatter={(value: number) => `${value.toFixed(2)} €`}
                />
                <Bar 
                  dataKey="commission" 
                  fill="hsl(var(--success))" 
                  radius={[0, 8, 8, 0]}
                  name="Commission"
                />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
