import { useState, useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { useInsuranceTypes } from '@/hooks/useInsuranceTypes';
import { exportSalesPDF } from '@/utils/pdfExport';
import { exportSalesExcel } from '@/utils/excelExport';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Trash2, 
  Download,
  ChevronLeft,
  ChevronRight,
  FileText,
  FileSpreadsheet
} from 'lucide-react';
import { format, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export const SalesHistory = () => {
  const { sales, deleteSale, loading } = useSales();
  const { insuranceTypes } = useInsuranceTypes();

  // États pour filtres
  const [search, setSearch] = useState('');
  const [filterInsuranceType, setFilterInsuranceType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Suppression
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filtrage et recherche
  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    // Recherche
    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.contract_number?.toLowerCase().includes(searchLower) ||
        sale.customer_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtre type assurance
    if (filterInsuranceType !== 'all') {
      filtered = filtered.filter(sale => sale.insurance_type === filterInsuranceType);
    }

    // Filtre mois
    if (filterMonth !== 'all') {
      const [year, month] = filterMonth.split('-');
      filtered = filtered.filter(sale => {
        const saleDate = new Date(sale.sale_date);
        return saleDate.getFullYear() === parseInt(year) && 
               saleDate.getMonth() === parseInt(month) - 1;
      });
    }

    return filtered;
  }, [sales, search, filterInsuranceType, filterMonth]);

  // Pagination
  const totalPages = Math.ceil(filteredSales.length / itemsPerPage);
  const paginatedSales = filteredSales.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Type', 'Contrat', 'Montant', 'Commission', 'Client'];
    const rows = filteredSales.map(sale => [
      format(new Date(sale.sale_date), 'dd/MM/yyyy'),
      sale.insurance_type,
      sale.contract_number,
      `${sale.amount.toFixed(2)} €`,
      `${sale.commission.toFixed(2)} €`,
      sale.customer_name || '-',
    ]);

    const csvContent = [
      headers.join(';'),
      ...rows.map(row => row.join(';'))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ventes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  const handleDelete = async () => {
    if (deleteId) {
      await deleteSale(deleteId);
      setDeleteId(null);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Historique des ventes</CardTitle>
            <CardDescription>
              {filteredSales.length} vente{filteredSales.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={handleExportCSV}>
              <Download className="mr-2 h-4 w-4" />
              CSV
            </Button>
            <Button variant="outline" onClick={() => exportSalesExcel(filteredSales, 'mes-ventes')}>
              <FileSpreadsheet className="mr-2 h-4 w-4" />
              Excel
            </Button>
            <Button variant="outline" onClick={() => exportSalesPDF(filteredSales, 'Mes ventes')}>
              <FileText className="mr-2 h-4 w-4" />
              PDF
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Rechercher par contrat ou client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterInsuranceType} onValueChange={setFilterInsuranceType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type d'assurance" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les types</SelectItem>
              {insuranceTypes.map(type => (
                <SelectItem key={type.id} value={type.name}>
                  {type.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterMonth} onValueChange={setFilterMonth}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les mois</SelectItem>
              <SelectItem value={format(new Date(), 'yyyy-MM')}>
                Mois en cours
              </SelectItem>
              <SelectItem value={format(subMonths(new Date(), 1), 'yyyy-MM')}>
                Mois dernier
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Tableau */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Client</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune vente trouvée
                  </TableCell>
                </TableRow>
              ) : (
                paginatedSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{sale.insurance_type}</Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">
                      {sale.contract_number}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {sale.amount.toFixed(2)} €
                    </TableCell>
                    <TableCell className="text-right text-green-600 font-semibold">
                      {sale.commission.toFixed(2)} €
                    </TableCell>
                    <TableCell>{sale.customer_name || '-'}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          onClick={() => setDeleteId(sale.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} sur {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>

      {/* Dialog de confirmation suppression */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la suppression</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer cette vente ? Cette action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
};
