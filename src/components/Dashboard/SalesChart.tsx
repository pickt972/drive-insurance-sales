import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useSales } from '@/hooks/useSales';
import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export function SalesChart() {
  const { sales } = useSales();

  // Données des 6 derniers mois
  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();

    // Générer les 6 derniers mois
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const firstDay = startOfMonth(monthDate);
      const lastDay = endOfMonth(monthDate);

      const monthSales = sales.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate >= firstDay && saleDate <= lastDay;
      });

      const total = monthSales.reduce((sum, s) => sum + s.amount, 0);

      months.push({
        month: format(monthDate, 'MMM', { locale: fr }),
        total: parseFloat(total.toFixed(2)),
        count: monthSales.length,
      });
    }

    return months;
  }, [sales]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Évolution des ventes</CardTitle>
        <CardDescription>6 derniers mois</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(2)} €`, 'Total']}
              labelFormatter={(label) => `Mois : ${label}`}
            />
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#2563eb" 
              strokeWidth={2}
              dot={{ fill: '#2563eb' }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
