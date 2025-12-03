import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Download, BarChart3, TrendingUp, Users, Calendar } from 'lucide-react';
import { format, startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface ReportStats {
  totalSales: number;
  totalAmount: number;
  totalCommission: number;
  topSeller: string;
  topSellerAmount: number;
}

export function AdminReportsPage() {
  const [period, setPeriod] = useState('current');
  const [stats, setStats] = useState<ReportStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchReportData();
  }, [period]);

  const getPeriodDates = () => {
    const now = new Date();
    switch (period) {
      case 'current':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'last':
        const lastMonth = subMonths(now, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case 'last3':
        return { start: startOfMonth(subMonths(now, 2)), end: endOfMonth(now) };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const fetchReportData = async () => {
    setLoading(true);
    try {
      const { start, end } = getPeriodDates();
      
      const { data: sales, error } = await (supabase as any)
        .from('insurance_sales')
        .select('*, profiles(full_name)')
        .gte('sale_date', start.toISOString().split('T')[0])
        .lte('sale_date', end.toISOString().split('T')[0]);

      if (error) throw error;

      const salesArray = sales || [];
      const totalAmount = salesArray.reduce((sum: number, s: any) => sum + Number(s.amount || 0), 0);
      const totalCommission = salesArray.reduce((sum: number, s: any) => sum + Number(s.commission_amount || 0), 0);

      // Find top seller
      const sellerTotals: Record<string, { name: string; amount: number }> = {};
      salesArray.forEach((sale: any) => {
        const name = sale.profiles?.full_name || 'Inconnu';
        if (!sellerTotals[name]) {
          sellerTotals[name] = { name, amount: 0 };
        }
        sellerTotals[name].amount += Number(sale.amount || 0);
      });

      const topSeller = Object.values(sellerTotals).sort((a, b) => b.amount - a.amount)[0];

      setStats({
        totalSales: salesArray.length,
        totalAmount,
        totalCommission,
        topSeller: topSeller?.name || 'N/A',
        topSellerAmount: topSeller?.amount || 0,
      });
    } catch (error) {
      console.error('Error fetching report data:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les données du rapport',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = async () => {
    try {
      const { start, end } = getPeriodDates();
      
      const { data: sales, error } = await (supabase as any)
        .from('insurance_sales')
        .select('*, profiles(full_name), insurance_types(name)')
        .gte('sale_date', start.toISOString().split('T')[0])
        .lte('sale_date', end.toISOString().split('T')[0])
        .order('sale_date', { ascending: false });

      if (error) throw error;

      const headers = ['Date', 'Employé', 'Type', 'Contrat', 'Client', 'Montant', 'Commission', 'Agence'];
      const rows = (sales || []).map((sale: any) => [
        format(new Date(sale.sale_date), 'dd/MM/yyyy'),
        sale.profiles?.full_name || '-',
        sale.insurance_types?.name || '-',
        sale.contract_number || '-',
        sale.client_name || '-',
        sale.amount,
        sale.commission_amount,
        sale.agency || '-',
      ]);

      const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `rapport-ventes-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      a.click();

      toast({
        title: '✅ Export réussi',
        description: 'Le rapport a été téléchargé',
      });
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Impossible d\'exporter le rapport',
        variant: 'destructive',
      });
    }
  };

  const { start, end } = getPeriodDates();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Rapports</h2>
          <p className="text-gray-600">Analyse et export des données de vente</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-[200px]">
              <Calendar className="mr-2 h-4 w-4" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="current">Mois en cours</SelectItem>
              <SelectItem value="last">Mois précédent</SelectItem>
              <SelectItem value="last3">3 derniers mois</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={exportToCSV} className="bg-green-600 hover:bg-green-700">
            <Download className="h-4 w-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Période : {format(start, 'dd MMMM yyyy', { locale: fr })} - {format(end, 'dd MMMM yyyy', { locale: fr })}
          </CardTitle>
          <CardDescription>Synthèse des ventes sur la période sélectionnée</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-gray-500">Chargement...</div>
          ) : stats ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-blue-100">
                      <BarChart3 className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Nombre de ventes</p>
                      <p className="text-2xl font-bold">{stats.totalSales}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-green-100">
                      <TrendingUp className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Montant total</p>
                      <p className="text-2xl font-bold">{stats.totalAmount.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-purple-100">
                      <TrendingUp className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Commissions</p>
                      <p className="text-2xl font-bold">{stats.totalCommission.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 rounded-full bg-orange-100">
                      <Users className="h-6 w-6 text-orange-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Top vendeur</p>
                      <p className="text-lg font-bold truncate">{stats.topSeller}</p>
                      <p className="text-sm text-green-600">{stats.topSellerAmount.toFixed(2)} €</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">Aucune donnée disponible</div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
