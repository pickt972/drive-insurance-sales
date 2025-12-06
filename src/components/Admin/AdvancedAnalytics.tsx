import { useMemo, useState } from 'react';
import { useSales } from '@/hooks/useSales';
import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, DollarSign, Target, Users, BarChart3, FileDown } from 'lucide-react';
import { exportPerformanceComparisonPDF } from '@/utils/pdfExport';
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import { startOfMonth, endOfMonth, format, subMonths, startOfWeek, endOfWeek, subWeeks, startOfYear, endOfYear } from 'date-fns';
import { fr } from 'date-fns/locale';

const COLORS = [
  'hsl(var(--primary))',
  'hsl(var(--success))',
  'hsl(var(--orange))',
  'hsl(var(--info))',
  'hsl(var(--purple))',
  '#f472b6',
  '#22d3ee',
  '#a78bfa',
];

type PeriodFilter = 'week' | 'month' | '3months' | 'year';

export function AdvancedAnalytics() {
  const { sales } = useSales();
  const { users } = useUsers();
  const [comparisonPeriod, setComparisonPeriod] = useState<PeriodFilter>('month');

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

  // Comparaison des performances entre utilisateurs
  const userComparison = useMemo(() => {
    const now = new Date();
    let startDate: Date;
    let endDate = now;

    switch (comparisonPeriod) {
      case 'week':
        startDate = subWeeks(now, 1);
        break;
      case 'month':
        startDate = startOfMonth(now);
        break;
      case '3months':
        startDate = subMonths(now, 3);
        break;
      case 'year':
        startDate = startOfYear(now);
        endDate = endOfYear(now);
        break;
      default:
        startDate = startOfMonth(now);
    }

    const periodSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= startDate && saleDate <= endDate;
    });

    // Grouper par utilisateur
    const byUser = periodSales.reduce((acc, sale) => {
      const userId = sale.user_id || sale.employee_id;
      if (!acc[userId]) {
        acc[userId] = {
          id: userId,
          name: sale.employee_name || 'Inconnu',
          ventes: 0,
          commission: 0,
          count: 0,
        };
      }
      acc[userId].ventes += sale.amount;
      acc[userId].commission += sale.commission;
      acc[userId].count += 1;
      return acc;
    }, {} as Record<string, { id: string; name: string; ventes: number; commission: number; count: number }>);

    return Object.values(byUser)
      .sort((a, b) => b.commission - a.commission);
  }, [sales, comparisonPeriod]);

  // Données pour le radar chart (top 5 utilisateurs)
  const radarData = useMemo(() => {
    const topUsers = userComparison.slice(0, 5);
    if (topUsers.length === 0) return [];

    // Normaliser les données pour le radar
    const maxVentes = Math.max(...topUsers.map(u => u.ventes), 1);
    const maxCommission = Math.max(...topUsers.map(u => u.commission), 1);
    const maxCount = Math.max(...topUsers.map(u => u.count), 1);

    return topUsers.map(user => ({
      name: user.name.split(' ')[0], // Prénom seulement
      ventes: Math.round((user.ventes / maxVentes) * 100),
      commission: Math.round((user.commission / maxCommission) * 100),
      nombreVentes: Math.round((user.count / maxCount) * 100),
      fullName: user.name,
      realVentes: user.ventes,
      realCommission: user.commission,
      realCount: user.count,
    }));
  }, [userComparison]);

  const getPeriodLabel = (period: PeriodFilter) => {
    switch (period) {
      case 'week': return 'Cette semaine';
      case 'month': return 'Ce mois';
      case '3months': return '3 derniers mois';
      case 'year': return 'Cette année';
    }
  };

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

      {/* Comparaison des performances entre utilisateurs */}
      <Card className="modern-card animate-elegant-slide" style={{ animationDelay: '0.5s' }}>
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-purple-500/10 to-purple-500/5">
                <Users className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <CardTitle>Comparaison des performances</CardTitle>
                <CardDescription>Analyse comparative entre utilisateurs</CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => exportPerformanceComparisonPDF(userComparison, getPeriodLabel(comparisonPeriod))}
                disabled={userComparison.length === 0}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export PDF
              </Button>
              <Select value={comparisonPeriod} onValueChange={(v) => setComparisonPeriod(v as PeriodFilter)}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Periode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="3months">3 derniers mois</SelectItem>
                  <SelectItem value="year">Cette annee</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6 lg:grid-cols-2">
            {/* Bar Chart - Classement par commission */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Classement par commission ({getPeriodLabel(comparisonPeriod)})
              </h4>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={userComparison} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="opacity-50" />
                  <XAxis type="number" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={90}
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                  />
                  <Tooltip 
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    formatter={(value: number, name: string) => [
                      name === 'commission' ? `${value.toFixed(2)} €` : 
                      name === 'ventes' ? `${value.toFixed(2)} €` : 
                      `${value} ventes`,
                      name === 'commission' ? 'Commission' : 
                      name === 'ventes' ? 'CA' : 'Nombre'
                    ]}
                  />
                  <Legend />
                  <Bar 
                    dataKey="commission" 
                    fill="hsl(var(--success))" 
                    radius={[0, 4, 4, 0]}
                    name="Commission"
                  />
                  <Bar 
                    dataKey="count" 
                    fill="hsl(var(--info))" 
                    radius={[0, 4, 4, 0]}
                    name="Nb ventes"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Radar Chart - Profil des performances */}
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-4 flex items-center gap-2">
                <Target className="h-4 w-4" />
                Profil de performance (Top 5)
              </h4>
              {radarData.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 11 }}
                    />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 10 }} />
                    <Tooltip 
                      contentStyle={{
                        backgroundColor: 'hsl(var(--card))',
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string, props: any) => {
                        const item = props.payload;
                        if (name === 'ventes') return [`${item.realVentes.toFixed(2)} €`, 'CA'];
                        if (name === 'commission') return [`${item.realCommission.toFixed(2)} €`, 'Commission'];
                        if (name === 'nombreVentes') return [`${item.realCount}`, 'Nb ventes'];
                        return [value, name];
                      }}
                    />
                    <Legend />
                    <Radar 
                      name="CA" 
                      dataKey="ventes" 
                      stroke="hsl(var(--primary))" 
                      fill="hsl(var(--primary))" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Commission" 
                      dataKey="commission" 
                      stroke="hsl(var(--success))" 
                      fill="hsl(var(--success))" 
                      fillOpacity={0.3} 
                    />
                    <Radar 
                      name="Nb ventes" 
                      dataKey="nombreVentes" 
                      stroke="hsl(var(--info))" 
                      fill="hsl(var(--info))" 
                      fillOpacity={0.3} 
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                  Aucune donnée pour cette période
                </div>
              )}
            </div>
          </div>

          {/* Tableau récapitulatif */}
          {userComparison.length > 0 && (
            <div className="mt-6 pt-6 border-t">
              <h4 className="text-sm font-medium text-muted-foreground mb-4">
                Récapitulatif détaillé ({getPeriodLabel(comparisonPeriod)})
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">#</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Utilisateur</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Nb ventes</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">CA</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Commission</th>
                      <th className="text-right py-2 px-2 font-medium text-muted-foreground">Moy/vente</th>
                    </tr>
                  </thead>
                  <tbody>
                    {userComparison.map((user, index) => (
                      <tr key={user.id} className="border-b border-border/50 hover:bg-muted/50">
                        <td className="py-2 px-2">
                          {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : index + 1}
                        </td>
                        <td className="py-2 px-2 font-medium">{user.name}</td>
                        <td className="py-2 px-2 text-right">{user.count}</td>
                        <td className="py-2 px-2 text-right">{user.ventes.toFixed(2)} €</td>
                        <td className="py-2 px-2 text-right text-success font-medium">{user.commission.toFixed(2)} €</td>
                        <td className="py-2 px-2 text-right text-muted-foreground">
                          {user.count > 0 ? (user.commission / user.count).toFixed(2) : '0.00'} €
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
