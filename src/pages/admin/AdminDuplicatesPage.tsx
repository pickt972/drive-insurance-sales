import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { AlertTriangle, RefreshCw, Trash2, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
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
}

interface DuplicateGroup {
  contract_number: string;
  insurance_type_id: string;
  insurance_type_name: string;
  count: number;
  sales: SaleRow[];
}

export function AdminDuplicatesPage() {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [groups, setGroups] = useState<DuplicateGroup[]>([]);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const fetchDuplicates = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabaseAny
        .from('insurance_sales')
        .select('id, contract_number, insurance_type_id, user_id, client_name, amount, sale_date, created_at, insurance_types(name), profiles:user_id(full_name)')
        .not('contract_number', 'is', null)
        .not('insurance_type_id', 'is', null)
        .order('created_at', { ascending: true });

      if (error) throw error;

      const map = new Map<string, SaleRow[]>();
      (data || []).forEach((s: any) => {
        const key = `${s.contract_number}__${s.insurance_type_id}`;
        const row: SaleRow = {
          id: s.id,
          contract_number: s.contract_number,
          insurance_type_id: s.insurance_type_id,
          insurance_type_name: s.insurance_types?.name || 'N/A',
          user_id: s.user_id,
          user_name: s.profiles?.full_name || 'N/A',
          client_name: s.client_name,
          amount: s.amount,
          sale_date: s.sale_date,
          created_at: s.created_at,
        };
        if (!map.has(key)) map.set(key, []);
        map.get(key)!.push(row);
      });

      const dups: DuplicateGroup[] = [];
      map.forEach((arr, key) => {
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
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDuplicates();
  }, []);

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      const { error } = await supabaseAny.from('insurance_sales').delete().eq('id', deleteId);
      if (error) throw error;
      toast({ title: '✅ Vente supprimée' });
      setDeleteId(null);
      await fetchDuplicates();
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    }
  };

  const totalDuplicates = groups.reduce((sum, g) => sum + (g.count - 1), 0);

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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Groupes en doublon</CardDescription>
            <CardTitle className="text-3xl">{groups.length}</CardTitle>
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
              {groups.length === 0 ? (
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

      {groups.length === 0 && !loading && (
        <Card>
          <CardContent className="py-12 text-center text-muted-foreground">
            Aucun doublon détecté dans la base de données.
          </CardContent>
        </Card>
      )}

      {groups.map((group) => (
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
              Cette vente sera définitivement supprimée. Cette action est irréversible.
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
