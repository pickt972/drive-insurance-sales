import { useState } from 'react';
import { useInsuranceTypes } from '@/hooks/useInsuranceTypes';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Badge } from '@/components/ui/badge';
import { PlusCircle, Edit, Trash2, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export function InsuranceTypesManagement() {
  const { insuranceTypes, addInsuranceType, updateInsuranceType, removeInsuranceType, loading } = useInsuranceTypes();
  const { toast } = useToast();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingType, setEditingType] = useState<any>(null);
  const [formData, setFormData] = useState({
    name: '',
    commission: '',
    description: '',
  });

  const resetForm = () => {
    setFormData({ name: '', commission: '', description: '' });
    setEditingType(null);
  };

  const handleOpenDialog = (type?: any) => {
    if (type) {
      setEditingType(type);
      setFormData({
        name: type.name,
        commission: type.commission.toString(),
        description: type.description || '',
      });
    } else {
      resetForm();
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.name || !formData.commission) {
      toast({
        title: 'Erreur',
        description: 'Veuillez remplir tous les champs obligatoires',
        variant: 'destructive',
      });
      return;
    }

    try {
      const typeData = {
        name: formData.name,
        commission: parseFloat(formData.commission),
        description: formData.description,
        is_active: true,
      };

      if (editingType) {
        await updateInsuranceType(editingType.id, typeData);
        toast({
          title: 'Succès',
          description: 'Type d\'assurance modifié avec succès',
        });
      } else {
        await addInsuranceType(typeData);
        toast({
          title: 'Succès',
          description: 'Type d\'assurance ajouté avec succès',
        });
      }

      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: 'Erreur',
        description: 'Une erreur est survenue',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Confirmer la suppression du type "${name}" ?`)) {
      try {
        await removeInsuranceType(id);
        toast({
          title: 'Succès',
          description: 'Type d\'assurance supprimé',
        });
      } catch (error) {
        toast({
          title: 'Erreur',
          description: 'Impossible de supprimer ce type',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <Card className="modern-card animate-gentle-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-info/10 to-info/5">
                <Shield className="h-5 w-5 text-info" />
              </div>
              Gestion des types d'assurance
            </CardTitle>
            <CardDescription>
              {insuranceTypes.length} type{insuranceTypes.length > 1 ? 's' : ''} configuré{insuranceTypes.length > 1 ? 's' : ''}
            </CardDescription>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                onClick={() => handleOpenDialog()}
                className="modern-button"
              >
                <PlusCircle className="mr-2 h-4 w-4" />
                Nouveau type
              </Button>
            </DialogTrigger>
            <DialogContent>
              <form onSubmit={handleSubmit}>
                <DialogHeader>
                  <DialogTitle>
                    {editingType ? 'Modifier le type' : 'Nouveau type d\'assurance'}
                  </DialogTitle>
                  <DialogDescription>
                    Configurez les informations du type d'assurance
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">
                      Nom du type <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ex: CDW, TP, PAI..."
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="commission">
                      Commission (€) <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="commission"
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.commission}
                      onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                      placeholder="Ex: 15.00"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Input
                      id="description"
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Description optionnelle"
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Annuler
                  </Button>
                  <Button type="submit" disabled={loading} className="modern-button">
                    {loading ? 'Enregistrement...' : editingType ? 'Modifier' : 'Créer'}
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Commission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {insuranceTypes.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    Aucun type d'assurance configuré
                  </TableCell>
                </TableRow>
              ) : (
                insuranceTypes.map((type) => (
                  <TableRow key={type.id}>
                    <TableCell className="font-semibold">
                      {type.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {type.description || '-'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge variant="secondary" className="font-mono">
                        {type.commission.toFixed(2)} €
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant={type.is_active ? 'default' : 'outline'}>
                        {type.is_active ? 'Actif' : 'Inactif'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(type)}
                          className="hover:bg-primary/10 hover:text-primary"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDelete(type.id, type.name)}
                          className="hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
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
