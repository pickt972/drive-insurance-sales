import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, Trash2, Copy, Search, X, Undo2, ChevronLeft, ChevronRight, History, ChevronDown } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
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

type SortKey = 'date' | 'employee' | 'contract' | 'type';
type SortDir = 'asc' | 'desc';

interface AuditEvent {
  id: string;
  action: 'INSERT' | 'DELETE' | string;
  user_id: string | null;
  user_email: string | null;
  created_at: string;
  count: number;
  items: any[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 20, 50];

export function AdminDuplicatesPage() {
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [lastDeleted, setLastDeleted] = useState<any[] | null>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [userFilter, setUserFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');

  // Sort & pagination
  const [sortKey, setSortKey] = useState<SortKey>('date');
  const [sortDir, setSortDir] = useState<SortDir>('desc');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Audit log
  const [auditEvents, setAuditEvents] = useState<AuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [expandedEvent, setExpandedEvent] = useState<string | null>(null);

  const fetchAuditLog = async () => {
    setAuditLoading(true);
    try {
      const { data, error } = await supabaseAny
        .from('audit_logs')
        .select('*')
        .eq('table_name', 'insurance_sales')
        .in('action', ['DELETE', 'INSERT'])
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;

      // Group consecutive rows: same user_id + action + within 5s window
      const events: AuditEvent[] = [];
      (data || []).forEach((row: any) => {
        const last = events[events.length - 1];
        const ts = +new Date(row.created_at);
        if (
          last &&
          last.action === row.action &&
          last.user_id === row.user_id &&
          Math.abs(+new Date(last.created_at) - ts) <= 5000
        ) {
          last.items.push(row);
          last.count = last.items.length;
        } else {
          events.push({
            id: row.id,
            action: row.action,
            user_id: row.user_id,
            user_email: row.user_email,
            created_at: row.created_at,
            count: 1,
            items: [row],
          });
        }
      });
      setAuditEvents(events.slice(0, 50));
    } catch (e: any) {
      console.error(e);
    } finally {
      setAuditLoading(false);
    }
  };

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

      setGroups(dups);
      setSelected(new Set());
    } catch (e: any) {
      console.error(e);
      toast.error('Erreur', { description: e.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchDuplicates(); fetchAuditLog(); }, []);

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

    const result = groups
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

    // Sort
    const cmp = (a: DuplicateGroup, b: DuplicateGroup) => {
      let va: any; let vb: any;
      switch (sortKey) {
        case 'date':
          va = Math.max(...a.sales.map((s) => +new Date(s.sale_date)));
          vb = Math.max(...b.sales.map((s) => +new Date(s.sale_date)));
          break;
        case 'employee':
          va = a.sales[0].user_name || '';
          vb = b.sales[0].user_name || '';
          break;
        case 'contract':
          va = a.contract_number;
          vb = b.contract_number;
          break;
        case 'type':
          va = a.insurance_type_name;
          vb = b.insurance_type_name;
          break;
      }
      if (va < vb) return sortDir === 'asc' ? -1 : 1;
      if (va > vb) return sortDir === 'asc' ? 1 : -1;
      return 0;
    };
    result.sort(cmp);
    return result;
  }, [groups, search, userFilter, typeFilter, dateFrom, dateTo, sortKey, sortDir]);

  // Reset page when filters change
  useEffect(() => { setPage(1); }, [search, userFilter, typeFilter, dateFrom, dateTo, sortKey, sortDir, pageSize]);

