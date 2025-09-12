import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, DollarSign, Trophy, Calendar, TrendingDown, PieChart } from "lucide-react";
import { DashboardStats } from "@/types/database";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { PieChart as RechartsPieChart, Cell, Pie, ResponsiveContainer } from "recharts";

interface DesktopDashboardProps {
  stats: DashboardStats;
  insuranceStats?: { name: string; value: number; color: string }[];
}

export const DesktopDashboard = ({ stats, insuranceStats = [] }: DesktopDashboardProps) => {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

  const COLORS = ['hsl(var(--primary))', 'hsl(var(--success))', 'hsl(var(--warning))', 'hsl(var(--destructive))', 'hsl(var(--accent))', 'hsl(var(--muted))'];

  return (
    <div className="space-y-6 animate-fadeInUp">
      {/* Métriques principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Commissions</p>
                <p className="text-2xl font-bold text-primary">{formatCurrency(stats.totalCommission)}</p>
              </div>
              <div className="w-12 h-12 bg-primary-light rounded-full flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Ventes</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-full flex items-center justify-center">
                <Users className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Ventes 7 jours</p>
                <p className="text-2xl font-bold text-success">{stats.salesThisWeek}</p>
              </div>
              <div className="w-12 h-12 bg-success-light rounded-full flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Commission Moyenne</p>
                <p className="text-2xl font-bold">
                  {stats.totalSales > 0 ? formatCurrency(stats.totalCommission / stats.totalSales) : '0.00 €'}
                </p>
              </div>
              <div className="w-12 h-12 bg-warning-light rounded-full flex items-center justify-center">
                <TrendingDown className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Classement des vendeurs */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Classement des Vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.topSellers.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.topSellers.map((seller, index) => (
                  <div
                    key={seller.employee_name}
                    className="flex items-center justify-between p-4 rounded-lg bg-accent/50"
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                        index === 0 
                          ? 'bg-gradient-primary text-white shadow-primary' 
                          : index === 1 
                          ? 'bg-muted text-foreground' 
                          : 'bg-muted text-muted-foreground'
                      }`}>
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold">{seller.employee_name}</div>
                        <div className="text-sm text-muted-foreground">
                          {seller.sales_count} vente{seller.sales_count > 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>
                    <Badge variant={index === 0 ? "default" : "secondary"} className="text-base px-3 py-1">
                      {formatCurrency(seller.total_commission)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Répartition des assurances */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-primary" />
              Répartition des Assurances
            </CardTitle>
          </CardHeader>
          <CardContent>
            {insuranceStats.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <PieChart className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune donnée disponible</p>
              </div>
            ) : (
              <div className="space-y-4">
                <ChartContainer
                  config={{}}
                  className="h-[180px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={insuranceStats}
                        cx="50%"
                        cy="50%"
                        outerRadius={60}
                        innerRadius={20}
                        fill="#8884d8"
                        dataKey="value"
                        label={false}
                        labelLine={false}
                      >
                        {insuranceStats.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                          />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </ChartContainer>
                
                {/* Légende */}
                <div className="space-y-2">
                  {insuranceStats.map((item, index) => (
                    <div key={item.name} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: COLORS[index % COLORS.length] }}
                        />
                        <span>{item.name}</span>
                      </div>
                      <span className="font-medium">{item.value} vente{item.value > 1 ? 's' : ''}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Ventes récentes */}
        <Card className="shadow-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Ventes Récentes
            </CardTitle>
          </CardHeader>
          <CardContent>
            {stats.recentSales.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Aucune vente récente</p>
              </div>
            ) : (
              <div className="space-y-3">
                {stats.recentSales.slice(0, 6).map((sale) => (
                  <div
                    key={sale.id}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card/50 hover:bg-card transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="font-medium">{sale.client_name}</div>
                      <div className="text-sm text-muted-foreground">
                        {sale.insurance_name} • {sale.employee_name}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {new Date(sale.created_at).toLocaleDateString('fr-FR', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </div>
                    </div>
                    <Badge variant="outline" className="font-medium">
                      {formatCurrency(sale.commission_amount)}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Évolution hebdomadaire */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution des 7 derniers jours
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-7 gap-2">
            {stats.weeklyEvolution.map((day, index) => (
              <div key={day.date} className="text-center p-3 rounded-lg bg-accent/30">
                <div className="text-xs text-muted-foreground mb-1">
                  {new Date(day.date).toLocaleDateString('fr-FR', { weekday: 'short' })}
                </div>
                <div className="text-lg font-bold text-primary">{day.sales}</div>
                <div className="text-xs text-muted-foreground">
                  {formatCurrency(day.commission)}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};