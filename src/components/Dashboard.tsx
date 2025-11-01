import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Users, DollarSign, Trophy, Car, Target, Calendar } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const Dashboard = () => {
  const { sales, users, insuranceTypes, objectives, profile, isAdmin } = useAuth();

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

  // Calculer la progression des objectifs pour chaque employé
  const getEmployeeObjectiveProgress = (username: string) => {
    const employeeObjectives = objectives.filter(obj => obj.employeeName === username);
    if (employeeObjectives.length === 0) return null;

    // Prendre l'objectif le plus récent
    const currentObjective = employeeObjectives.sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )[0];

    const employeeSales = sales.filter(sale => {
      const saleDate = new Date(sale.createdAt);
      const startDate = new Date(currentObjective.startDate);
      const endDate = new Date(currentObjective.endDate);
      
      return sale.employeeName === username && 
             saleDate >= startDate && 
             saleDate <= endDate;
    });

    const achievedAmount = employeeSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    const achievedSales = employeeSales.length;
    
    let progress = 0;
    let progressText = '';
    
    if (currentObjective.objectiveType === 'amount') {
      progress = Math.min((achievedAmount / currentObjective.targetAmount) * 100, 100);
      progressText = `${achievedAmount.toFixed(0)}€ / ${currentObjective.targetAmount.toFixed(0)}€`;
    } else {
      progress = Math.min((achievedSales / currentObjective.targetSalesCount) * 100, 100);
      progressText = `${achievedSales} / ${currentObjective.targetSalesCount} ventes`;
    }

    return {
      progress,
      progressText,
      objective: currentObjective,
      achievedAmount,
      achievedSales
    };
  };

  // Fonction pour obtenir la couleur de progression
  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'from-green-500 to-green-600';
    if (progress >= 75) return 'from-blue-500 to-blue-600';
    if (progress >= 50) return 'from-yellow-500 to-yellow-600';
    return 'from-red-500 to-red-600';
  };

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
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6 w-full overflow-x-hidden">
        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.1s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper p-1.5 lg:p-3">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-3xl font-bold text-primary">{totalSales}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Total Ventes</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-primary to-primary-variant rounded-full animate-gentle-pulse" style={{ width: '75%' }}></div>
          </div>
        </div>

        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.2s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper p-1.5 lg:p-3">
              <DollarSign className="h-6 w-6 text-success" />
            </div>
            <div className="text-right">
              <p className="text-lg lg:text-3xl font-bold text-success">{formatCurrency(totalCommission)}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Commission Totale</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-success to-success-variant rounded-full animate-gentle-pulse" style={{ width: '85%' }}></div>
          </div>
        </div>

        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper p-1.5 lg:p-3">
              <Users className="h-6 w-6 text-info" />
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-3xl font-bold text-info">
                {totalSales > 0 ? formatCurrency(totalCommission / totalSales) : '0.00 €'}
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">Commission Moyenne</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-info to-purple rounded-full animate-gentle-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>

        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper p-1.5 lg:p-3">
              <Calendar className="h-6 w-6 text-warning" />
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-3xl font-bold text-warning">{salesThisWeek}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Ventes 7j</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-warning to-orange rounded-full animate-gentle-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
      </div>

      {/* Podium - affichage pour tous */}
      {employeeStats.length > 0 && (
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 lg:gap-8 w-full overflow-x-hidden">
        {/* Section Mes Objectifs (pour les employés) */}
        {!isAdmin && (
          <div className="xl:col-span-2 modern-card animate-smooth-scale-in" style={{ animationDelay: '0.4s' }}>
            <div className="p-4 lg:p-8">
              <div className="flex items-center gap-3 mb-6 lg:mb-8">
                <div className="icon-wrapper">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-lg lg:text-2xl font-bold gradient-text">🎯 Mes Objectifs</h2>
              </div>
              
              {(() => {
                const myObjectives = objectives.filter(obj => obj.employeeName === profile?.username);
                
                if (myObjectives.length === 0) {
                  return (
                    <div className="text-center text-muted-foreground py-8 lg:py-12">
                      <div className="icon-wrapper mx-auto mb-4 opacity-50">
                        <Target className="h-12 lg:h-16 w-12 lg:w-16" />
                      </div>
                      <p className="text-base lg:text-lg">Aucun objectif défini</p>
                      <p className="text-sm text-muted-foreground mt-2">Contactez votre administrateur pour définir vos objectifs</p>
                    </div>
                  );
                }
                
                return (
                  <div className="space-y-4 lg:space-y-6">
                    {myObjectives.map((objective, index) => {
                      const progressData = getEmployeeObjectiveProgress(profile?.username || '');
                      if (!progressData) return null;
                      
                      return (
                        <div key={objective.id} className="modern-card p-4 lg:p-6 animate-elegant-slide" style={{ animationDelay: `${0.6 + index * 0.1}s` }}>
                          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-6 mb-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                <span className="font-bold text-base lg:text-lg">
                                  Objectif {objective.period === 'monthly' ? 'Mensuel' : objective.period === 'quarterly' ? 'Trimestriel' : 'Annuel'}
                                </span>
                              </div>
                              <p className="text-sm text-muted-foreground">{objective.description}</p>
                            </div>
                            <div className={`px-4 py-2 rounded-2xl text-sm font-bold ${
                              progressData.progress >= 100 ? 'bg-green-100 text-green-700' :
                              progressData.progress >= 75 ? 'bg-blue-100 text-blue-700' :
                              progressData.progress >= 50 ? 'bg-yellow-100 text-yellow-700' : 'bg-red-100 text-red-700'
                            }`}>
                              {progressData.progress.toFixed(0)}% atteint
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
                            {/* Progression CA */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">💰 Chiffre d'affaires</span>
                                <span className="font-bold">{progressData.achievedAmount.toFixed(0)}€ / {objective.targetAmount.toFixed(0)}€</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor((progressData.achievedAmount / objective.targetAmount) * 100)} transition-all duration-500`}
                                  style={{ width: `${Math.min((progressData.achievedAmount / objective.targetAmount) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                            
                            {/* Progression Ventes */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span className="font-medium">📊 Nombre de ventes</span>
                                <span className="font-bold">{progressData.achievedSales} / {objective.targetSalesCount}</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-3">
                                <div 
                                  className={`h-3 rounded-full bg-gradient-to-r ${getProgressColor((progressData.achievedSales / objective.targetSalesCount) * 100)} transition-all duration-500`}
                                  style={{ width: `${Math.min((progressData.achievedSales / objective.targetSalesCount) * 100, 100)}%` }}
                                ></div>
                              </div>
                            </div>
                          </div>
                          
                          {/* Période de l'objectif */}
                          <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground text-center">
                            📅 Période: {new Date(objective.startDate).toLocaleDateString('fr-FR')} → {new Date(objective.endDate).toLocaleDateString('fr-FR')}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          </div>
        )}

        {/* Podium des Champions */}
        <div className={`modern-card animate-smooth-scale-in ${!isAdmin ? 'xl:col-span-1' : ''}`} style={{ animationDelay: '0.5s' }}>
          <div className="p-4 lg:p-8">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="icon-wrapper">
                <Trophy className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg lg:text-2xl font-bold gradient-text">🏆 Podium des Champions</h2>
            </div>
            
            {activeEmployees.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 lg:py-16">
                <div className="icon-wrapper mx-auto mb-4 opacity-50">
                  <Trophy className="h-12 lg:h-16 w-12 lg:w-16" />
                </div>
                <p className="text-base lg:text-lg">Aucun employé actif</p>
              </div>
            ) : employeeStats.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 lg:py-16">
                <div className="icon-wrapper mx-auto mb-4 opacity-50">
                  <Trophy className="h-12 lg:h-16 w-12 lg:w-16" />
                </div>
                <p className="text-base lg:text-lg">Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="relative">
                {/* Podium avec design ultra-moderne - ordre classique */}
                <div className="flex items-end justify-center gap-4 lg:gap-8 mb-8 lg:mb-12 min-h-[300px] lg:min-h-[400px]">
                  {/* 2ème place - À GAUCHE */}
                  {employeeStats[1] && (
                    <div className="flex flex-col items-center flex-1 max-w-[140px] lg:max-w-[180px] animate-elegant-slide" style={{ animationDelay: '0.8s' }}>
                      <div className="w-full space-y-3 mb-3">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🥈</div>
                          <div className="font-bold text-sm lg:text-lg">{employeeStats[1].name}</div>
                          <div className="text-xs lg:text-sm text-muted-foreground mt-1">{employeeStats[1].sales} ventes</div>
                          <div className="text-sm lg:text-base font-bold text-success mt-1">{formatCurrency(employeeStats[1].commission)}</div>
                        </div>
                        
                        {/* Barre de progression pour le 2ème */}
                        {(() => {
                          const progressData = getEmployeeObjectiveProgress(employeeStats[1].username);
                          if (!progressData) return null;
                          
                          return (
                            <div className="w-full px-2">
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(progressData.progress)} transition-all duration-500`}
                                  style={{ width: `${Math.min(progressData.progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-center mt-1 font-bold">
                                {progressData.progress.toFixed(0)}% objectif
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div 
                        className="w-full podium-base flex flex-col items-center justify-center relative group bg-gradient-to-b from-slate-300 via-slate-400 to-slate-500 shadow-lg"
                        style={{ 
                          height: `${calculatePodiumHeight(employeeStats[1].sales, maxSales, 100)}px`
                        }}
                      >
                        <div className="text-white font-bold text-3xl lg:text-5xl drop-shadow-lg">2</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-white/10 to-transparent rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 1ère place - AU CENTRE */}
                  {employeeStats[0] && (
                    <div className="flex flex-col items-center flex-1 max-w-[160px] lg:max-w-[200px] animate-elegant-slide -mt-8" style={{ animationDelay: '0.7s' }}>
                      <div className="w-full space-y-3 mb-3">
                        <div className="text-center">
                          <div className="text-4xl mb-2 animate-bounce">👑</div>
                          <div className="font-bold text-base lg:text-xl gradient-text">{employeeStats[0].name}</div>
                          <div className="text-xs lg:text-sm text-muted-foreground mt-1">{employeeStats[0].sales} ventes</div>
                          <div className="text-base lg:text-lg font-bold text-success mt-1">{formatCurrency(employeeStats[0].commission)}</div>
                        </div>
                        
                        {/* Barre de progression pour le 1er */}
                        {(() => {
                          const progressData = getEmployeeObjectiveProgress(employeeStats[0].username);
                          if (!progressData) return null;
                          
                          return (
                            <div className="w-full px-2">
                              <div className="w-full bg-muted rounded-full h-2.5">
                                <div 
                                  className={`h-2.5 rounded-full bg-gradient-to-r ${getProgressColor(progressData.progress)} transition-all duration-500 shadow-md`}
                                  style={{ width: `${Math.min(progressData.progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-center mt-1 font-bold text-primary">
                                {progressData.progress.toFixed(0)}% objectif
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div 
                        className="w-full podium-base flex flex-col items-center justify-center relative group bg-gradient-to-b from-yellow-300 via-yellow-400 to-yellow-600 shadow-xl"
                        style={{ 
                          height: `${calculatePodiumHeight(employeeStats[0].sales, maxSales, 140)}px`
                        }}
                      >
                        <div className="text-white font-bold text-4xl lg:text-6xl drop-shadow-2xl">1</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-yellow-500/30 to-transparent rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-yellow-200 to-transparent"></div>
                        <div className="absolute top-0 left-0 right-0 h-full bg-[radial-gradient(circle_at_50%_120%,rgba(255,215,0,0.3),transparent)] rounded-t-3xl"></div>
                      </div>
                    </div>
                  )}
                  
                  {/* 3ème place - À DROITE */}
                  {employeeStats[2] && (
                    <div className="flex flex-col items-center flex-1 max-w-[130px] lg:max-w-[160px] animate-elegant-slide" style={{ animationDelay: '0.9s' }}>
                      <div className="w-full space-y-3 mb-3">
                        <div className="text-center">
                          <div className="text-2xl mb-2">🥉</div>
                          <div className="font-bold text-sm lg:text-base">{employeeStats[2].name}</div>
                          <div className="text-xs text-muted-foreground mt-1">{employeeStats[2].sales} ventes</div>
                          <div className="text-xs lg:text-sm font-bold text-success mt-1">{formatCurrency(employeeStats[2].commission)}</div>
                        </div>
                        
                        {/* Barre de progression pour le 3ème */}
                        {(() => {
                          const progressData = getEmployeeObjectiveProgress(employeeStats[2].username);
                          if (!progressData) return null;
                          
                          return (
                            <div className="w-full px-2">
                              <div className="w-full bg-muted rounded-full h-1.5">
                                <div 
                                  className={`h-1.5 rounded-full bg-gradient-to-r ${getProgressColor(progressData.progress)} transition-all duration-500`}
                                  style={{ width: `${Math.min(progressData.progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-center mt-1 font-bold">
                                {progressData.progress.toFixed(0)}% objectif
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                      
                      <div 
                        className="w-full podium-base flex flex-col items-center justify-center relative group bg-gradient-to-b from-orange-300 via-orange-400 to-orange-600 shadow-lg"
                        style={{ 
                          height: `${calculatePodiumHeight(employeeStats[2].sales, maxSales, 70)}px`
                        }}
                      >
                        <div className="text-white font-bold text-2xl lg:text-4xl drop-shadow-lg">3</div>
                        <div className="absolute inset-0 bg-gradient-to-t from-orange-500/20 to-transparent rounded-t-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        <div className="absolute -top-1 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-orange-200 to-transparent"></div>
                      </div>
                    </div>
                  )}
                </div>
                
                {/* Autres employés avec design moderne */}
                {employeeStats.length > 3 && (
                  <div className="space-y-3">
                    <h4 className="font-semibold text-center text-muted-foreground mb-4 lg:mb-6 text-base lg:text-lg">Autres participants</h4>
                    {employeeStats.slice(3).map((employee, index) => (
                      <div key={employee.username} className="modern-card p-3 lg:p-4 animate-elegant-slide space-y-3" style={{ animationDelay: `${1 + index * 0.1}s` }}>
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 lg:gap-4">
                            <div className="w-8 lg:w-10 h-8 lg:h-10 rounded-2xl bg-gradient-to-br from-muted to-muted-foreground/20 flex items-center justify-center text-xs lg:text-sm font-bold text-muted-foreground">
                              {index + 4}
                            </div>
                            <div>
                              <div className="font-semibold text-sm lg:text-base">{employee.name}</div>
                              <div className="text-xs lg:text-sm text-muted-foreground">{employee.sales} ventes</div>
                            </div>
                          </div>
                          <div className="text-sm lg:text-lg font-bold text-success">{formatCurrency(employee.commission)}</div>
                        </div>
                        
                        {/* Barre de progression de l'objectif */}
                        {(() => {
                          const progressData = getEmployeeObjectiveProgress(employee.username);
                          if (!progressData) return null;
                          
                          return (
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-xs">
                                <div className="flex items-center gap-1">
                                  <Target className="h-3 w-3 text-primary" />
                                  <span className="font-medium">Objectif {progressData.objective.period === 'monthly' ? 'mensuel' : progressData.objective.period === 'quarterly' ? 'trimestriel' : 'annuel'}</span>
                                </div>
                                <span className="font-bold text-primary">{progressData.progress.toFixed(0)}%</span>
                              </div>
                              <div className="w-full bg-muted rounded-full h-2">
                                <div 
                                  className={`h-2 rounded-full bg-gradient-to-r ${getProgressColor(progressData.progress)} transition-all duration-500`}
                                  style={{ width: `${Math.min(progressData.progress, 100)}%` }}
                                ></div>
                              </div>
                              <div className="text-xs text-muted-foreground text-center">
                                {progressData.progressText}
                              </div>
                            </div>
                          );
                        })()}
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
          <div className="p-4 lg:p-8">
            <div className="flex items-center gap-3 mb-6 lg:mb-8">
              <div className="icon-wrapper">
                <Car className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg lg:text-2xl font-bold gradient-text">
                {isAdmin ? '🚗 Assurances les Plus Vendues' : '🚗 Mes Assurances Vendues'}
              </h2>
            </div>
            
            {topInsurances.length === 0 ? (
              <div className="text-center text-muted-foreground py-8 lg:py-12">
                <div className="icon-wrapper mx-auto mb-4 opacity-50">
                  <Car className="h-12 lg:h-16 w-12 lg:w-16" />
                </div>
                <p className="text-base lg:text-lg">Aucune vente enregistrée</p>
              </div>
            ) : (
              <div className="space-y-3 lg:space-y-4">
                {topInsurances.map((insurance, index) => {
                  const insuranceType = insuranceTypes.find(ins => ins.name === insurance.name);
                  return (
                    <div key={insurance.name} className="modern-card p-3 lg:p-4 animate-elegant-slide" style={{ animationDelay: `${0.8 + index * 0.1}s` }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 lg:gap-4">
                          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center text-sm font-bold text-white ${
                            index === 0 ? 'bg-gradient-to-br from-primary to-primary-variant animate-soft-glow' : 
                            index === 1 ? 'bg-gradient-to-br from-success to-success-variant' :
                            'bg-gradient-to-br from-warning to-orange'
                          }`}>
                            {index + 1}
                          </div>
                          <div>
                            <div className="font-semibold text-sm lg:text-base">{insurance.name}</div>
                            <div className="text-xs lg:text-sm text-muted-foreground">
                              {insuranceType ? `${formatCurrency(insuranceType.commission)} par vente` : ''}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-bold text-lg lg:text-2xl text-primary">{insurance.count}</div>
                          <div className="text-xs lg:text-sm text-muted-foreground">ventes</div>
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
      )}
    </div>
  );
};