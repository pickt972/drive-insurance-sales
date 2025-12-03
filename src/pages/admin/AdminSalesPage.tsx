import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Search, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

const ITEMS_PER_PAGE_OPTIONS = [10, 20, 50, 100];

export function AdminSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  
  // Stats state (calculated from all data, not just current page)
  const [totalAmount, setTotalAmount] = useState(0);
  const [totalCommission, setTotalCommission] = useState(0);

  const totalPages = Math.ceil(totalCount / itemsPerPage);

  const loadSales = useCallback(async () => {
    setLoading(true);
    try {
      const supabaseAny = supabase as any;
      
      // Build the base query
      let query = supabaseAny
        .from('insurance_sales')
        .select(`
          *,
          insurance_types(name),
          profiles:user_id(full_name)
        `, { count: 'exact' });
      
      // Apply search filter if present
      if (searchTerm) {
        query = query.or(`contract_number.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`);
      }
      
      // Calculate range for pagination
      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      
      // Execute paginated query
      const { data, error, count } = await query
        .order('sale_date', { ascending: false })
        .range(from, to);

      if (error) {
        console.error('Error loading sales:', error);
      }
      
      setSales(data || []);
      setTotalCount(count || 0);
      
      // Load aggregated stats separately (for all matching records)
      await loadStats(searchTerm);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, itemsPerPage, searchTerm]);

  const loadStats = async (search: string) => {
    try {
      const supabaseAny = supabase as any;
      
      let query = supabaseAny
        .from('insurance_sales')
        .select('amount, commission_amount');
      
      if (search) {
        query = query.or(`contract_number.ilike.%${search}%,client_name.ilike.%${search}%`);
      }
      
      const { data, error } = await query;
      
      if (!error && data) {
        const sumAmount = data.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
        const sumCommission = data.reduce((sum: number, s: any) => sum + Number(s.commission_amount || 0), 0);
        setTotalAmount(sumAmount);
        setTotalCommission(sumCommission);
      }
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  useEffect(() => {
    loadSales();
  }, [loadSales]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  const exportToCSV = async () => {
    // Export all matching records, not just current page
    try {
      const supabaseAny = supabase as any;
      let query = supabaseAny
        .from('insurance_sales')
        .select(`
          *,
          insurance_types(name),
          profiles:user_id(full_name)
        `)
        .order('sale_date', { ascending: false });
      
      if (searchTerm) {
        query = query.or(`contract_number.ilike.%${searchTerm}%,client_name.ilike.%${searchTerm}%`);
      }
      
      const { data } = await query;
      
      if (!data) return;
      
      const headers = ['Date', 'Employé', 'Type', 'Contrat', 'Client', 'Montant', 'Commission', 'Agence', 'Statut'];
      const rows = data.map((sale: any) => [
        format(new Date(sale.sale_date), 'dd/MM/yyyy'),
        sale.profiles?.full_name || '-',
        sale.insurance_types?.name || '-',
        sale.contract_number || '-',
        sale.client_name || '-',
        sale.amount,
        sale.commission_amount,
        sale.agency || '-',
        sale.status,
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ventes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();
    } catch (error) {
      console.error('Export error:', error);
    }
  };

  const goToPage = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Toutes les ventes</h2>
          <p className="text-gray-600">Gestion et suivi des ventes</p>
        </div>
        <Button onClick={exportToCSV} className="bg-red-600 hover:bg-red-700">
          <Download className="h-4 w-4 mr-2" />
          Exporter CSV
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{totalCount}</div>
            <p className="text-sm text-gray-600">Ventes totales</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{totalAmount.toFixed(2)} €</div>
            <p className="text-sm text-gray-600">Montant total</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{totalCommission.toFixed(2)} €</div>
            <p className="text-sm text-gray-600">Commissions totales</p>
          </CardContent>
        </Card>
      </div>

      {/* Table with filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par contrat ou client..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Par page:</span>
              <Select 
                value={itemsPerPage.toString()} 
                onValueChange={(v) => {
                  setItemsPerPage(Number(v));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[80px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ITEMS_PER_PAGE_OPTIONS.map(opt => (
                    <SelectItem key={opt} value={opt.toString()}>{opt}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Employé</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>N° Contrat</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Commission</TableHead>
                  <TableHead>Agence</TableHead>
                  <TableHead>Statut</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Chargement...
                    </TableCell>
                  </TableRow>
                ) : sales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Aucune vente trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  sales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">{sale.profiles?.full_name || '-'}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.insurance_types?.name || '-'}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{sale.contract_number || '-'}</TableCell>
                      <TableCell>{sale.client_name || '-'}</TableCell>
                      <TableCell className="text-right font-medium">{Number(sale.amount).toFixed(2)} €</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {Number(sale.commission_amount || 0).toFixed(2)} €
                      </TableCell>
                      <TableCell>{sale.agency || '-'}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sale.status === 'validated' ? 'default' : 'secondary'}
                          className={sale.status === 'validated' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {sale.status || 'pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-gray-500">
                Affichage de {((currentPage - 1) * itemsPerPage) + 1} à {Math.min(currentPage * itemsPerPage, totalCount)} sur {totalCount} résultats
              </p>
              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                
                <div className="flex items-center gap-1 mx-2">
                  {/* Page numbers */}
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? 'default' : 'outline'}
                        size="icon"
                        onClick={() => goToPage(pageNum)}
                        className="w-8 h-8"
                      >
                        {pageNum}
                      </Button>
                    );
                  })}
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
