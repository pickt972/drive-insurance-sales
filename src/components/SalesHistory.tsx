import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Clock, Trash2, User, FileText, TrendingUp, Euro, Target, Phone, Mail, Filter, Download, Calendar as CalendarIcon, ChevronLeft, ChevronRight, Search, X } from "lucide-react";
import { CreditCard as Edit } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { useAuth } from "@/contexts/AuthContext";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
  PaginationEllipsis
} from "@/components/ui/pagination";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { cn } from "@/lib/utils";

export const SalesHistory = () => {
  const { isAdmin, sales, users, objectives, deleteSale, updateSale, insuranceTypes, profile, fetchSales } = useAuth();
  
  // États pour les filtres
  const [filterEmployee, setFilterEmployee] = useState("");
  const [filterStartDate, setFilterStartDate] = useState<Date | undefined>();
  const [filterEndDate, setFilterEndDate] = useState<Date | undefined>();
  const [filterInsurance, setFilterInsurance] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // États pour la pagination
  const [currentPage, setCurrentPage] = useState(1);
  const ITEMS_PER_PAGE = 20;

  // États pour l'édition de vente
  const [editingSale, setEditingSale] = useState<any>(null);
  const [editClientName, setEditClientName] = useState("");
  const [editReservationNumber, setEditReservationNumber] = useState("");
  const [editSelectedInsurances, setEditSelectedInsurances] = useState<string[]>([]);
  const [editNotes, setEditNotes] = useState("");
  const [editLoading, setEditLoading] = useState(false);

  // Recharger les ventes à l'initialisation
  React.useEffect(() => {
    fetchSales();
  }, []);

  // Fonction de filtrage (côté client pour maintenir la compatibilité)
  const getFilteredSales = () => {
    return sales.filter(sale => {
      const matchEmployee = !filterEmployee || sale.employeeName === filterEmployee;
      const matchStartDate = !filterStartDate || new Date(sale.createdAt) >= filterStartDate;
      const matchEndDate = !filterEndDate || new Date(sale.createdAt) <= new Date(filterEndDate.getTime() + 86400000 - 1);
      const matchInsurance = !filterInsurance || sale.insuranceTypes.includes(filterInsurance);
      
      const matchSearch = !searchQuery || 
        sale.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sale.reservationNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (sale.clientEmail && sale.clientEmail.toLowerCase().includes(searchQuery.toLowerCase())) ||
        (sale.clientPhone && sale.clientPhone.includes(searchQuery));
      
      return matchEmployee && matchStartDate && matchEndDate && matchInsurance && matchSearch;
    });
  };

  const filteredSales = getFilteredSales();

  // Calculs de pagination
  const totalSales = filteredSales.length;
  const totalPages = Math.ceil(totalSales / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalSales);
  
  // Ventes paginées
  const paginatedSales = useMemo(() => {
    return filteredSales.slice(startIndex, endIndex);
  }, [filteredSales, startIndex, endIndex]);

  // Réinitialiser la page quand les filtres changent
  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterEmployee, filterStartDate, filterEndDate, filterInsurance, searchQuery]);

  // Fonction pour changer de page avec scroll
  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
    setFilterStartDate(undefined);
    setFilterEndDate(undefined);
    setFilterInsurance("");
    setSearchQuery("");
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
      if (import.meta.env.DEV) {
        console.error('Erreur lors de la modification de la vente:', error);
      }
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
    await deleteSale(saleId);
  };

  // Calculer les statistiques
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
    <div className="space-y-8 w-full overflow-x-hidden">
      {/* Filtres et Export */}
      <div className="modern-card animate-gentle-fade-in max-w-7xl mx-auto w-full overflow-x-hidden">
        <div className="p-4 lg:p-8">
          {/* Barre de recherche principale */}
          <div className="mb-6">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="🔍 Rechercher par nom client, n° réservation, email ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="friendly-input pl-12 pr-12 h-12 text-sm lg:text-base"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-xl hover:bg-muted/50"
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            {searchQuery && (
              <p className="text-sm text-muted-foreground mt-2 ml-1">
                {filteredSales.length} résultat(s) trouvé(s) pour "{searchQuery}"
              </p>
            )}
          </div>

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
                  <Label htmlFor="filterStartDate" className="text-sm font-bold">📅 Date de début</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal friendly-input h-11",
                          !filterStartDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterStartDate ? format(filterStartDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={filterStartDate}
                        onSelect={setFilterStartDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="filterEndDate" className="text-sm font-bold">📅 Date de fin</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "w-full justify-start text-left font-normal friendly-input h-11",
                          !filterEndDate && "text-muted-foreground"
                        )}
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {filterEndDate ? format(filterEndDate, "PPP", { locale: fr }) : <span>Choisir une date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0 bg-background" align="start">
                      <Calendar
                        mode="single"
                        selected={filterEndDate}
                        onSelect={setFilterEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
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
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6 lg:mb-8 gap-4">
            <div className="flex items-center gap-3">
              <div className="icon-wrapper">
                <Clock className="h-6 w-6 text-primary" />
              </div>
              <h2 className="text-lg lg:text-2xl font-bold gradient-text">📋 Historique Détaillé ({filteredSales.length})</h2>
            </div>
            
            {filteredSales.length > 0 && (
              <div className="text-sm text-muted-foreground">
                Affichage {startIndex + 1}-{endIndex} sur {totalSales} ventes
                {totalPages > 1 && ` • Page ${currentPage}/${totalPages}`}
              </div>
            )}
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
            <>
              <div className="space-y-3 lg:space-y-4">
                {paginatedSales.map((sale, index) => (
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
                          className="rounded-2xl hover:scale-105 transition-all duration-300 h-12 w-12 lg:h-9 lg:w-auto lg:px-3"
                        >
                          <Edit className="h-6 w-6" />
                          <span className="hidden lg:inline ml-2">Modifier</span>
                        </Button>
                        <ConfirmDialog
                          title="Supprimer cette vente ?"
                          description={`Êtes-vous sûr de vouloir supprimer la vente de ${sale.clientName} ? Cette action est irréversible.`}
                          onConfirm={() => handleDelete(sale.id)}
                          confirmText="Supprimer"
                          cancelText="Annuler"
                          destructive={true}
                          trigger={
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-2xl hover:scale-105 transition-all duration-300 text-destructive hover:text-destructive h-12 w-12 lg:h-9 lg:w-auto lg:px-3"
                            >
                              <Trash2 className="h-6 w-6" />
                              <span className="hidden lg:inline ml-2">Supprimer</span>
                            </Button>
                          }
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex flex-col items-center gap-4">
                  <Pagination>
                    <PaginationContent className="flex-wrap gap-1">
                      <PaginationItem>
                        <PaginationPrevious 
                          onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                          className={`cursor-pointer ${currentPage === 1 ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}`}
                        />
                      </PaginationItem>
                      
                      {/* Première page */}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => handlePageChange(1)}
                          isActive={currentPage === 1}
                          className="cursor-pointer"
                        >
                          1
                        </PaginationLink>
                      </PaginationItem>

                      {/* Ellipsis si nécessaire */}
                      {currentPage > 3 && totalPages > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Pages du milieu */}
                      {Array.from({ length: totalPages }, (_, i) => i + 1)
                        .filter(page => {
                          if (page === 1 || page === totalPages) return false;
                          return Math.abs(currentPage - page) <= 1;
                        })
                        .map(page => (
                          <PaginationItem key={page}>
                            <PaginationLink
                              onClick={() => handlePageChange(page)}
                              isActive={currentPage === page}
                              className="cursor-pointer"
                            >
                              {page}
                            </PaginationLink>
                          </PaginationItem>
                        ))}

                      {/* Ellipsis si nécessaire */}
                      {currentPage < totalPages - 2 && totalPages > 4 && (
                        <PaginationItem>
                          <PaginationEllipsis />
                        </PaginationItem>
                      )}

                      {/* Dernière page */}
                      {totalPages > 1 && (
                        <PaginationItem>
                          <PaginationLink
                            onClick={() => handlePageChange(totalPages)}
                            isActive={currentPage === totalPages}
                            className="cursor-pointer"
                          >
                            {totalPages}
                          </PaginationLink>
                        </PaginationItem>
                      )}

                      <PaginationItem>
                        <PaginationNext 
                          onClick={() => currentPage < totalPages && handlePageChange(currentPage + 1)}
                          className={`cursor-pointer ${currentPage === totalPages ? 'pointer-events-none opacity-50' : 'hover:bg-accent'}`}
                        />
                      </PaginationItem>
                    </PaginationContent>
                  </Pagination>
                  
                  <div className="text-sm text-muted-foreground text-center">
                    Affichage {startIndex + 1}-{endIndex} sur {totalSales} ventes
                    <span className="mx-2">•</span>
                    Page {currentPage} sur {totalPages}
                  </div>
                </div>
              )}
            </>
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