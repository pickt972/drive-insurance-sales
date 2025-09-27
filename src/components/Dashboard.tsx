import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Trophy } from "lucide-react";
import { DashboardStats } from "@/types";

interface DashboardProps {
  stats: DashboardStats;
}

export const Dashboard = ({ stats }: DashboardProps) => {
  const formatCurrency = (amount: number) => `${amount.toFixed(2)} €`;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Ventes</p>
                <p className="text-2xl font-bold">{stats.totalSales}</p>
              </div>
              <TrendingUp className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Commission Totale</p>
                <p className="text-2xl font-bold">{formatCurrency(stats.totalCommission)}</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes 7 jours</p>
                <p className="text-2xl font-bold">{stats.salesThisWeek}</p>
              </div>
              <Users className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Top Vendeur</p>
                <p className="text-lg font-bold">{stats.topSellers[0]?.name || 'Aucun'}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Sellers */}
      <Card>
        <CardHeader>
          <CardTitle>Classement des Vendeurs</CardTitle>
        </CardHeader>
        <CardContent>
          {stats.topSellers.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Aucune vente enregistrée</p>
          ) : (
            <div className="space-y-4">
              {stats.topSellers.map((seller, index) => (
                <div key={seller.name} className="flex items-center justify-between p-4 rounded-lg bg-accent/50">
                  <div className="flex items-center gap-4">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-primary text-white' : 'bg-muted'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <div className="font-semibold">{seller.name}</div>
                      <div className="text-sm text-muted-foreground">{seller.sales} ventes</div>
                    </div>
                  </div>
                  <div className="font-bold text-success">{formatCurrency(seller.commission)}</div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};