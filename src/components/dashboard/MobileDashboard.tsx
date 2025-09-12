import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Trophy, Calendar, Shield } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { DashboardStats } from "@/types/database";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface MobileDashboardProps {
  stats: DashboardStats;
}

export const MobileDashboard = ({ stats }: MobileDashboardProps) => {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

  // Préparer les données pour le camembert des assurances
  const insuranceData = stats.recentSales.reduce((acc, sale) => {
    const insuranceName = sale.insurance_name || 'Autre';
    acc[insuranceName] = (acc[insuranceName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const pieData = Object.entries(insuranceData).map(([name, value]) => ({
    name,
    value,
  }));

  const COLORS = ['hsl(214, 84%, 56%)', 'hsl(142, 71%, 45%)', 'hsl(38, 92%, 50%)', 'hsl(335, 78%, 42%)', 'hsl(280, 87%, 47%)'];

  return (
    <div className="space-y-4 animate-fadeInUp">
      {/* Statistiques principales */}
      <div className="grid grid-cols-2 gap-3">
        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-primary-light rounded-lg flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-primary" />
              </div>
              <span className="text-xs text-muted-foreground">Total</span>
            </div>
            <div className="text-lg font-bold text-primary">
              {formatCurrency(stats.totalCommission)}
            </div>
            <div className="text-xs text-muted-foreground">
              {stats.totalSales} vente{stats.totalSales > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>

        <Card className="metric-card">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-success-light rounded-lg flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-success" />
              </div>
              <span className="text-xs text-muted-foreground">7 jours</span>
            </div>
            <div className="text-lg font-bold text-success">
              {stats.salesThisWeek}
            </div>
            <div className="text-xs text-muted-foreground">
              vente{stats.salesThisWeek > 1 ? 's' : ''}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Classement des vendeurs */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Trophy className="h-5 w-5 text-primary" />
            Top Vendeurs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.topSellers.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              Aucune vente enregistrée
            </p>
          ) : (
            stats.topSellers.slice(0, 3).map((seller, index) => (
              <div
                key={seller.employee_name}
                className="flex items-center justify-between p-3 rounded-lg bg-accent/50"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${
                    index === 0 
                      ? 'bg-gradient-primary text-white' 
                      : index === 1 
                      ? 'bg-muted text-foreground' 
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-medium text-sm">{seller.employee_name}</div>
                    <div className="text-xs text-muted-foreground">
                      {seller.sales_count} vente{seller.sales_count > 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
                <Badge variant={index === 0 ? "default" : "secondary"} className="font-medium">
                  {formatCurrency(seller.total_commission)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Répartition par assurance */}
      {pieData.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg">
              <Shield className="h-5 w-5 text-primary" />
              Répartition par Assurance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={60}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Ventes récentes */}
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" />
            Ventes Récentes
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {stats.recentSales.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">
              Aucune vente récente
            </p>
          ) : (
            stats.recentSales.slice(0, 5).map((sale) => (
              <div
                key={sale.id}
                className="flex items-center justify-between p-3 rounded-lg border bg-card/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-sm truncate">{sale.client_name}</div>
                  <div className="text-xs text-muted-foreground">
                    {sale.insurance_name} • {sale.employee_name}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {new Date(sale.created_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>
                <Badge variant="outline" className="font-medium">
                  {formatCurrency(sale.commission_amount)}
                </Badge>
              </div>
            ))
          )}
        </CardContent>
      </Card>
    </div>
  );
};