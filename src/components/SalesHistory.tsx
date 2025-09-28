import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, User, FileText, TrendingUp, Euro, Target, Phone, Mail, Filter, Download, Calendar } from "lucide-react";
import { CreditCard as Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

export const SalesHistory = () => {
  const { isAdmin, sales, users, objectives, deleteSale, updateSale, insuranceTypes } = useAuth();
  
  // États pour les filtres
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [filterInsurance, setFilterInsurance] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  // États pour l'édition de vente
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editReservationNumber, setEditReservationNumber] = useState("");
  const [editSelectedInsurances, setEditSelectedInsurances] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Fonction de filtrage
  const getFilteredSales = () => {
    return sales.filter(sale => {
      const matchEmployee = !filterEmployee || sale.employeeName === filterEmployee;
      const matchStartDate = !filterStartDate || new Date(sale.createdAt) >= new Date(filterStartDate);
      const matchEndDate = !filterEndDate || new Date(sale.createdAt) <= new Date(filterEndDate + 'T23:59:59');
      const matchInsurance = !filterInsurance || sale.insuranceTypes.includes(filterInsurance);
      
      return matchEmployee && matchStartDate && matchEndDate && matchInsurance;
    });
  };

  const filteredSales = getFilteredSales();

  // Fonction d'export CSV
  const exportToCSV = () => {
    const headers = [
      'Date',
      'Employé',
      'Client',
      'Email',
      'Téléphone',
      'N° Réservation',
      'Assurances',
      'Commission (€)',
      'Notes'
    ];
    
    const csvData = filteredSales.map(sale => [
      new Date(sale.createdAt).toLocaleDateString('fr-FR'),
      `${users.find(u => u.username === sale.employeeName)?.firstName || ''} ${users.find(u => u.username === sale.employeeName)?.lastName || ''}`,
      sale.clientName,
      sale.clientEmail || '',
      sale.clientPhone || '',
      sale.reservationNumber,
      sale.insuranceTypes.join('; '),
      sale.commissionAmount.toFixed(2),
      sale.notes || ''
    ]);
    
    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `ventes_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Fonction d'export PDF (simulation)
  const exportToPDF = () => {
    const printContent = `
      <html>
        <head>
          <title>Rapport de Ventes - Aloe Location</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; }
            h1 { color: #2563eb; text-align: center; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #f2f2f2; }
            .summary { background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          </style>
        </head>
        <body>
          <h1>Rapport de Ventes - Aloe Location</h1>
          <div class="summary">
            <h3>Résumé</h3>
            <p><strong>Nombre de ventes:</strong> ${filteredSales.length}</p>
            <p><strong>Commission totale:</strong> ${filteredSales.reduce((sum, sale) => sum + sale.commissionAmount, 0).toFixed(2)} €</p>
            <p><strong>Date d'export:</strong> ${new Date().toLocaleDateString('fr-FR')}</p>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Employé</th>
                <th>Client</th>
                <th>N° Réservation</th>
                <th>Assurances</th>
                <th>Commission</th>
              </tr>
            </thead>
            <tbody>
              ${filteredSales.map(sale => `
                <tr>
                  <td>${new Date(sale.createdAt).toLocaleDateString('fr-FR')}</td>
                  <td>${users.find(u => u.username === sale.employeeName)?.firstName || ''} ${users.find(u => u.username === sale.employeeName)?.lastName || ''}</td>
                  <td>${sale.clientName}</td>
                  <td>${sale.reservationNumber}</td>
                  <td>${sale.insuranceTypes.join(', ')}</td>
                  <td>${sale.commissionAmount.toFixed(2)} €</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.print();
    }
  };

  // Réinitialiser les filtres
  const resetFilters = () => {
    setFilterEmployee("");
    setFilterStartDate("");
    setFilterEndDate("");
    setFilterInsurance("");
  };

  // Obtenir toutes les assurances uniques
  const allInsurances = [...new Set(sales.flatMap(sale => sale.insuranceTypes))];

  // Fonction pour sauvegarder les modifications
  const handleSaveEdit = async () => {
    if (!editingSale || !editClientName.trim() || !editReservationNumber.trim() || editSelectedInsurances.length === 0) {
      return;
    }

    setEditLoading(true);
    try {
      // Calculer la commission totale
      const totalCommission = editSelectedInsurances.reduce((sum, insuranceName) => {
        const insurance = insuranceTypes.find(ins => ins.name === insuranceName);
        return sum + (insurance?.commission || 0);
      }, 0);

      // Mettre à jour la vente
      await updateSale(editingSale.id, {
        clientName: editClientName.trim(),
        reservationNumber: editReservationNumber.trim(),
        insuranceTypes: editSelectedInsurances,
        commissionAmount: totalCommission,
        notes: editNotes.trim() || null
      });

      // Réinitialiser l'état d'édition
      setEditingSale(null);
      setEditClientName("");
      setEditReservationNumber("");
      setEditSelectedInsurances([]);
      setEditNotes("");
    } catch (error) {
      console.error('Erreur lors de la modification de la vente:', error);
    } finally {
      setEditLoading(false);
    }
  };

  // Fonction pour ouvrir le dialog d'édition
  const handleEditSale = (sale: any) => {
    setEditingSale(sale);
    setEditClientName(sale.clientName);
    setEditReservationNumber(sale.reservationNumber);
    setEditSelectedInsurances([...sale.insuranceTypes]);
    setEditNotes(sale.notes || "");
  };

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
  const totalSales = filteredSales.length;
  const totalCommission = filteredSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
  const thisMonth = new Date();
  const monthStart = new Date(thisMonth.getFullYear(), thisMonth.getMonth(), 1);
  const salesThisMonth = filteredSales.filter(sale => new Date(sale.createdAt) >= monthStart);
  
  // Statistiques par employé
  const employeeStats = users.filter(u => u.role === 'employee').map(user => {
    const userSales = filteredSales.filter(sale => sale.employeeName === user.username);
    const userCommission = userSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
    const userObjective = objectives.find(obj => obj.employeeName === user.username);
    
    let progressPercentage = 0;
    if (userObjective) {
      const objectiveSales = filteredSales.filter(sale => 
        sale.employeeName === user.username &&
        new Date(sale.createdAt) >= new Date(userObjective.startDate) &&
        new Date(sale.createdAt) <= new Date(userObjective.endDate)
      );
      
      if (userObjective.objectiveType === 'amount') {
        const achievedAmount = objectiveSales.reduce((sum, sale) => sum + sale.commissionAmount, 0);
        progressPercentage = Math.min((achievedAmount / userObjective.targetAmount) * 100, 100);
      } else {
        progressPercentage = Math.min((objectiveSales.length / userObjective.targetSalesCount) * 100, 100);
      }
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
      {/* Filtres et Export */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5 text-primary" />
              Filtres et Export
            </CardTitle>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Masquer' : 'Afficher'} Filtres
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="filterEmployee">Employé</Label>
                <select
                  id="filterEmployee"
                  value={filterEmployee}
                  onChange={(e) => setFilterEmployee(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Tous les employés</option>
                  {users.filter(u => u.role === 'employee').map(user => (
                    <option key={user.username} value={user.username}>
                      {user.firstName} {user.lastName}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label htmlFor="filterStartDate">Date de début</Label>
                <Input
                  id="filterStartDate"
                  type="date"
                  value={filterStartDate}
                  onChange={(e) => setFilterStartDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterEndDate">Date de fin</Label>
                <Input
                  id="filterEndDate"
                  type="date"
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="filterInsurance">Assurance</Label>
                <select
                  id="filterInsurance"
                  value={filterInsurance}
                  onChange={(e) => setFilterInsurance(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">Toutes les assurances</option>
                  {allInsurances.map(insurance => (
                    <option key={insurance} value={insurance}>
                      {insurance}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end">
                <Button
                  variant="outline"
                  onClick={resetFilters}
                  className="w-full"
                >
                  Réinitialiser
                </Button>
              </div>
            </div>
            <div className="mt-4 p-3 bg-muted rounded-lg">
              <div className="text-sm text-muted-foreground">
                <strong>Résultats filtrés:</strong> {filteredSales.length} vente(s) • 
                <strong> Commission totale:</strong> {totalCommission.toFixed(2)} €
              </div>
            </div>
          </CardContent>
        )}
      </Card>

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
              ) : (
                <div>
                  <div className="text-sm text-muted-foreground mb-1">Aucun objectif défini</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{employee.salesCount} ventes • {employee.totalCommission.toFixed(2)} € commission</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3 mt-1">
                    <div className="h-3 rounded-full bg-blue-500 transition-all duration-300" style={{ width: '0%' }}></div>
                  </div>
                </div>
              )}
                
                {employee.objective && (
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div 
                      className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(employee.progressPercentage)}`}
                      style={{ width: `${Math.min(employee.progressPercentage, 100)}%` }}
                    ></div>
                  </div>
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
            Historique Détaillé des Ventes ({filteredSales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredSales.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">
                {sales.length === 0 ? 'Aucune vente enregistrée' : 'Aucune vente ne correspond aux filtres'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredSales.map((sale) => (
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
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sale.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog d'édition de vente */}
      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Modifier la vente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="editClientName">Nom du client *</Label>
              <Input
                id="editClientName"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                placeholder="Nom du client"
              />
            </div>

            <div>
              <Label htmlFor="editReservationNumber">N° de réservation *</Label>
              <Input
                id="editReservationNumber"
                value={editReservationNumber}
                onChange={(e) => setEditReservationNumber(e.target.value)}
                placeholder="Ex: LOC-2024-001"
              />
            </div>

            <div className="space-y-3">
              <Label>Assurances souscrites *</Label>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto">
                {insuranceTypes.filter(ins => ins.isActive).map((insurance) => (
                  <div key={insurance.id} className="flex items-center space-x-3 p-3 border rounded-lg hover:bg-muted/50">
                    <Checkbox
                      checked={editSelectedInsurances.includes(insurance.name)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setEditSelectedInsurances([...editSelectedInsurances, insurance.name]);
                        } else {
                          setEditSelectedInsurances(editSelectedInsurances.filter(name => name !== insurance.name));
                        }
                      }}
                    />
                    <div className="flex-1">
                      <Label className="font-medium">{insurance.name}</Label>
                      <p className="text-sm text-success">{insurance.commission.toFixed(2)} €</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <Label htmlFor="editNotes">Notes (optionnel)</Label>
              <Textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Informations complémentaires..."
                rows={3}
              />
            </div>

            {editSelectedInsurances.length > 0 && (
              <div className="p-3 bg-success/10 border border-success/20 rounded-lg">
                <div className="text-sm font-medium text-success">
                  Commission totale: {editSelectedInsurances.reduce((sum, insuranceName) => {
                    const insurance = insuranceTypes.find(ins => ins.name === insuranceName);
                    return sum + (insurance?.commission || 0);
                  }, 0).toFixed(2)} €
                </div>
              </div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingSale(null)} disabled={editLoading}>
                Annuler
              </Button>
              <Button onClick={handleSaveEdit} disabled={editLoading}>
                {editLoading ? "Modification..." : "Sauvegarder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};