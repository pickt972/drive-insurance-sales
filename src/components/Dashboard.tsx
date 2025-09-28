import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Trophy, Car } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Dashboard = () => {
  const { sales, users, insuranceTypes, objectives } = useAuth();
  const { profile, isAdmin } = useAuth();

  // Filtrer les ventes selon le rôle
  const userSales = isAdmin ? sales : sales.filter(sale => sale.employeeName === profile?.username);
  
  // Calculer les statistiques (filtrées pour les employés)
  const totalSales = userSales.length;
  const totalCommission = userSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
  
  // Ventes de la semaine dernière
  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const salesThisWeek = userSales.filter(sale => new Date(sale.createdAt) >= oneWeekAgo).length;

  // Statistiques par vendeur (toujours toutes les ventes pour le podium)
  const activeEmployees = users.filter(u => u.role === 'employee' && u.isActive);
  const sellerStats = activeEmployees.map(user => {
    const userSales = sales.filter(sale => sale.employeeName === user.username);
    const userCommission = userSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    return {
      username: user.username,
      name: `${user.firstName} ${user.lastName}`,
      sales: userSales.length,
      commission: userCommission
    };
  }).filter(stat => stat.sales > 0 || activeEmployees.length <= 3); // Afficher même sans ventes si peu d'employés

  const employeeStats = sellerStats.sort((a, b) => b.commission - a.commission);

  // Calculer les hauteurs dynamiques du podium basées sur les ventes
  const calculatePodiumHeight = (salesCount: number, maxSales: number, baseHeight: number) => {
    if (maxSales === 0) return baseHeight;
    const ratio = salesCount / maxSales;
    return Math.max(baseHeight, baseHeight + (ratio * 60)); // 60px de variation max
  };

  const maxSales = Math.max(...employeeStats.map(emp => emp.sales));
  
  // Top des assurances (filtrées pour les employés)
  const insuranceCount: Record<string, number> = {};
  userSales.forEach(sale => {
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
    <div className="space-y-8">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-primary">{totalSales}</p>
              <p className="text-sm text-muted-foreground">Total Ventes</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary-variant rounded-full animate-gentle-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-success">{formatCurrency(totalCommission)}</p>
              <p className="text-sm text-muted-foreground">Commission Totale</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-success to-success-variant rounded-full animate-gentle-pulse" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper">
              <Users className="h-6 w-6 text-warning" />
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold text-warning">{salesThisWeek}</p>
              <p className="text-sm text-muted-foreground">Ventes 7 jours</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-warning to-orange rounded-full animate-gentle-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>

        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper">
              <Trophy className="h-6 w-6 text-primary" />
            </div>
            <div className="text-right">
              <p className="text-2xl font-bold text-primary">
                {isAdmin 
                  ? (sellerStats[0]?.name.split(' ')[0] || 'Aucun')
                  : `${employeeStats.findIndex(emp => emp.username === profile?.username) + 1}${
                      employeeStats.findIndex(emp => emp.username === profile?.username) === 0 ? 'er' : 
                      employeeStats.findIndex(emp => emp.username === profile?.username) === 1 ? 'nd' : 'ème'
                    }`
                }
              </p>
              <p className="text-sm text-muted-foreground">{isAdmin ? 'Top Vendeur' : 'Mon Rang'}</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-purple rounded-full animate-gentle-pulse" style={{ width: '90%' }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
        {/* Podium des Champions */}
        <div className="modern-card animate-smooth-scale-in" style={{ animationDelay: '0.5s' }}>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="icon-wrapper">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold gradient-text">🏆 Podium des Champions</h2>
            </div>
            
            {activeEmployees.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <div className="icon-wrapper mx-auto mb-4 opacity-50">
                  <Trophy className="h-16 w-16" />
                </div>
                <p className="text-lg">Aucun employé actif</p>
              </div>
            ) : employeeStats.length === 0 ? (
              <div className="text-center text-muted-foreground py-16">
                <div className="icon-wrapper mx-auto mb-4 opacity-50">
                  <Trophy className="h-16 w-16" />
                </div>
                <p className="text-lg">Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="relative">
                {/* Podium avec design ultra-moderne */}
                <div className="flex items-end justify-center gap-6 mb-10 h-56 mt-8">
                  {/* 2ème place */}
                  {employeeStats[1] && (
                    <div className="flex flex-col items-center animate-elegant-slide" style={{ animationDelay: '0.8s' }}>
                      <div 
                        className="podium-base p-6 w-24 flex flex-col items-center justify-end relative group"
                        style={{ 
                          height: `${calculatePodiumHeight(employeeStats[1].sales, maxSales, 80)}px`,
                          '--color': '#e5e7eb',
                          '--color-dark': '#d1d5db'
                        }}
                      >
                        <div className="text-white font-bold text-2xl drop-shadow-lg">2</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-gray-400/20 to-transparent rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="font-bold text-base">{employeeStats[1].name}</div>
                        <div className="text-sm text-muted-foreground">{employeeStats[1].sales} ventes</div>
                        <div className="text-sm font-bold text-success">{formatCurrency(employeeStats[1].commission)}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 1ère place */}
                  {employeeStats[0] && (
                    <div className="flex flex-col items-center animate-elegant-slide" style={{ animationDelay: '0.7s' }}>
                      <div 
                        className="podium-base p-6 w-28 flex flex-col items-center justify-end relative group"
                        style={{ 
                          height: `${calculatePodiumHeight(employeeStats[0].sales, maxSales, 120)}px`,
                          '--color': '#fbbf24',
                          '--color-dark': '#f59e0b'
                        }}
                      >
                        <div className="podium-crown">👑</div>
                        <div className="text-white font-bold text-3xl drop-shadow-lg">1</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-400/30 to-transparent rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="font-bold text-lg text-primary">{employeeStats[0].name}</div>
                        <div className="text-sm text-muted-foreground">{employeeStats[0].sales} ventes</div>
                        <div className="text-base font-bold text-success">{formatCurrency(employeeStats[0].commission)}</div>
                      </div>
                    </div>
                  )}
                  
                  {/* 3ème place */}
                  {employeeStats[2] && (
                    <div className="flex flex-col items-center animate-elegant-slide" style={{ animationDelay: '0.9s' }}>
                      <div 
                        className="podium-base p-6 w-20 flex flex-col items-center justify-end relative group"
                        style={{ 
                          height: `${calculatePodiumHeight(employeeStats[2].sales, maxSales, 60)}px`,
                          '--color': '#fb923c',
                          '--color-dark': '#ea580c'
                        }}
                      >
                        <div className="text-white font-bold text-xl drop-shadow-lg">3</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-400/20 to-transparent rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                      </div>
                      <div className="mt-4 text-center">
                        <div className="font-bold text-sm">{employeeStats[2].name}</div>
                        <div className="text-xs text-muted-foreground">{employeeStats[2].sales} ventes</div>
                        <div className="text-sm font-bold text-success">{formatCurrency(employeeStats[2].commission)}</div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Autres employés avec design moderne */}
                {employeeStats.length > 3 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-center text-muted-foreground mb-6 text-lg">Autres participants</h4>
                    {employeeStats.slice(3).map((employee, index) => (
                      <div key={employee.username} className="modern-card p-4 animate-elegant-slide" style={{ animationDelay: `${1 + index * 0.1}s` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center text-sm font-bold text-muted-foreground">
                              {index + 4}
                            </div>
                            <div>
                              <div className="font-semibold text-base">{employee.name}</div>
                              <div className="text-sm text-muted-foreground">{employee.sales} ventes</div>
                            </div>
                          </div>
                          <div className="text-lg font-bold text-success">{formatCurrency(employee.commission)}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Assurances les plus vendues */}
        <div className="modern-card animate-smooth-scale-in" style={{ animationDelay: '0.6s' }}>
          <div className="p-8">
            <div className="flex items-center gap-3 mb-8">
              <div className="icon-wrapper">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-2xl font-bold gradient-text">
                {isAdmin ? '🚗 Assurances les Plus Vendues' : '🚗 Mes Assurances Vendues'}
              </h2>
            </div>
            
            {topInsurances.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <div className="icon-wrapper mx-auto mb-4 opacity-50">
                  <Car className="h-16 w-16" />
                </div>
                <p className="text-lg">Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="space-y-4">
                {topInsurances.map((insurance, index) => {
                  const insuranceType = insuranceTypes.find(ins => ins.name === insurance.name);
                  return (
                    <div key={insurance.name} className="modern-card p-4 animate-elegant-slide" style={{ animationDelay: `${0.8 + index * 0.1}s` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white ${
                            index === 0 ? 'bg-gradient-to-br from-primary to-primary-variant animate-soft-glow' : 
                            index === 1 ? 'bg-gradient-to-br from-success to-success-variant' :
                            'bg-gradient-to-br from-warning to-orange'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-base">{insurance.name}</div>
                            <div className="text-sm text-muted-foreground">
                              {insuranceType ? `${formatCurrency(insuranceType.commission)} par vente` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-2xl text-primary">{insurance.count}</div>
                          <div className="text-sm text-muted-foreground">ventes</div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};