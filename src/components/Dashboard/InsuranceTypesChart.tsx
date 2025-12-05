import { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PieChart, Pie, Cell, Legend, Tooltip } from 'recharts';
import { startOfMonth, endOfMonth } from 'date-fns';

const COLORS = ['#2563eb', '#16a34a', '#eab308', '#dc2626', '#9333ea'];

export function InsuranceTypesChart() {
  const { sales, loading } = useSales();

  const chartData = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    
    const now = new Date();
    const firstDay = startOfMonth(now);
    const lastDay = endOfMonth(now);

    const monthSales = sales.filter(sale => {
      const saleDate = new Date(sale.sale_date);
      return saleDate >= firstDay && saleDate <= lastDay;
    });

    // Grouper par type
    const grouped = monthSales.reduce((acc, sale) => {
      if (!acc[sale.insurance_type]) {
        acc[sale.insurance_type] = { count: 0, amount: 0 };
      }
      acc[sale.insurance_type].count++;
      acc[sale.insurance_type].amount += sale.amount;
      return acc;
    }, {} as Record<string, { count: number; amount: number }>);

    return Object.entries(grouped).map(([name, data]) => ({
      name,
      value: data.count,
      amount: data.amount,
    }));
  }, [sales]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type d'assurance</CardTitle>
          <CardDescription>Chargement...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Chargement des données...
          </div>
        </CardContent>
      </Card>
    );
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Répartition par type d'assurance</CardTitle>
          <CardDescription>Mois en cours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Aucune vente ce mois-ci
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Répartition par type d'assurance</CardTitle>
        <CardDescription>Mois en cours</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <PieChart width={400} height={300} style={{ width: '100%', maxWidth: '100%' }}>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip 
              formatter={(value: number) => `${value} ventes`}
            />
            <Legend />
          </PieChart>
        </div>
      </CardContent>
    </Card>
  );
}
