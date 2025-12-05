import { useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend } from 'recharts';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { fr } from 'date-fns/locale';

export function ComparisonChart() {
  const { sales, loading } = useSales();

  const chartData = useMemo(() => {
    if (!sales || sales.length === 0) return [];
    
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

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Comparaison annuelle</CardTitle>
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>Comparaison annuelle</CardTitle>
        <CardDescription>Année en cours vs année précédente</CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ width: '100%', height: 300 }}>
          <LineChart width={500} height={300} data={chartData} style={{ width: '100%', maxWidth: '100%' }}>
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
        </div>
      </CardContent>
    </Card>
  );
}
