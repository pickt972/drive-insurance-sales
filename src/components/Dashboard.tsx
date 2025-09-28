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
    const totalInsurances = userSales.reduce((sum, sale) => sum + sale.insuranceTypes.length, 0);
    return {
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      sales: userSales.length,
      commission: userCommission,
      totalInsurances
    };
  });

  const employeeStats = sellerStats.sort((a, b) => b.commission - a.commission);

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
              🏆 Podium des Champions
            </CardTitle>
          </CardHeader>
          <CardContent>
            {employeeStats.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Trophy className="h-16 w-16 mx-auto mb-4 opacity-30" />
                <p>Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="relative">
                {/* Podium avec animation */}
                <div className="flex items-end justify-center gap-4 mb-8 h-48">
                  {/* 2ème place */}
                  {employeeStats[1] && (
                    <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
                      <div className="bg-gradient-to-t from-gray-400 to-gray-300 rounded-t-lg p-4 h-24 w-20 flex flex-col items-center justify-end shadow-lg transform hover:scale-105 transition-all duration-300">
                        <div className="text-white font-bold text-lg">2</div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-semibold text-sm">{employeeStats[1].name}</div>
                        <div className="text-xs text-muted-foreground">{employeeStats[1].totalInsurances} assurances</div>
                        <div className="text-xs font-medium text-success">{formatCurrency(employeeStats[1].commission)}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 1ère place */}
                  {employeeStats[0] && (
                    <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.1s' }}>
                      <div className="bg-gradient-to-t from-yellow-500 to-yellow-300 rounded-t-lg p-4 h-32 w-24 flex flex-col items-center justify-end shadow-xl transform hover:scale-105 transition-all duration-300 relative">
                        <div className="absolute -top-2 text-2xl">👑</div>
                        <div className="text-white font-bold text-xl">1</div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-bold text-base text-primary">{employeeStats[0].name}</div>
                        <div className="text-sm text-muted-foreground">{employeeStats[0].totalInsurances} assurances</div>
                        <div className="text-sm font-bold text-success">{formatCurrency(employeeStats[0].commission)}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 3ème place */}
                  {employeeStats[2] && (
                    <div className="flex flex-col items-center animate-fade-in-up" style={{ animationDelay: '0.3s' }}>
                      <div className="bg-gradient-to-t from-orange-600 to-orange-400 rounded-t-lg p-4 h-16 w-18 flex flex-col items-center justify-end shadow-lg transform hover:scale-105 transition-all duration-300">
                        <div className="text-white font-bold">3</div>
                      </div>
                      <div className="mt-2 text-center">
                        <div className="font-semibold text-sm">{employeeStats[2].name}</div>
                        <div className="text-xs text-muted-foreground">{employeeStats[2].totalInsurances} assurances</div>
                        <div className="text-xs font-medium text-success">{formatCurrency(employeeStats[2].commission)}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Autres employés */}
                {employeeStats.length > 3 && (
                  <div className="space-y-2">
                    <h4 className="font-medium text-center text-muted-foreground mb-3">Autres participants</h4>
                    {employeeStats.slice(3).map((employee, index) => (
                      <div key={employee.username} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors duration-200">
                        <div className="flex items-center gap-3">
                          <div className="w-6 h-6 rounded-full bg-muted-foreground/20 flex items-center justify-center text-xs font-medium">
                            {index + 4}
                          </div>
                          <div>
                            <div className="font-medium text-sm">{employee.name}</div>
                            <div className="text-xs text-muted-foreground">{employee.totalInsurances} assurances</div>
                          </div>
                        </div>
                        <div className="text-sm font-medium text-success">{formatCurrency(employee.commission)}</div>
                      </div>
                    ))}
                  </div>
                )}
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