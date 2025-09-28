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
    <div className="space-y-8">
      {/* Filtres et Export */}
      <div className="modern-card animate-gentle-fade-in max-w-7xl mx-auto">
        <div className="p-4 lg:p-8">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 gap-4 lg:gap-0">
            <div className="flex items-center gap-3">
              <div className="icon-wrapper">
                <Filter className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg lg:text-2xl font-bold gradient-text">🔍 Filtres et Export</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2 lg:gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
              >
                <Filter className="h-4 w-4 mr-2" />
                {showFilters ? 'Masquer' : 'Afficher'} Filtres
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToCSV}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
              >
                <Download className="h-4 w-4 mr-2" />
                Export CSV
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={exportToPDF}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
              >
                <FileText className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
            </div>
          </div>
          
          {showFilters && (
            <div className="space-y-6 animate-smooth-scale-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 lg:gap-4">
                <div className="space-y-2">
                  <Label htmlFor="filterEmployee" className="text-sm font-semibold">Employé</Label>
                  <select
                    id="filterEmployee"
                    value={filterEmployee}
                    onChange={(e) => setFilterEmployee(e.target.value)}
                    className="friendly-input text-sm"
                  >
                    <option value="">Tous les employés</option>
                    {users.filter(u => u.role === 'employee').map(user => (
                      <option key={user.username} value={user.username}>
                        {user.firstName} {user.lastName}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterStartDate" className="text-sm font-semibold">Date de début</Label>
                  <Input
                    id="filterStartDate"
                    type="date"
                    value={filterStartDate}
                    onChange={(e) => setFilterStartDate(e.target.value)}
                    className="friendly-input text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterEndDate" className="text-sm font-semibold">Date de fin</Label>
                  <Input
                    id="filterEndDate"
                    type="date"
                    value={filterEndDate}
                    onChange={(e) => setFilterEndDate(e.target.value)}
                    className="friendly-input text-sm"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterInsurance" className="text-sm font-semibold">Assurance</Label>
                  <select
                    id="filterInsurance"
                    value={filterInsurance}
                    onChange={(e) => setFilterInsurance(e.target.value)}
                    className="friendly-input text-sm"
                  >
                    <option value="">Toutes les assurances</option>
                    {allInsurances.map(insurance => (
                      <option key={insurance} value={insurance}>
                        {insurance}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex items-end md:col-span-2 lg:col-span-1">
                  <Button
                    variant="outline"
                    onClick={resetFilters}
                    className="w-full rounded-2xl hover:scale-105 transition-all duration-300 text-xs lg:text-sm"
                  >
                    Réinitialiser
                  </Button>
                </div>
              </div>
              <div className="modern-card p-3 lg:p-4 bg-gradient-to-r from-info/10 to-info/5 border-info/30">
                <div className="text-sm lg:text-base text-info font-semibold">
                  📊 <strong>Résultats filtrés:</strong> {filteredSales.length} vente(s) • 
                  <strong> Commission totale:</strong> {totalCommission.toFixed(2)} €
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Statistiques globales */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-6">
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
              <Euro className="h-6 w-6 text-success" />
            </div>
            <div className="text-right">
              <p className="text-lg lg:text-3xl font-bold text-success">{totalCommission.toFixed(2)} €</p>
              <p className="text-xs lg:text-sm text-muted-foreground">CA Total</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-success to-success-variant rounded-full animate-gentle-pulse" style={{ width: '85%' }}></div>
          </div>
        </div>
        
        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.3s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper p-1.5 lg:p-3">
              <Clock className="h-6 w-6 text-warning" />
            </div>
            <div className="text-right">
              <p className="text-xl lg:text-3xl font-bold text-warning">{salesThisMonth.length}</p>
              <p className="text-xs lg:text-sm text-muted-foreground">Ventes ce mois</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-warning to-orange rounded-full animate-gentle-pulse" style={{ width: '60%' }}></div>
          </div>
        </div>
        
        <div className="stat-card animate-gentle-fade-in" style={{ animationDelay: '0.4s' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="icon-wrapper p-1.5 lg:p-3">
              <Target className="h-6 w-6 text-info" />
            </div>
            <div className="text-right">
              <p className="text-lg lg:text-3xl font-bold text-info">
                {salesThisMonth.reduce((sum, sale) => sum + sale.commissionAmount, 0).toFixed(2)} €
              </p>
              <p className="text-xs lg:text-sm text-muted-foreground">CA Mensuel</p>
            </div>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-info to-purple rounded-full animate-gentle-pulse" style={{ width: '70%' }}></div>
          </div>
        </div>
      </div>

      {/* Historique détaillé */}
      <div className="modern-card animate-smooth-scale-in max-w-7xl mx-auto" style={{ animationDelay: '0.5s' }}>
        <div className="p-4 lg:p-8">
          <div className="flex items-center gap-3 mb-6 lg:mb-8">
            <div className="icon-wrapper">
              <Clock className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-lg lg:text-2xl font-bold gradient-text">📋 Historique Détaillé ({filteredSales.length})</h2>
          </div>
          
          {filteredSales.length === 0 ? (
            <div className="text-center py-8 lg:py-16">
              <div className="icon-wrapper mx-auto mb-6 opacity-50">
                <FileText className="h-12 lg:h-16 w-12 lg:w-16" />
              </div>
              <p className="text-base lg:text-lg text-muted-foreground">
                {sales.length === 0 ? 'Aucune vente enregistrée' : 'Aucune vente ne correspond aux filtres'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 lg:space-y-4">
              {filteredSales.map((sale, index) => (
                <div key={sale.id} className="modern-card p-4 lg:p-6 animate-elegant-slide" style={{ animationDelay: `${0.6 + index * 0.05}s` }}>
                  <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 lg:gap-0">
                    <div className="flex-1">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 lg:gap-4 mb-3 lg:mb-4">
                        <h3 className="font-bold text-lg lg:text-xl text-foreground">{sale.clientName}</h3>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs w-fit">{sale.reservationNumber}</Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6 text-xs lg:text-sm text-muted-foreground mb-3 lg:mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <User className="h-4 w-4" />
                            <span className="font-medium">{users.find(u => u.username === sale.employeeName)?.firstName} {users.find(u => u.username === sale.employeeName)?.lastName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" />
                            <span>{formatDate(sale.createdAt)}</span>
                          </div>
                        </div>
                        <div className="space-y-2">
                          {sale.clientEmail && (
                            <div className="flex items-center gap-2">
                              <Mail className="h-4 w-4" />
                              <span>{sale.clientEmail}</span>
                            </div>
                          )}
                          {sale.clientPhone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4" />
                              <span>{sale.clientPhone}</span>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 lg:gap-0">
                        <div className="flex flex-wrap gap-1 lg:gap-2">
                          {sale.insuranceTypes.map((insurance) => (
                            <Badge key={insurance} variant="secondary" className="rounded-full px-2 lg:px-3 py-1 text-xs font-medium">
                              {insurance}
                            </Badge>
                          ))}
                        </div>
                        <div className="success-indicator text-base lg:text-lg font-bold">
                          {sale.commissionAmount.toFixed(2)} €
                        </div>
                      </div>
                      
                      {sale.notes && (
                        <div className="mt-3 lg:mt-4 p-2 lg:p-3 bg-muted/50 rounded-2xl">
                          <p className="text-xs lg:text-sm text-muted-foreground italic">"{sale.notes}"</p>
                        </div>
                      )}
                    </div>

                    {isAdmin && (
                      <div className="flex gap-2 lg:ml-4">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditSale(sale)}
                          className="rounded-2xl hover:scale-105 transition-all duration-300 h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                        >
                          <Edit className="h-4 w-4" />
                          <span className="hidden lg:inline ml-2">Modifier</span>
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(sale.id)}
                          className="rounded-2xl hover:scale-105 transition-all duration-300 text-destructive hover:text-destructive h-8 w-8 lg:h-9 lg:w-auto lg:px-3"
                        >
                          <Trash2 className="h-4 w-4" />
                          <span className="hidden lg:inline ml-2">Supprimer</span>
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Dialog d'édition de vente */}
      <Dialog open={!!editingSale} onOpenChange={(open) => !open && setEditingSale(null)}>
        <DialogContent className="max-w-2xl modern-card border-0 mx-4 lg:mx-auto">
          <DialogHeader>
            <DialogTitle className="text-xl lg:text-2xl font-bold gradient-text">✏️ Modifier la vente</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 lg:space-y-6 mt-4 lg:mt-6">
            <div className="space-y-2">
              <Label htmlFor="editClientName" className="text-sm font-semibold">👤 Nom du client *</Label>
              <Input
                id="editClientName"
                value={editClientName}
                onChange={(e) => setEditClientName(e.target.value)}
                placeholder="Nom du client"
                className="friendly-input text-sm"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="editReservationNumber" className="text-sm font-semibold">🎫 N° de réservation *</Label>
              <Input
                id="editReservationNumber"
                value={editReservationNumber}
                onChange={(e) => setEditReservationNumber(e.target.value)}
                placeholder="Ex: LOC-2024-001"
                className="friendly-input text-sm"
              />
            </div>

            <div className="space-y-4">
              <Label className="text-sm font-semibold">🛡️ Assurances souscrites *</Label>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-4 max-h-48 lg:max-h-60 overflow-y-auto">
                {insuranceTypes.filter(ins => ins.isActive).map((insurance) => (
                  <div key={insurance.id} className="modern-card p-3 lg:p-4 cursor-pointer hover:scale-105 transition-all duration-300 group">
                    <div className="flex items-center space-x-3 lg:space-x-4">
                      <Checkbox
                        checked={editSelectedInsurances.includes(insurance.name)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            setEditSelectedInsurances([...editSelectedInsurances, insurance.name]);
                          } else {
                            setEditSelectedInsurances(editSelectedInsurances.filter(name => name !== insurance.name));
                          }
                        }}
                        className="scale-110 lg:scale-125"
                      />
                      <div className="flex-1">
                        <Label className="font-semibold text-sm lg:text-base group-hover:text-primary transition-colors duration-300">{insurance.name}</Label>
                        <div className="success-indicator mt-1 lg:mt-2 text-xs lg:text-sm">
                          <span className="font-bold">+{insurance.commission.toFixed(2)} €</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="editNotes" className="text-sm font-semibold">📝 Notes (optionnel)</Label>
              <Textarea
                id="editNotes"
                value={editNotes}
                onChange={(e) => setEditNotes(e.target.value)}
                placeholder="Informations complémentaires..."
                className="friendly-input text-sm min-h-[80px] lg:min-h-[100px]"
                rows={3}
              />
            </div>

            {editSelectedInsurances.length > 0 && (
              <div className="modern-card p-3 lg:p-4 bg-gradient-to-r from-success/10 to-success/5 border-success/30">
                <div className="flex items-center justify-between">
                  <span className="text-base lg:text-lg font-semibold text-success">💰 Commission totale</span>
                  <span className="text-lg lg:text-xl font-bold text-success">
                    {editSelectedInsurances.reduce((sum, insuranceName) => {
                      const insurance = insuranceTypes.find(ins => ins.name === insuranceName);
                      return sum + (insurance?.commission || 0);
                    }, 0).toFixed(2)} €
                  </span>
                </div>
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setEditingSale(null)} 
                disabled={editLoading}
                className="rounded-2xl hover:scale-105 transition-all duration-300 text-sm lg:text-base"
              >
                Annuler
              </Button>
              <Button 
                onClick={handleSaveEdit} 
                disabled={editLoading}
                className="modern-button text-sm lg:text-base"
              >
                {editLoading ? "🔄 Modification..." : "💾 Sauvegarder"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};