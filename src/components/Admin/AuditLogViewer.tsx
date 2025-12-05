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
import { Shield, Search, AlertCircle, CalendarIcon, X } from 'lucide-react';
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
  old_data?: any;
  new_data?: any;
}

export function AuditLogViewer() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterAction, setFilterAction] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [search, setSearch] = useState('');
  const [dateFrom, setDateFrom] = useState<Date | undefined>(undefined);
  const [dateTo, setDateTo] = useState<Date | undefined>(undefined);
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
              <Popover>
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
                    onSelect={setDateFrom}
                    locale={fr}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-sm text-muted-foreground">Date fin</label>
              <Popover>
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
                    onSelect={setDateTo}
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
                  <TableRow key={log.id}>
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
                      {log.record_id?.slice(0, 8)}...
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
    </Card>
  );
}