  const totalPages = Math.max(1, Math.ceil(filteredGroups.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pagedGroups = filteredGroups.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const clearFilters = () => {
    setSearch(''); setUserFilter('all'); setTypeFilter('all'); setDateFrom(''); setDateTo('');
  };
  const hasFilters = !!(search || userFilter !== 'all' || typeFilter !== 'all' || dateFrom || dateTo);

  // Selection helpers
  const toggleOne = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };
  const toggleGroup = (group: DuplicateGroup, checked: boolean) => {
    setSelected((prev) => {
      const next = new Set(prev);
      group.sales.slice(1).forEach((s) => {
        if (checked) next.add(s.id); else next.delete(s.id);
      });
      return next;
    });
  };
  const selectAllVisible = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      pagedGroups.forEach((g) => g.sales.slice(1).forEach((s) => next.add(s.id)));
      return next;
    });
  };

  const findRawById = (id: string) => {
    for (const g of groups) {
      const f = g.sales.find((s) => s.id === id);
      if (f) return f.raw;
    }
    return null;
  };

  const handleBulkDelete = async () => {
    const ids = Array.from(selected);
    if (!ids.length) return;
    setConfirmOpen(false);

    const backups = ids.map(findRawById).filter(Boolean);

    try {
      const { error } = await supabaseAny.from('insurance_sales').delete().in('id', ids);
      if (error) throw error;
      setLastDeleted(backups);
      setSelected(new Set());

      toast.success(`${ids.length} doublon${ids.length > 1 ? 's supprimés' : ' supprimé'}`, {
        description: 'Vous pouvez annuler cette opération.',
        action: {
          label: 'Annuler',
          onClick: () => handleUndo(backups),
        },
        duration: 10000,
      });
      await fetchDuplicates();
      await fetchAuditLog();
    } catch (e: any) {
      toast.error('Erreur', { description: e.message });
    }
  };

  const handleUndo = async (backups?: any[]) => {
    const items = backups || lastDeleted;
    if (!items || !items.length) {
      toast.info('Rien à restaurer');
      return;
    }
    try {
      for (const b of items) {
        const { error } = await supabaseAny.rpc('restore_insurance_sale', { sale_data: b });
        if (error) throw error;
      }
      toast.success(`${items.length} vente${items.length > 1 ? 's restaurées' : ' restaurée'}`);
      setLastDeleted(null);
      await fetchDuplicates();
      await fetchAuditLog();
    } catch (e: any) {
      toast.error('Restauration impossible', { description: e.message });
    }
  };

  const totalDuplicates = filteredGroups.reduce((sum, g) => sum + (g.count - 1), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
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
        <div className="flex gap-2">
          {lastDeleted && lastDeleted.length > 0 && (
            <Button variant="outline" onClick={() => handleUndo()}>
              <Undo2 className="mr-2 h-4 w-4" /> Annuler la dernière opération ({lastDeleted.length})
            </Button>
          )}
          <Button variant="outline" onClick={fetchDuplicates} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Actualiser
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Search className="h-4 w-4" /> Recherche, filtres et tri
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

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
            <div>
              <Label className="text-xs">Trier par</Label>
              <Select value={sortKey} onValueChange={(v) => setSortKey(v as SortKey)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="date">Date de vente</SelectItem>
                  <SelectItem value="employee">Employé</SelectItem>
                  <SelectItem value="contract">N° de dossier</SelectItem>
                  <SelectItem value="type">Type d'assurance</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Ordre</Label>
              <Select value={sortDir} onValueChange={(v) => setSortDir(v as SortDir)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="asc">Croissant</SelectItem>
                  <SelectItem value="desc">Décroissant</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs">Par page</Label>
              <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {PAGE_SIZE_OPTIONS.map((n) => (
                    <SelectItem key={n} value={String(n)}>{n}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
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

      {/* Bulk action bar */}
      {filteredGroups.length > 0 && (
        <div className="flex items-center justify-between flex-wrap gap-2 p-3 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            <Button variant="outline" size="sm" onClick={selectAllVisible}>
              Tout sélectionner (page)
            </Button>
            <Button variant="ghost" size="sm" onClick={() => setSelected(new Set())} disabled={!selected.size}>
              Désélectionner
            </Button>
            <span className="text-sm text-muted-foreground">
              {selected.size} sélectionné{selected.size > 1 ? 's' : ''}
            </span>
          </div>
          <Button
            variant="destructive"
            size="sm"
            disabled={!selected.size}
            onClick={() => setConfirmOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Supprimer la sélection
          </Button>
        </div>
      )}

      {filteredGroups.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            {hasFilters ? 'Aucun doublon ne correspond aux filtres.' : 'Aucun doublon détecté dans la base de données.'}
          </CardContent>
        </Card>
      )}

      {pagedGroups.map((group) => {
        const dupIds = group.sales.slice(1).map((s) => s.id);
        const allSelected = dupIds.length > 0 && dupIds.every((id) => selected.has(id));
        const someSelected = dupIds.some((id) => selected.has(id));
        return (
          <Card key={`${group.contract_number}-${group.insurance_type_id}`}>
            <CardHeader>
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={allSelected ? true : someSelected ? 'indeterminate' : false}
                    onCheckedChange={(v) => toggleGroup(group, !!v)}
                    aria-label="Sélectionner tous les doublons du groupe"
                  />
                  <div>
                    <CardTitle className="font-mono text-base">
                      Dossier {group.contract_number}
                    </CardTitle>
                    <CardDescription>
                      <Badge variant="secondary" className="mr-2">{group.insurance_type_name}</Badge>
                      {group.count} enregistrements
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="destructive">{group.count - 1} doublon{group.count - 1 > 1 ? 's' : ''}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10"></TableHead>
                    <TableHead>Date vente</TableHead>
                    <TableHead>Créé le</TableHead>
                    <TableHead>Utilisateur</TableHead>
                    <TableHead>Client</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {group.sales.map((s, idx) => (
                    <TableRow key={s.id}>
                      <TableCell>
                        {idx === 0 ? (
                          <span className="text-[10px] text-muted-foreground">—</span>
                        ) : (
                          <Checkbox
                            checked={selected.has(s.id)}
                            onCheckedChange={() => toggleOne(s.id)}
                          />
                        )}
                      </TableCell>
                      <TableCell>{format(new Date(s.sale_date), 'dd/MM/yyyy', { locale: fr })}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        {format(new Date(s.created_at), 'dd/MM/yyyy HH:mm', { locale: fr })}
                        {idx === 0 && <Badge variant="outline" className="ml-2 text-[10px]">Original</Badge>}
                      </TableCell>
                      <TableCell>{s.user_name}</TableCell>
                      <TableCell>{s.client_name || '-'}</TableCell>
                      <TableCell className="text-right font-semibold">{Number(s.amount).toFixed(2)} €</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        );
      })}

      {/* Pagination */}
      {filteredGroups.length > pageSize && (
        <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
          <div className="text-sm text-muted-foreground">
            Page {currentPage} sur {totalPages} — {filteredGroups.length} groupes
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
              <ChevronLeft className="h-4 w-4" /> Précédent
            </Button>
            <Button variant="outline" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage(currentPage + 1)}>
              Suivant <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {selected.size} doublon{selected.size > 1 ? 's' : ''} ?</AlertDialogTitle>
            <AlertDialogDescription>
              Les ventes sélectionnées seront supprimées. Vous pourrez annuler immédiatement via la notification ou le bouton "Annuler la dernière opération".
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleBulkDelete} className="bg-red-600 hover:bg-red-700">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
