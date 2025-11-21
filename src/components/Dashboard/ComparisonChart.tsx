import { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ComparisonChart() {
  const { sales } = useSales();

  const chartData = useMemo(() => {
    const months = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const currentMonth = subMonths(now, i);
      const lastYearMonth = subMonths(currentMonth, 12);

      const getCurrentMonthSales = (date: Date) => {
        const firstDay = startOfMonth(date);
        const lastDay = endOfMonth(date);
        return sales.filter(sale => {
          const saleDate = new Date(sale.sale_date);
          return saleDate >= firstDay && saleDate <= lastDay;
        });
      };

      const currentSales = getCurrentMonthSales(currentMonth);
      const lastYearSales = getCurrentMonthSales(lastYearMonth);

      months.push({
        month: format(currentMonth, 'MMM', { locale: fr }),
        current: currentSales.reduce((sum, s) => sum + s.amount, 0),
        lastYear: lastYearSales.reduce((sum, s) => sum + s.amount, 0),
      });
    }

    return months;
  }, [sales]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison annuelle</CardTitle>
        <CardDescription>Année en cours vs année précédente</CardDescription>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value: number) => `${value.toFixed(2)} €`} />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="current" 
              stroke="#2563eb" 
              strokeWidth={2}
              name="2025"
            />
            <Line 
              type="monotone" 
              dataKey="lastYear" 
              stroke="#9ca3af" 
              strokeWidth={2}
              strokeDasharray="5 5"
              name="2024"
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
