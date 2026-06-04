import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, Trash2, Copy, Search, X } from 'lucide-react';
import { format, parseISO, isWithinInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

const supabaseAny = supabase as any;

interface SaleRow {
  id: string;
  contract_number: string;
  insurance_type_id: string;
  insurance_type_name?: string;
  user_id: string;
  user_name?: string;
  client_name?: string;
  amount: number;
  sale_date: string;
  created_at: string;
  raw: any;
}

interface DuplicateGroup {
  contract_number: string;
  insurance_type_id: string;
  insurance_type_name: string;
  count: number;
  sales: SaleRow[];
}

export function AdminDuplicatesPage() {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseAny
        .from('insurance_sales')
        .select('*, insurance_types(name), profiles:user_id(full_name)')
        .not('contract_number', 'is', null)
        .not('insurance_type_id', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const map = new Map<string, SaleRow[]>();
      (data || []).forEach((s: any) => {
        const key = `${s.contract_number}__${s.insurance_type_id}`;
        const { insurance_types, profiles, ...raw } = s;
        const row: SaleRow = {
          id: s.id,
          contract_number: s.contract_number,
          insurance_type_id: s.insurance_type_id,
          insurance_type_name: insurance_types?.name || 'N/A',
          user_id: s.user_id,
          user_name: profiles?.full_name || 'N/A',
          client_name: s.client_name,
          amount: s.amount,
          sale_date: s.sale_date,
          created_at: s.created_at,
          raw,
        };
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(row);
      });

      const dups: DuplicateGroup[] = [];
      map.forEach((arr) => {
        if (arr.length > 1) {
          dups.push({
            contract_number: arr[0].contract_number,
            insurance_type_id: arr[0].insurance_type_id,
            insurance_type_name: arr[0].insurance_type_name || 'N/A',
            count: arr.length,
            sales: arr,
          });
        }
      });

      dups.sort((a, b) => b.count - a.count);
      setGroups(dups);
    } catch (e: any) {
      console.error(e);
      toast.error('Erreur', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  // Build filter options
  const userOptions = useMemo(() => {
    const seen = new Map<string, string>();
    groups.forEach((g) => g.sales.forEach((s) => seen.set(s.user_id, s.user_name || 'N/A')));
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [groups]);

  const typeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    groups.forEach((g) => seen.set(g.insurance_type_id, g.insurance_type_name));
    return Array.from(seen.entries()).sort((a, b) => a[1].localeCompare(b[1]));
  }, [groups]);

  const filteredGroups = useMemo(() => {
    const term = search.trim().toLowerCase();
    const from = dateFrom ? parseISO(dateFrom) : null;
    const to = dateTo ? parseISO(dateTo) : null;

    return groups
      .map((g) => {
        if (typeFilter !== 'all' && g.insurance_type_id !== typeFilter) return null;

        const matchesGroup = !term
          || g.contract_number.toLowerCase().includes(term)
          || g.insurance_type_name.toLowerCase().includes(term);

        const filteredSales = g.sales.filter((s) => {
          if (userFilter !== 'all' && s.user_id !== userFilter) return false;
          if (from || to) {
            const d = parseISO(s.sale_date);
            if (from && to) {
              if (!isWithinInterval(d, { start: from, end: to })) return false;
            } else if (from && d < from) return false;
            else if (to && d > to) return false;
          }
          if (term && !matchesGroup) {
            const inSale = (s.client_name || '').toLowerCase().includes(term)
              || (s.user_name || '').toLowerCase().includes(term);
            if (!inSale) return false;
          }
          return true;
        });

        if (filteredSales.length < 2) return null;
        return { ...g, sales: filteredSales, count: filteredSales.length };
      })
      .filter(Boolean) as DuplicateGroup[];
  }, [groups, search, userFilter, typeFilter, dateFrom, dateTo]);

  const clearFilters = () => {
    setSearch('');
    setUserFilter('all');
    setTypeFilter('all');
    setDateFrom('');
    setDateTo('');
  };

  const hasFilters = search || userFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo;

  const handleDelete = async () => {
    if (!deleteId) return;
    // Find the sale to back it up
    let backup: any = null;
    for (const g of groups) {
      const found = g.sales.find((s) => s.id === deleteId);
      if (found) { backup = found.raw; break; }
    }
    const idToDelete = deleteId;
    setDeleteId(null);

    try {
      const { error } = await supabaseAny.from('insurance_sales').delete().eq('id', idToDelete);
      if (error) throw error;

      toast.success('Doublon supprimé', {
        description: `Vente n° ${backup?.contract_number || ''} supprimée.`,
        action: backup
          ? {
              label: 'Annuler',
              onClick: async () => {
                try {
                  const { error: restoreErr } = await supabaseAny.rpc('restore_insurance_sale', {
                    sale_data: backup,
                  });
                  if (restoreErr) throw restoreErr;
                  toast.success('Vente restaurée');
                  await fetchDuplicates();
                } catch (err: any) {
                  toast.error('Restauration impossible', { description: err.message });
                }
              },
            }
          : undefined,
        duration: 8000,
      });
      await fetchDuplicates();
    } catch (e: any) {
      toast.error('Erreur', { description: e.message });
    }
  };

  const totalDuplicates = filteredGroups.reduce((sum, g) => sum + (g.count - 1), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-950">
            <Copy className="h-6 w-6 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Vérification des doublons</h1>
            <p className="text-muted-foreground">
              Détection des ventes ayant le même numéro de dossier et type d'assurance
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={fetchDuplicates} disabled={loading}>
          <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Recherche et filtres
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="lg:col-span-2">
              <Label className="text-xs">Recherche</Label>
              <Input
                placeholder="N° dossier, client, employé…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div>
              <Label className="text-xs">Employé</Label>
              <Select value={userFilter} onValueChange={setUserFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {userOptions.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Type d'assurance</Label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  {typeOptions.map(([id, name]) => (
                    <SelectItem key={id} value={id}>{name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2">
              <div className="flex-1">
                <Label className="text-xs">Du</Label>
                <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
              </div>
              <div className="flex-1">
                <Label className="text-xs">Au</Label>
                <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
              </div>
            </div>
          </div>
          {hasFilters && (
            <div className="mt-3 flex justify-end">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-3 w-3 mr-1" /> Réinitialiser les filtres
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Groupes en doublon</CardDescription>
            <CardTitle className="text-3xl">{filteredGroups.length}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Ventes en trop</CardDescription>
            <CardTitle className="text-3xl text-orange-600">{totalDuplicates}</CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Statut</CardDescription>
            <CardTitle className="text-lg">
              {filteredGroups.length === 0 ? (
                <span className="text-green-600">✅ Aucun doublon</span>
              ) : (
                <span className="text-orange-600 flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" /> Action requise
                </span>
              )}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {filteredGroups.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {hasFilters ? 'Aucun doublon ne correspond aux filtres.' : 'Aucun doublon détecté dans la base de données.'}
          </CardContent>
        </Card>
      )}

      {filteredGroups.map((group) => (
        <Card key={`${group.contract_number}-${group.insurance_type_id}`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="font-mono text-base">
                  Dossier {group.contract_number}
                </CardTitle>
                <CardDescription>
                  <Badge variant="secondary" className="mr-2">{group.insurance_type_name}</Badge>
                  {group.count} enregistrements
                </CardDescription>
              </div>
              <Badge variant="destructive">{group.count - 1} doublon{group.count - 1 > 1 ? 's' : ''}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date vente</TableHead>
                  <TableHead>Créé le</TableHead>
                  <TableHead>Utilisateur</TableHead>
                  <TableHead>Client</TableHead>
                  <TableHead className="text-right">Montant</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {group.sales.map((s, idx) => (
                  <TableRow key={s.id}>
                    <TableCell>{format(new Date(s.sale_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                      {idx === 0 && <Badge variant="outline" className="ml-2 text-[10px]">Original</Badge>}
                    </TableCell>
                    <TableCell>{s.user_name}</TableCell>
                    <TableCell>{s.client_name || '-'}</TableCell>
                    <TableCell className="text-right font-semibold">{Number(s.amount).toFixed(2)} €</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteId(s.id)}
                        disabled={idx === 0}
                        title={idx === 0 ? "Original conservé" : "Supprimer ce doublon"}
                      >
                        <Trash2 className={`h-4 w-4 ${idx === 0 ? 'text-gray-300' : 'text-red-500'}`} />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce doublon ?</AlertDialogTitle>
            <AlertDialogDescription>
              La vente sera supprimée. Vous pourrez l'annuler immédiatement via la notification.
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
    </div>
  );
}
