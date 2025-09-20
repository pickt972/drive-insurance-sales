import React, { useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  TrendingUp, 
  Users, 
  Euro, 
  Target,
  BarChart3,
  PieChart
} from 'lucide-react';
import { Sale } from '@/hooks/useSalesData';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface DashboardProps {
  sales: Sale[];
  loading: boolean;
}

interface StatsCard {
  title: string;
  value: string;
  icon: React.ElementType;
  description: string;
  gradient: string;
}

export const Dashboard: React.FC<DashboardProps> = ({ sales, loading }) => {
  const stats = useMemo(() => {
    if (!sales.length) {
      return {
        totalSales: 0,
        totalCommission: 0,
        employeeCount: 0,
        avgCommissionPerSale: 0,
        topEmployee: 'Aucun',
        salesThisWeek: 0
      };
    }

    const totalSales = sales.length;
    const totalCommission = sales.reduce((sum, sale) => sum + sale.commission_amount, 0);
    const employees = [...new Set(sales.map(sale => sale.employee_name))];
    const avgCommissionPerSale = totalSales > 0 ? totalCommission / totalSales : 0;

    // Sales this week
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const salesThisWeek = sales.filter(sale => 
      new Date(sale.created_at) >= weekAgo
    ).length;

    // Top employee
    const salesByEmployee = sales.reduce((acc, sale) => {
      acc[sale.employee_name] = (acc[sale.employee_name] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const topEmployee = Object.entries(salesByEmployee)
      .sort(([,a], [,b]) => b - a)[0]?.[0] || 'Aucun';

    return {
      totalSales,
      totalCommission,
      employeeCount: employees.length,
      avgCommissionPerSale,
      topEmployee,
      salesThisWeek
    };
  }, [sales]);

  const statsCards: StatsCard[] = [
    {
      title: "Ventes totales",
      value: stats.totalSales.toString(),
      icon: TrendingUp,
      description: `${stats.salesThisWeek} cette semaine`,
      gradient: "bg-gradient-primary"
    },
    {
      title: "Commission totale",
      value: `${stats.totalCommission.toFixed(2)} €`,
      icon: Euro,
      description: `Moy. ${stats.avgCommissionPerSale.toFixed(2)} € / vente`,
      gradient: "bg-gradient-success"
    },
    {
      title: "Employés actifs",
      value: stats.employeeCount.toString(),
      icon: Users,
      description: `Top vendeur: ${stats.topEmployee}`,
      gradient: "bg-purple"
    },
    {
      title: "Objectifs",
      value: "En cours",
      icon: Target,
      description: "Suivi des performances",
      gradient: "bg-orange"
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="metric-card">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">
                      {stat.title}
                    </p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {stat.description}
                    </p>
                  </div>
                  <div className={`p-3 rounded-full ${stat.gradient}`}>
                    <Icon className="h-6 w-6 text-white" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Recent Sales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-primary" />
            Ventes récentes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <PieChart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune vente enregistrée</p>
              <p className="text-sm text-muted-foreground">
                Commencez par ajouter votre première vente
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sales.slice(0, 5).map((sale) => (
                <div 
                  key={sale.id} 
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div>
                    <p className="font-medium">{sale.client_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sale.employee_name} • {sale.reservation_number}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-success">
                      {sale.commission_amount.toFixed(2)} €
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};