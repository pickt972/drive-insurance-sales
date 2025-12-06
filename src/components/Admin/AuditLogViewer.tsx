import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Shield, Search, AlertCircle, CalendarIcon, X, Eye, ArrowRight, RotateCcw, Loader2 } from 'lucide-react';
import { format, isWithinInterval, startOfDay, endOfDay } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface AuditLog {
  id: string;
  created_at: string;
  user_email: string;
  user_role: string;
  action: string;
  table_name: string;
  record_id: string;
  old_values?: any;
  new_values?: any;
}

// Field labels for better readability
const FIELD_LABELS: Record<string, string> = {
  id: 'ID',
  user_id: 'ID Utilisateur',
  insurance_type_id: 'Type assurance',
  amount: 'Montant',
  commission_amount: 'Commission',
  sale_date: 'Date de vente',
  created_at: 'Créé le',
  updated_at: 'Modifié le',
  notes: 'Notes',
  status: 'Statut',
  agency: 'Agence',
  vehicle_registration: 'Immatriculation',
  client_phone: 'Téléphone client',
  client_name: 'Nom client',
  contract_number: 'N° Contrat',
};

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
  const [dateFromOpen, setDateFromOpen] = useState(false);
  const [dateToOpen, setDateToOpen] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [restoring, setRestoring] = useState(false);
  const [confirmRestore, setConfirmRestore] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const { data, error } = await (supabase as any)
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;
      setLogs(data || []);
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les logs d\'audit',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const restoreSale = async (log: AuditLog) => {
    if (!log.old_values || log.table_name !== 'insurance_sales') {
      toast({
        title: 'Erreur',
        description: 'Impossible de restaurer cet enregistrement',
        variant: 'destructive'
      });
      return;
    }

    setRestoring(true);
    try {
      const { id, created_at, updated_at, ...saleData } = log.old_values;
      
      const { error } = await supabase
        .from('insurance_sales')
        .insert({
          ...saleData,
          notes: `${saleData.notes || ''} [Restauré le ${format(new Date(), 'dd/MM/yyyy HH:mm', { locale: fr })}]`.trim()
        });

      if (error) throw error;

      toast({
        title: 'Vente restaurée',
        description: 'La vente a été restaurée avec succès',
      });

      setSelectedLog(null);
      fetchLogs();
    } catch (error: any) {
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de restaurer la vente',
        variant: 'destructive'
      });
    } finally {
      setRestoring(false);
    }
  };

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'all' && log.action !== filterAction) return false;
    if (filterUser !== 'all' && log.user_email !== filterUser) return false;
    if (search && !log.user_email.toLowerCase().includes(search.toLowerCase()) &&
        !log.table_name.toLowerCase().includes(search.toLowerCase())) return false;
    
    // Date range filtering
    if (dateFrom || dateTo) {
      const logDate = new Date(log.created_at);
      if (dateFrom && dateTo) {
        if (!isWithinInterval(logDate, { start: startOfDay(dateFrom), end: endOfDay(dateTo) })) return false;
      } else if (dateFrom) {
        if (logDate < startOfDay(dateFrom)) return false;
      } else if (dateTo) {
        if (logDate > endOfDay(dateTo)) return false;
      }
    }
    
    return true;
  });

  const uniqueUsers = Array.from(new Set(logs.map(l => l.user_email))).sort();

  const clearDateFilters = () => {
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const clearAllFilters = () => {
    setFilterAction('all');
    setFilterUser('all');
    setSearch('');
    setDateFrom(undefined);
    setDateTo(undefined);
  };

  const getActionBadge = (action: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "secondary"; color: string }> = {
      INSERT: { variant: 'default', color: 'text-success' },
      UPDATE: { variant: 'secondary', color: 'text-info' },
      DELETE: { variant: 'destructive', color: 'text-destructive' }
    };
    return variants[action] || { variant: 'secondary', color: '' };
  };

  return (
    <Card className="modern-card animate-gentle-fade-in">
      <CardHeader>
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-gradient-to-br from-orange/10 to-orange/5">
            <Shield className="h-5 w-5 text-orange" />
          </div>
          <div>
            <CardTitle>Journal d'audit</CardTitle>
            <CardDescription>
              Toutes les modifications effectuées sur les ventes
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Filtres */}
        <div className="flex flex-col gap-4 mb-6">
          {/* Row 1: Search and action filters */}
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Rechercher..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={filterAction} onValueChange={setFilterAction}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les actions</SelectItem>
                <SelectItem value="INSERT">Création</SelectItem>
                <SelectItem value="UPDATE">Modification</SelectItem>
                <SelectItem value="DELETE">Suppression</SelectItem>
              </SelectContent>
            </Select>

            <Select value={filterUser} onValueChange={setFilterUser}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Utilisateur" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les utilisateurs</SelectItem>
                {uniqueUsers.map(user => (
                  <SelectItem key={user} value={user}>
                    {user}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Row 2: Date filters */}
          <div className="flex flex-col md:flex-row gap-4 items-end">
            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Date début</label>
              <Popover open={dateFromOpen} onOpenChange={setDateFromOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateFrom && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateFrom ? format(dateFrom, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateFrom}
                    onSelect={(date) => {
                      setDateFrom(date);
                      setDateFromOpen(false);
                    }}
                    onTodaySelect={(date) => {
                      setDateFrom(date);
                      setDateFromOpen(false);
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Date fin</label>
              <Popover open={dateToOpen} onOpenChange={setDateToOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-[180px] justify-start text-left font-normal",
                      !dateTo && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dateTo ? format(dateTo, "dd/MM/yyyy", { locale: fr }) : "Sélectionner"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dateTo}
                    onSelect={(date) => {
                      setDateTo(date);
                      setDateToOpen(false);
                    }}
                    onTodaySelect={(date) => {
                      setDateTo(date);
                      setDateToOpen(false);
                    }}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {(dateFrom || dateTo) && (
              <Button variant="ghost" size="sm" onClick={clearDateFilters} className="h-10">
                <X className="h-4 w-4 mr-1" />
                Effacer dates
              </Button>
            )}

            {(filterAction !== 'all' || filterUser !== 'all' || search || dateFrom || dateTo) && (
              <Button variant="outline" size="sm" onClick={clearAllFilters} className="h-10">
                Réinitialiser filtres
              </Button>
            )}
          </div>
        </div>

        {/* Tableau des logs */}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Utilisateur</TableHead>
                <TableHead>Rôle</TableHead>
                <TableHead>Action</TableHead>
                <TableHead>Table</TableHead>
                <TableHead>ID Enregistrement</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    Chargement...
                  </TableCell>
                </TableRow>
              ) : filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    <div className="flex flex-col items-center gap-2">
                      <AlertCircle className="h-8 w-8 text-muted-foreground/50" />
                      <span>Aucun log trouvé</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow 
                    key={log.id} 
                    className="cursor-pointer hover:bg-muted/50 transition-colors"
                    onClick={() => setSelectedLog(log)}
                  >
                    <TableCell className="whitespace-nowrap">
                      {format(new Date(log.created_at), 'dd/MM/yyyy HH:mm:ss', { locale: fr })}
                    </TableCell>
                    <TableCell className="font-medium">{log.user_email}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="capitalize">
                        {log.user_role}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge 
                        variant={getActionBadge(log.action).variant}
                        className={getActionBadge(log.action).color}
                      >
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-mono text-sm">{log.table_name}</TableCell>
                    <TableCell className="font-mono text-sm text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <span>{log.record_id?.slice(0, 8)}...</span>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="mt-4 text-sm text-muted-foreground">
          Affichage de {filteredLogs.length} log(s) sur {logs.length}
        </div>
      </CardContent>

      {/* Details Dialog */}
      <Dialog open={!!selectedLog} onOpenChange={(open) => !open && setSelectedLog(null)}>
        <DialogContent className="max-w-3xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Détails de la modification
            </DialogTitle>
            <DialogDescription>
              {selectedLog && (
                <span>
                  {format(new Date(selectedLog.created_at), "dd MMMM yyyy 'à' HH:mm:ss", { locale: fr })} 
                  {' '}par {selectedLog.user_email}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>

          {selectedLog && (
            <ScrollArea className="max-h-[60vh]">
              <div className="space-y-4">
                {/* Action info */}
                <div className="flex items-center gap-4 p-3 bg-muted/50 rounded-lg">
                  <Badge variant={getActionBadge(selectedLog.action).variant}>
                    {selectedLog.action === 'INSERT' ? 'Création' : 
                     selectedLog.action === 'UPDATE' ? 'Modification' : 'Suppression'}
                  </Badge>
                  <span className="text-sm text-muted-foreground">
                    Table: <span className="font-mono">{selectedLog.table_name}</span>
                  </span>
                  <span className="text-sm text-muted-foreground">
                    ID: <span className="font-mono">{selectedLog.record_id}</span>
                  </span>
                </div>

                {/* Values comparison */}
                {selectedLog.action === 'UPDATE' && selectedLog.old_values && selectedLog.new_values ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Modifications apportées :</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/4">Champ</TableHead>
                            <TableHead className="w-[37.5%]">Ancienne valeur</TableHead>
                            <TableHead className="w-[37.5%]">Nouvelle valeur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.keys(selectedLog.new_values).map((key) => {
                            const oldVal = selectedLog.old_values?.[key];
                            const newVal = selectedLog.new_values?.[key];
                            const hasChanged = JSON.stringify(oldVal) !== JSON.stringify(newVal);
                            
                            if (!hasChanged && key !== 'updated_at') return null;
                            
                            return (
                              <TableRow key={key} className={hasChanged ? 'bg-yellow-50/50' : ''}>
                                <TableCell className="font-medium text-sm">
                                  {FIELD_LABELS[key] || key}
                                </TableCell>
                                <TableCell className="text-sm text-muted-foreground">
                                  {formatValue(oldVal)}
                                </TableCell>
                                <TableCell className="text-sm">
                                  <div className="flex items-center gap-2">
                                    {hasChanged && <ArrowRight className="h-3 w-3 text-primary" />}
                                    <span className={hasChanged ? 'font-medium text-primary' : ''}>
                                      {formatValue(newVal)}
                                    </span>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : selectedLog.action === 'INSERT' && selectedLog.new_values ? (
                  <div className="space-y-3">
                    <h4 className="font-medium text-sm">Données créées :</h4>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/3">Champ</TableHead>
                            <TableHead>Valeur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(selectedLog.new_values).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium text-sm">
                                {FIELD_LABELS[key] || key}
                              </TableCell>
                              <TableCell className="text-sm">
                                {formatValue(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : selectedLog.action === 'DELETE' && selectedLog.old_values ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-medium text-sm">Données supprimées :</h4>
                      {selectedLog.table_name === 'insurance_sales' && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setConfirmRestore(true)}
                          disabled={restoring}
                          className="text-primary hover:text-primary"
                        >
                          {restoring ? (
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                          ) : (
                            <RotateCcw className="h-4 w-4 mr-2" />
                          )}
                          Restaurer cette vente
                        </Button>
                      )}
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-1/3">Champ</TableHead>
                            <TableHead>Valeur</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {Object.entries(selectedLog.old_values).map(([key, value]) => (
                            <TableRow key={key}>
                              <TableCell className="font-medium text-sm">
                                {FIELD_LABELS[key] || key}
                              </TableCell>
                              <TableCell className="text-sm text-destructive">
                                {formatValue(value)}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    Aucune donnée détaillée disponible pour cet enregistrement.
                  </div>
                )}
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmRestore} onOpenChange={setConfirmRestore}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirmer la restauration</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir restaurer cette vente ? Une nouvelle entrée sera créée avec les données d'origine.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={restoring}>Annuler</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (selectedLog) {
                  restoreSale(selectedLog);
                  setConfirmRestore(false);
                }
              }}
              disabled={restoring}
            >
              {restoring ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <RotateCcw className="h-4 w-4 mr-2" />
              )}
              Restaurer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}

// Helper function to format values for display
function formatValue(value: any): string {
  if (value === null || value === undefined) return '-';
  if (typeof value === 'boolean') return value ? 'Oui' : 'Non';
  if (typeof value === 'number') {
    // Check if it looks like a currency amount
    if (value >= 1 && value <= 100000) {
      return `${value.toFixed(2)} €`;
    }
    return value.toString();
  }
  if (typeof value === 'string') {
    // Check if it's a date
    if (/^\d{4}-\d{2}-\d{2}/.test(value)) {
      try {
        return format(new Date(value), 'dd/MM/yyyy HH:mm', { locale: fr });
      } catch {
        return value;
      }
    }
    return value;
  }
  return JSON.stringify(value);
}
