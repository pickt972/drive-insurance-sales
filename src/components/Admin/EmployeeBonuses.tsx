import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { PlusCircle, DollarSign, CheckCircle, Clock, XCircle, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Bonus {
  id: string;
  user_id: string;
  period_start: string;
  period_end: string;
  total_sales: number | null;
  total_amount: number | null;
  total_commission: number | null;
  achievement_percent: number | null;
  bonus_rate: number | null;
  bonus_amount: number | null;
  status: string | null;
  notes: string | null;
  approved_at: string | null;
  approved_by: string | null;
  paid_at: string | null;
  created_at: string | null;
  profiles?: {
    full_name: string;
    email: string;
  };
}

interface Profile {
  id: string;
  full_name: string;
  email: string;
}

export function EmployeeBonuses() {
  const { toast } = useToast();
  const [bonuses, setBonuses] = useState<Bonus[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedBonus, setSelectedBonus] = useState<Bonus | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    user_id: '',
    period_start: '',
    period_end: '',
    total_sales: '',
    total_amount: '',
    total_commission: '',
    achievement_percent: '',
    bonus_rate: '',
    bonus_amount: '',
    notes: '',
  });

  useEffect(() => {
    fetchBonuses();
    fetchProfiles();
  }, []);

  const fetchBonuses = async () => {
    try {
      const { data, error } = await supabase
        .from('bonuses')
        .select(`
          *,
          profiles!bonuses_user_id_fkey (
            full_name,
            email
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBonuses(data as Bonus[] || []);
    } catch (error) {
      console.error('Error fetching bonuses:', error);
    }
  };

  const fetchProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .eq('role', 'user')
        .eq('is_active', true)
        .order('full_name');

      if (error) throw error;
      setProfiles(data || []);
    } catch (error) {
      console.error('Error fetching profiles:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      user_id: '',
      period_start: '',
      period_end: '',
      total_sales: '',
      total_amount: '',
      total_commission: '',
      achievement_percent: '',
      bonus_rate: '',
      bonus_amount: '',
      notes: '',
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const bonusData = {
        user_id: formData.user_id,
        period_start: formData.period_start,
        period_end: formData.period_end,
        total_sales: formData.total_sales ? parseInt(formData.total_sales) : null,
        total_amount: formData.total_amount ? parseFloat(formData.total_amount) : null,
        total_commission: formData.total_commission ? parseFloat(formData.total_commission) : null,
        achievement_percent: formData.achievement_percent ? parseFloat(formData.achievement_percent) : null,
        bonus_rate: formData.bonus_rate ? parseFloat(formData.bonus_rate) : null,
        bonus_amount: formData.bonus_amount ? parseFloat(formData.bonus_amount) : null,
        notes: formData.notes || null,
        status: 'pending',
      };

      const { error } = await supabase
        .from('bonuses')
        .insert([bonusData]);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: 'Prime créée avec succès',
      });

      await fetchBonuses();
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error creating bonus:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de créer la prime',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const updateBonusStatus = async (id: string, newStatus: string) => {
    try {
      const updateData: any = { status: newStatus };
      
      if (newStatus === 'approved') {
        const { data: { user } } = await supabase.auth.getUser();
        updateData.approved_at = new Date().toISOString();
        updateData.approved_by = user?.id;
      } else if (newStatus === 'paid') {
        updateData.paid_at = new Date().toISOString();
      }

      const { error } = await supabase
        .from('bonuses')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Statut mis à jour: ${getStatusLabel(newStatus)}`,
      });

      await fetchBonuses();
    } catch (error) {
      console.error('Error updating bonus status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de mettre à jour le statut',
        variant: 'destructive',
      });
    }
  };

  const getStatusLabel = (status: string | null) => {
    switch (status) {
      case 'pending': return 'En attente';
      case 'approved': return 'Approuvée';
      case 'paid': return 'Payée';
      case 'rejected': return 'Refusée';
      default: return 'Inconnu';
    }
  };

  const getStatusBadge = (status: string | null) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="gap-1"><Clock className="h-3 w-3" /> En attente</Badge>;
      case 'approved':
        return <Badge className="gap-1 bg-info"><CheckCircle className="h-3 w-3" /> Approuvée</Badge>;
      case 'paid':
        return <Badge className="gap-1 bg-success"><DollarSign className="h-3 w-3" /> Payée</Badge>;
      case 'rejected':
        return <Badge variant="destructive" className="gap-1"><XCircle className="h-3 w-3" /> Refusée</Badge>;
      default:
        return <Badge variant="outline">Inconnu</Badge>;
    }
  };

  const filteredBonuses = statusFilter === 'all' 
    ? bonuses 
    : bonuses.filter(b => b.status === statusFilter);

  const totalPending = bonuses.filter(b => b.status === 'pending').reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
  const totalApproved = bonuses.filter(b => b.status === 'approved').reduce((sum, b) => sum + (b.bonus_amount || 0), 0);
  const totalPaid = bonuses.filter(b => b.status === 'paid').reduce((sum, b) => sum + (b.bonus_amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">En attente</p>
                <p className="text-2xl font-bold text-warning">{totalPending.toFixed(2)} €</p>
              </div>
              <Clock className="h-8 w-8 text-warning" />
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Approuvées</p>
                <p className="text-2xl font-bold text-info">{totalApproved.toFixed(2)} €</p>
              </div>
              <CheckCircle className="h-8 w-8 text-info" />
            </div>
          </CardContent>
        </Card>
        <Card className="modern-card">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Payées</p>
                <p className="text-2xl font-bold text-success">{totalPaid.toFixed(2)} €</p>
              </div>
              <DollarSign className="h-8 w-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Card */}
      <Card className="modern-card animate-gentle-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-success/5">
                <DollarSign className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Primes des employés</CardTitle>
                <CardDescription>
                  Suivi et gestion des primes versées aux employés
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Filtrer" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                  <SelectItem value="approved">Approuvées</SelectItem>
                  <SelectItem value="paid">Payées</SelectItem>
                  <SelectItem value="rejected">Refusées</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button onClick={() => resetForm()} className="modern-button">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Nouvelle prime
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg">
                  <form onSubmit={handleSubmit}>
                    <DialogHeader>
                      <DialogTitle>Nouvelle prime</DialogTitle>
                      <DialogDescription>
                        Créer une prime pour un employé
                      </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                      <div className="space-y-2">
                        <Label>Employé <span className="text-destructive">*</span></Label>
                        <Select 
                          value={formData.user_id} 
                          onValueChange={(value) => setFormData({ ...formData, user_id: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Sélectionner un employé" />
                          </SelectTrigger>
                          <SelectContent>
                            {profiles.map((profile) => (
                              <SelectItem key={profile.id} value={profile.id}>
                                {profile.full_name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Début période <span className="text-destructive">*</span></Label>
                          <Input
                            type="date"
                            value={formData.period_start}
                            onChange={(e) => setFormData({ ...formData, period_start: e.target.value })}
                            required
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Fin période <span className="text-destructive">*</span></Label>
                          <Input
                            type="date"
                            value={formData.period_end}
                            onChange={(e) => setFormData({ ...formData, period_end: e.target.value })}
                            required
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Nb ventes</Label>
                          <Input
                            type="number"
                            value={formData.total_sales}
                            onChange={(e) => setFormData({ ...formData, total_sales: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>CA total (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.total_amount}
                            onChange={(e) => setFormData({ ...formData, total_amount: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Commission (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.total_commission}
                            onChange={(e) => setFormData({ ...formData, total_commission: e.target.value })}
                            placeholder="0.00"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Atteinte objectif (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.achievement_percent}
                            onChange={(e) => setFormData({ ...formData, achievement_percent: e.target.value })}
                            placeholder="100"
                          />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Taux bonus (%)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.bonus_rate}
                            onChange={(e) => setFormData({ ...formData, bonus_rate: e.target.value })}
                            placeholder="0"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Montant prime (€) <span className="text-destructive">*</span></Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.bonus_amount}
                            onChange={(e) => setFormData({ ...formData, bonus_amount: e.target.value })}
                            placeholder="0.00"
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label>Notes</Label>
                        <Textarea
                          value={formData.notes}
                          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                          placeholder="Commentaires..."
                          rows={2}
                        />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                        Annuler
                      </Button>
                      <Button type="submit" disabled={loading} className="modern-button">
                        {loading ? 'Création...' : 'Créer'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {filteredBonuses.length === 0 ? (
            <div className="text-center py-12">
              <DollarSign className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-2">Aucune prime trouvée</p>
              <p className="text-sm text-muted-foreground">
                Créez une nouvelle prime pour commencer
              </p>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Employé</TableHead>
                    <TableHead>Période</TableHead>
                    <TableHead className="text-right">Montant</TableHead>
                    <TableHead className="text-right">Atteinte</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBonuses.map((bonus) => (
                    <TableRow key={bonus.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {bonus.profiles?.full_name || 'N/A'}
                      </TableCell>
                      <TableCell className="text-sm">
                        {format(new Date(bonus.period_start), 'dd/MM/yy', { locale: fr })} - {format(new Date(bonus.period_end), 'dd/MM/yy', { locale: fr })}
                      </TableCell>
                      <TableCell className="text-right font-semibold text-success">
                        {bonus.bonus_amount?.toFixed(2) || '0.00'} €
                      </TableCell>
                      <TableCell className="text-right">
                        {bonus.achievement_percent ? (
                          <Badge variant="outline" className="font-mono">
                            {bonus.achievement_percent.toFixed(0)}%
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">-</span>
                        )}
                      </TableCell>
                      <TableCell>{getStatusBadge(bonus.status)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedBonus(bonus)}
                            className="hover:bg-primary/10"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          {bonus.status === 'pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateBonusStatus(bonus.id, 'approved')}
                                className="text-info hover:bg-info/10"
                              >
                                Approuver
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => updateBonusStatus(bonus.id, 'rejected')}
                                className="text-destructive hover:bg-destructive/10"
                              >
                                Refuser
                              </Button>
                            </>
                          )}
                          {bonus.status === 'approved' && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateBonusStatus(bonus.id, 'paid')}
                              className="text-success hover:bg-success/10"
                            >
                              Marquer payée
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <Dialog open={!!selectedBonus} onOpenChange={() => setSelectedBonus(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails de la prime</DialogTitle>
          </DialogHeader>
          {selectedBonus && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Employé</Label>
                  <p className="font-medium">{selectedBonus.profiles?.full_name}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Statut</Label>
                  <div className="mt-1">{getStatusBadge(selectedBonus.status)}</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Période</Label>
                  <p>{format(new Date(selectedBonus.period_start), 'dd/MM/yyyy', { locale: fr })} - {format(new Date(selectedBonus.period_end), 'dd/MM/yyyy', { locale: fr })}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Montant prime</Label>
                  <p className="text-xl font-bold text-success">{selectedBonus.bonus_amount?.toFixed(2)} €</p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label className="text-muted-foreground">Ventes</Label>
                  <p>{selectedBonus.total_sales || '-'}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">CA</Label>
                  <p>{selectedBonus.total_amount?.toFixed(2) || '-'} €</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Commission</Label>
                  <p>{selectedBonus.total_commission?.toFixed(2) || '-'} €</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Atteinte objectif</Label>
                  <p>{selectedBonus.achievement_percent?.toFixed(0) || '-'}%</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Taux bonus</Label>
                  <p>{selectedBonus.bonus_rate?.toFixed(0) || '-'}%</p>
                </div>
              </div>
              {selectedBonus.notes && (
                <div>
                  <Label className="text-muted-foreground">Notes</Label>
                  <p className="text-sm">{selectedBonus.notes}</p>
                </div>
              )}
              {selectedBonus.approved_at && (
                <div>
                  <Label className="text-muted-foreground">Approuvée le</Label>
                  <p className="text-sm">{format(new Date(selectedBonus.approved_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
              )}
              {selectedBonus.paid_at && (
                <div>
                  <Label className="text-muted-foreground">Payée le</Label>
                  <p className="text-sm">{format(new Date(selectedBonus.paid_at), 'dd/MM/yyyy HH:mm', { locale: fr })}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
