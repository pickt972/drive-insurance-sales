import { useState, useMemo } from 'react';
import { useSales } from '@/hooks/useSales';
import { useInsuranceTypes } from '@/hooks/useInsuranceTypes';
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
import { Search, Download, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AllSalesTable() {
  const { sales } = useSales();
  const { insuranceTypes } = useInsuranceTypes();

  const [search, setSearch] = useState('');
  const [filterEmployee, setFilterEmployee] = useState('all');
  const [filterType, setFilterType] = useState('all');

  // Liste des employés uniques
  const employees = useMemo(() => {
    const unique = new Set(sales.map(s => s.employee_name));
    return Array.from(unique).sort();
  }, [sales]);

  // Filtrage
  const filteredSales = useMemo(() => {
    let filtered = [...sales];

    if (search) {
      const searchLower = search.toLowerCase();
      filtered = filtered.filter(sale =>
        sale.contract_number?.toLowerCase().includes(searchLower) ||
        sale.customer_name?.toLowerCase().includes(searchLower) ||
        sale.employee_name?.toLowerCase().includes(searchLower)
      );
    }

    if (filterEmployee !== 'all') {
      filtered = filtered.filter(sale => sale.employee_name === filterEmployee);
    }

    if (filterType !== 'all') {
      filtered = filtered.filter(sale => sale.insurance_type === filterType);
    }

    return filtered;
  }, [sales, search, filterEmployee, filterType]);

  // Export CSV
  const handleExportCSV = () => {
    const headers = ['Date', 'Employé', 'Type', 'Contrat', 'Montant', 'Commission', 'Client'];
    const rows = filteredSales.map(sale => [
      format(new Date(sale.sale_date), 'dd/MM/yyyy'),
      sale.employee_name,
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
    link.download = `ventes-globales-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    link.click();
  };

  // Stats rapides
  const stats = useMemo(() => ({
    total: filteredSales.reduce((sum, s) => sum + s.amount, 0),
    commission: filteredSales.reduce((sum, s) => sum + s.commission, 0),
    count: filteredSales.length,
  }), [filteredSales]);

  return (
    <Card className="modern-card animate-gentle-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle>Toutes les ventes</CardTitle>
              <CardDescription>
                {filteredSales.length} vente{filteredSales.length > 1 ? 's' : ''} - 
                <span className="font-semibold text-primary"> Total : {stats.total.toFixed(2)} €</span> - 
                <span className="font-semibold text-success"> Commission : {stats.commission.toFixed(2)} €</span>
              </CardDescription>
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={handleExportCSV}
            className="hover:bg-primary/10 hover:text-primary hover:scale-105 transition-all duration-300"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>

          <Select value={filterEmployee} onValueChange={setFilterEmployee}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Employé" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les employés</SelectItem>
              {employees.map(emp => (
                <SelectItem key={emp} value={emp}>
                  {emp}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Type" />
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
        </div>

        {/* Tableau */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Employé</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Client</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSales.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Aucune vente trouvée
                  </TableCell>
                </TableRow>
              ) : (
                filteredSales.map((sale) => (
                  <TableRow key={sale.id}>
                    <TableCell>
                      {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">
                      {sale.employee_name}
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
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
}
