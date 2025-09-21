import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Shield, 
  Plus, 
  Trash2, 
  Edit3, 
  Save, 
  X,
  Euro,
  RefreshCw 
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  is_active: boolean;
  created_at: string;
}

export const InsuranceManagement: React.FC = () => {
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [newInsurance, setNewInsurance] = useState({
    name: '',
    commission: 0
  });
  const [editInsurance, setEditInsurance] = useState({
    name: '',
    commission: 0
  });

  const fetchInsuranceTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('insurance_types')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setInsuranceTypes(data || []);
    } catch (error: any) {
      console.error('Error fetching insurance types:', error);
      const msg = (error?.code || error?.message || '').toString().toLowerCase();
      const isTransient = msg.includes('pgrst002') || msg.includes('schema cache') || msg.includes('service unavailable') || msg.includes('503');
      if (!isTransient) {
        toast({
          title: "Erreur",
          description: "Impossible de charger les types d'assurance",
          variant: "destructive",
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newInsurance.name || newInsurance.commission <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs avec des valeurs valides",
        variant: "destructive",
      });
      return;
    }

    try {
      setCreating(true);
      
      const { error } = await supabase
        .from('insurance_types')
        .insert({
          name: newInsurance.name,
          commission: newInsurance.commission
        });

      if (error) throw error;

      toast({
        title: "Type d'assurance créé",
        description: `${newInsurance.name} a été créé avec succès`,
      });

      // Reset form
      setNewInsurance({
        name: '',
        commission: 0
      });

      // Refresh list
      fetchInsuranceTypes();
    } catch (error) {
      console.error('Error creating insurance type:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer le type d'assurance",
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleEditInsurance = (insurance: InsuranceType) => {
    setEditingId(insurance.id);
    setEditInsurance({
      name: insurance.name,
      commission: insurance.commission
    });
  };

  const handleSaveEdit = async (id: string) => {
    if (!editInsurance.name || editInsurance.commission <= 0) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs avec des valeurs valides",
        variant: "destructive",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({
          name: editInsurance.name,
          commission: editInsurance.commission
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Type d'assurance modifié",
        description: "Les modifications ont été enregistrées",
      });

      setEditingId(null);
      fetchInsuranceTypes();
    } catch (error) {
      console.error('Error updating insurance type:', error);
      toast({
        title: "Erreur",
        description: "Impossible de modifier le type d'assurance",
        variant: "destructive",
      });
    }
  };

  const handleDeleteInsurance = async (id: string, name: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir supprimer "${name}" ?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Type d'assurance supprimé",
        description: `${name} a été désactivé`,
      });

      fetchInsuranceTypes();
    } catch (error) {
      console.error('Error deleting insurance type:', error);
      toast({
        title: "Erreur",
        description: "Impossible de supprimer le type d'assurance",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    fetchInsuranceTypes();
  }, []);

  return (
    <div className="space-y-6">
      {/* Create Insurance Form */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Créer un type d'assurance
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreateInsurance} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Nom de l'assurance</Label>
                <Input
                  id="name"
                  value={newInsurance.name}
                  onChange={(e) => setNewInsurance({ ...newInsurance, name: e.target.value })}
                  placeholder="Ex: Assurance annulation"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="commission">Commission (€)</Label>
                <Input
                  id="commission"
                  type="number"
                  step="0.01"
                  min="0"
                  value={newInsurance.commission}
                  onChange={(e) => setNewInsurance({ ...newInsurance, commission: parseFloat(e.target.value) || 0 })}
                  placeholder="0.00"
                  required
                />
              </div>
            </div>

            <Button type="submit" disabled={creating} className="w-full">
              {creating ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  Création...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Créer le type d'assurance
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Insurance Types List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Types d'assurance existants
            </CardTitle>
            <Button variant="outline" onClick={fetchInsuranceTypes} disabled={loading}>
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <LoadingSpinner size="lg" />
            </div>
          ) : insuranceTypes.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Aucun type d'assurance trouvé</p>
            </div>
          ) : (
            <div className="space-y-3">
              {insuranceTypes.map((insurance) => (
                <div 
                  key={insurance.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  {editingId === insurance.id ? (
                    <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 mr-3">
                      <Input
                        value={editInsurance.name}
                        onChange={(e) => setEditInsurance({ ...editInsurance, name: e.target.value })}
                        placeholder="Nom de l'assurance"
                      />
                      <Input
                        type="number"
                        step="0.01"
                        min="0"
                        value={editInsurance.commission}
                        onChange={(e) => setEditInsurance({ ...editInsurance, commission: parseFloat(e.target.value) || 0 })}
                        placeholder="Commission"
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => handleSaveEdit(insurance.id)}
                          className="flex-1"
                        >
                          <Save className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setEditingId(null)}
                          className="flex-1"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div>
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{insurance.name}</span>
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Euro className="h-3 w-3" />
                            {insurance.commission.toFixed(2)}
                          </Badge>
                          {!insurance.is_active && (
                            <Badge variant="destructive">Inactif</Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Créé le {new Date(insurance.created_at).toLocaleDateString('fr-FR')}
                        </p>
                      </div>
                      
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEditInsurance(insurance)}
                        >
                          <Edit3 className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDeleteInsurance(insurance.id, insurance.name)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};