import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Trophy, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Dashboard = () => {
  const { sales, users, insuranceTypes, objectives } = useAuth();

  // Calculer les statistiques
  const totalSales = sales.length;
  const totalCommission = sales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
  
  // Ventes de la semaine dernière
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const salesThisWeek = sales.filter(sale => new Date(sale.createdAt) >= oneWeekAgo).length;

  // Statistiques par vendeur
  const sellerStats = users.filter(u => u.role === 'employee').map(user => {
    const userSales = sales.filter(sale => sale.employeeName === user.username);
    const userCommission = userSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    return {
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      sales: userSales.length,
      commission: userCommission
    };
  }).sort((a, b) => b.commission - a.commission);

  // Top des assurances
  const insuranceCount: Record<string, number> = {};
  sales.forEach(sale => {
    sale.insuranceTypes.forEach(insurance => {
      insuranceCount[insurance] = (insuranceCount[insurance] || 0) + 1;
    });
  });
  
  const topInsurances = Object.entries(insuranceCount)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

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
                <p className="text-2xl font-bold">{totalSales}</p>
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
                <p className="text-2xl font-bold">{formatCurrency(totalCommission)}</p>
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
                <p className="text-2xl font-bold">{salesThisWeek}</p>
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
                <p className="text-lg font-bold">{sellerStats[0]?.name || 'Aucun'}</p>
              </div>
              <Trophy className="h-8 w-8 text-primary" />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Sellers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-primary" />
              Classement des Vendeurs
            </CardTitle>
          </CardHeader>
          <CardContent>
            {sellerStats.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-4">
                {sellerStats.map((seller, index) => {
                  const objective = objectives.find(obj => obj.employeeName === seller.username);
                  let progressPercentage = 0;
                  
                  if (objective) {
                    const objectiveSales = sales.filter(sale => 
                      sale.employeeName === seller.username &&
                      new Date(sale.createdAt) >= new Date(objective.startDate) &&
                      new Date(sale.createdAt) <= new Date(objective.endDate)
                    );
                    const achievedAmount = objectiveSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
                    progressPercentage = Math.min((achievedAmount / objective.targetAmount) * 100, 100);
                  }
                  
                  return (
                    <div key={seller.username} className="p-4 rounded-lg bg-accent/50">
                      <div className="flex items-center justify-between mb-2">
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
                      
                      {objective && (
                        <div className="mt-2">
                          <div className="flex justify-between text-xs text-muted-foreground mb-1">
                            <span>Objectif: {formatCurrency(objective.targetAmount)}</span>
                            <span>{progressPercentage.toFixed(0)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progressPercentage >= 100 ? 'bg-green-500' :
                                progressPercentage >= 75 ? 'bg-yellow-500' :
                                progressPercentage >= 50 ? 'bg-orange-500' : 'bg-red-500'
                              }`}
                              style={{ width: `${Math.min(progressPercentage, 100)}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Assurances les plus vendues */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Car className="h-5 w-5 text-primary" />
              Assurances les Plus Vendues
            </CardTitle>
          </CardHeader>
          <CardContent>
            {topInsurances.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">Aucune vente enregistrée</p>
            ) : (
              <div className="space-y-4">
                {topInsurances.map((insurance, index) => {
                  const insuranceType = insuranceTypes.find(ins => ins.name === insurance.name);
                  return (
                    <div key={insurance.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                          index === 0 ? 'bg-primary text-white' : 'bg-muted-foreground text-white'
                        }`}>
                          {index + 1}
                        </div>
                        <div>
                          <div className="font-medium">{insurance.name}</div>
                          <div className="text-sm text-muted-foreground">
                            {insuranceType ? `${formatCurrency(insuranceType.commission)} par vente` : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-bold text-primary">{insurance.count}</div>
                        <div className="text-xs text-muted-foreground">ventes</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};