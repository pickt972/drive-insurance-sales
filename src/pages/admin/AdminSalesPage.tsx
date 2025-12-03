import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Download, Search, Filter } from 'lucide-react';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function AdminSalesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    loadSales();
  }, []);

  const loadSales = async () => {
    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from('insurance_sales')
        .select(`
          *,
          insurance_types(name),
          profiles:user_id(full_name)
        `)
        .order('sale_date', { ascending: false })
        .limit(100);

      if (error) {
        console.error('Error loading sales:', error);
      }
      setSales(data || []);
    } catch (error) {
      console.error('Error loading sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    const headers = ['Date', 'Employé', 'Type', 'Contrat', 'Client', 'Montant', 'Commission', 'Agence', 'Statut'];
    const rows = filteredSales.map(sale => [
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
  };

  const filteredSales = sales.filter(sale =>
    searchTerm === '' ||
    sale.contract_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sale.profiles?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalAmount = filteredSales.reduce((sum, sale) => sum + Number(sale.amount), 0);
  const totalCommission = filteredSales.reduce((sum, sale) => sum + Number(sale.commission_amount), 0);

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
            <div className="text-2xl font-bold text-blue-600">{filteredSales.length}</div>
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

      {/* Filters */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par contrat, client ou employé..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
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
                ) : filteredSales.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={9} className="text-center py-8">
                      Aucune vente trouvée
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSales.map((sale) => (
                    <TableRow key={sale.id}>
                      <TableCell>
                        {format(new Date(sale.sale_date), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell className="font-medium">{sale.profiles?.full_name}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{sale.insurance_types?.name}</Badge>
                      </TableCell>
                      <TableCell className="font-mono text-sm">{sale.contract_number}</TableCell>
                      <TableCell>{sale.client_name}</TableCell>
                      <TableCell className="text-right font-medium">{Number(sale.amount).toFixed(2)} €</TableCell>
                      <TableCell className="text-right text-green-600 font-medium">
                        {Number(sale.commission_amount).toFixed(2)} €
                      </TableCell>
                      <TableCell>{sale.agency}</TableCell>
                      <TableCell>
                        <Badge
                          variant={sale.status === 'validated' ? 'default' : 'secondary'}
                          className={sale.status === 'validated' ? 'bg-green-100 text-green-800' : ''}
                        >
                          {sale.status}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
