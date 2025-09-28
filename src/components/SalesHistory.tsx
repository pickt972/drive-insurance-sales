import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, User, FileText, TrendingUp, Euro, Target, Phone, Mail } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export const SalesHistory = () => {
  const { isAdmin, sales, users, objectives, deleteSale } = useAuth();


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleDelete = async (saleId: string) => {
    if (window.confirm('Êtes-vous sûr de vouloir supprimer cette vente ?')) {
      await deleteSale(saleId);
    }
  };

  // Calculer les statistiques
  const totalSales = sales.length;
  const totalCommission = sales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const salesThisMonth = sales.filter(sale => new Date(sale.createdAt) >= monthStart);
  
  // Statistiques par employé
  const employeeStats = users.filter(u => u.role === 'employee').map(user => {
    const userSales = sales.filter(sale => sale.employeeName === user.username);
    const userCommission = userSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    const userObjective = objectives.find(obj => obj.employeeName === user.username);
    
    let progressPercentage = 0;
    if (userObjective) {
      const objectiveSales = sales.filter(sale => 
        sale.employeeName === user.username &&
        new Date(sale.createdAt) >= new Date(userObjective.startDate) &&
        new Date(sale.createdAt) <= new Date(userObjective.endDate)
      );
      const achievedAmount = objectiveSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
      progressPercentage = Math.min((achievedAmount / userObjective.targetAmount) * 100, 100);
    }
    
    return {
      ...user,
      salesCount: userSales.length,
      totalCommission: userCommission,
      objective: userObjective,
      progressPercentage
    };
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 100) return 'bg-green-500';
    if (progress >= 75) return 'bg-yellow-500';
    if (progress >= 50) return 'bg-orange-500';
    return 'bg-red-500';
  };

  return (
    <div className="space-y-6">
      {/* Statistiques globales */}
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
                <p className="text-sm text-muted-foreground">CA Total</p>
                <p className="text-2xl font-bold">{totalCommission.toFixed(2)} €</p>
              </div>
              <Euro className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Ventes ce mois</p>
                <p className="text-2xl font-bold">{salesThisMonth.length}</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">CA Mensuel</p>
                <p className="text-2xl font-bold">
                  {salesThisMonth.reduce((sum, sale) => sum + sale.commissionAmount, 0).toFixed(2)} €
                </p>
              </div>
              <Target className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance par employé avec jauges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            Performance par Employé
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {employeeStats.map((employee) => (
              <div key={employee.username} className="p-4 border rounded-lg">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <div className="font-medium">{employee.firstName} {employee.lastName}</div>
                    <div className="text-sm text-muted-foreground">
                      {employee.salesCount} ventes • {employee.totalCommission.toFixed(2)} € de commission
                    </div>
                  </div>
                  {employee.objective && (
                    <div className="text-right">
                      <div className="text-sm font-medium">
                        {employee.progressPercentage.toFixed(0)}% de l'objectif
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Objectif: {employee.objective.targetAmount.toFixed(2)} €
                      </div>
                    </div>
                  )}
                </div>
                
                {employee.objective && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(employee.progressPercentage)}`}
                      style={{ width: `${Math.min(employee.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Historique détaillé */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-primary" />
            Historique Détaillé des Ventes ({sales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sales.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucune vente enregistrée</p>
            </div>
          ) : (
            <div className="space-y-4">
              {sales.map((sale) => (
                <div key={sale.id} className="p-4 border rounded-lg hover:bg-muted/50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium">{sale.clientName}</h3>
                        <Badge variant="outline">{sale.reservationNumber}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-muted-foreground mb-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            {users.find(u => u.username === sale.employeeName)?.firstName} {users.find(u => u.username === sale.employeeName)?.lastName}
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {formatDate(sale.createdAt)}
                          </div>
                        </div>
                        <div className="space-y-1">
                          {sale.clientEmail && (
                            <div className="flex items-center gap-1">
                              <Mail className="h-3 w-3" />
                              {sale.clientEmail}
                            </div>
                          )}
                          {sale.clientPhone && (
                            <div className="flex items-center gap-1">
                              <Phone className="h-3 w-3" />
                              {sale.clientPhone}
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex flex-wrap gap-1">
                          {sale.insuranceTypes.map((insurance) => (
                            <Badge key={insurance} variant="secondary" className="text-xs">
                              {insurance}
                            </Badge>
                          ))}
                        </div>
                        <div className="font-medium text-success text-lg">
                          {sale.commissionAmount.toFixed(2)} €
                        </div>
                      </div>
                      
                      {sale.notes && (
                        <div className="mt-2 text-sm text-muted-foreground italic">
                          "{sale.notes}"
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(sale.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
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