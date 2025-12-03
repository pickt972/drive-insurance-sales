import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Plus, Edit, Trash2, GripVertical } from 'lucide-react';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface InsuranceType {
  id: string;
  name: string;
  code: string;
  description: string;
  base_price: number;
  price_type: 'forfait' | 'per_day';
  commission_rate: number;
  commission_amount: number;
  is_active: boolean;
  display_order: number;
}

// Sortable row component
function SortableInsuranceRow({ 
  type, 
  children 
}: { 
  type: InsuranceType; 
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: type.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : ''}>
      <TableCell className="w-8">
        <button {...attributes} {...listeners} className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded">
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

export function AdminInsuranceTypesPage() {
  const [types, setTypes] = useState<InsuranceType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingType, setEditingType] = useState<InsuranceType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const [formData, setFormData] = useState({
    name: '',
    code: '',
    description: '',
    base_price: 0,
    price_type: 'forfait' as 'forfait' | 'per_day',
    commission_rate: 15,
    commission_amount: 0,
    display_order: 0,
  });

  useEffect(() => {
    loadTypes();
  }, []);

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      const oldIndex = types.findIndex((t) => t.id === active.id);
      const newIndex = types.findIndex((t) => t.id === over.id);
      const newTypes = arrayMove(types, oldIndex, newIndex);
      setTypes(newTypes);
      
      // Update display_order in database
      const supabaseAny = supabase as any;
      for (let i = 0; i < newTypes.length; i++) {
        await supabaseAny.from('insurance_types').update({ display_order: i }).eq('id', newTypes[i].id);
      }
    }
  };

  const loadTypes = async () => {
    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from('insurance_types')
        .select('*')
        .order('display_order');

      if (error) throw error;
      setTypes(data || []);
    } catch (error) {
      console.error('Error loading types:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const supabaseAny = supabase as any;
      
      if (editingType) {
        const { error } = await supabaseAny
          .from('insurance_types')
          .update({
            ...formData,
            base_price: Number(formData.base_price),
            commission_rate: Number(formData.commission_rate),
            commission_amount: Number(formData.commission_amount),
            display_order: Number(formData.display_order),
          })
          .eq('id', editingType.id);

        if (error) throw error;
        
        toast({
          title: 'Succès',
          description: 'Type d\'assurance modifié',
        });
      } else {
        const { error } = await supabaseAny
          .from('insurance_types')
          .insert({
            ...formData,
            base_price: Number(formData.base_price),
            commission_rate: Number(formData.commission_rate),
            commission_amount: Number(formData.commission_amount),
            display_order: Number(formData.display_order),
            created_by: user?.id,
            is_active: true,
          });

        if (error) throw error;
        
        toast({
          title: 'Succès',
          description: 'Type d\'assurance créé',
        });
      }

      setIsDialogOpen(false);
      setEditingType(null);
      setFormData({
        name: '',
        code: '',
        description: '',
        base_price: 0,
        price_type: 'forfait',
        commission_rate: 15,
        commission_amount: 0,
        display_order: 0,
      });
      loadTypes();
    } catch (error) {
      console.error('Error saving type:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder',
        variant: 'destructive',
      });
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from('insurance_types')
        .update({ is_active: !isActive })
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Succès',
        description: `Type ${!isActive ? 'activé' : 'désactivé'}`,
      });
      
      loadTypes();
    } catch (error) {
      console.error('Error toggling type:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const deleteType = async (id: string, name: string) => {
    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from('insurance_types')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast({
        title: 'Supprimé',
        description: `Type "${name}" supprimé définitivement`,
      });
      
      loadTypes();
    } catch (error) {
      console.error('Error deleting type:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de supprimer ce type (peut-être utilisé dans des ventes)',
        variant: 'destructive',
      });
    }
  };

  const startEdit = (type: InsuranceType) => {
    setEditingType(type);
    setFormData({
      name: type.name,
      code: type.code,
      description: type.description || '',
      base_price: type.base_price,
      price_type: type.price_type || 'forfait',
      commission_rate: type.commission_rate,
      commission_amount: type.commission_amount || 0,
      display_order: type.display_order,
    });
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Types d'assurance</h2>
          <p className="text-gray-600">Gérer les produits d'assurance</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => {
              setEditingType(null);
              setFormData({
                name: '',
                code: '',
                description: '',
                base_price: 0,
                price_type: 'forfait',
                commission_rate: 15,
                commission_amount: 0,
                display_order: 0,
              });
            }}>
              <Plus className="h-4 w-4 mr-2" />
              Nouveau type
            </Button>
          </DialogTrigger>
          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>
                  {editingType ? 'Modifier' : 'Nouveau'} type d'assurance
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div>
                  <Label htmlFor="name">Nom *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="code">Code *</Label>
                  <Input
                    id="code"
                    value={formData.code}
                    onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="base_price">Prix de base (€)</Label>
                    <Input
                      id="base_price"
                      type="number"
                      step="0.01"
                      value={formData.base_price}
                      onChange={(e) => setFormData({ ...formData, base_price: parseFloat(e.target.value) })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="price_type">Type de prix</Label>
                    <select
                      id="price_type"
                      value={formData.price_type}
                      onChange={(e) => setFormData({ ...formData, price_type: e.target.value as 'forfait' | 'per_day' })}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    >
                      <option value="forfait">Forfait (prix fixe)</option>
                      <option value="per_day">Par jour</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="commission_rate">Taux commission (%)</Label>
                    <Input
                      id="commission_rate"
                      type="number"
                      step="0.01"
                      value={formData.commission_rate}
                      onChange={(e) => setFormData({ ...formData, commission_rate: parseFloat(e.target.value) || 0 })}
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="commission_amount">Commission fixe (€)</Label>
                  <Input
                    id="commission_amount"
                    type="number"
                    step="0.01"
                    value={formData.commission_amount}
                    onChange={(e) => setFormData({ ...formData, commission_amount: parseFloat(e.target.value) || 0 })}
                    placeholder="Si > 0, remplace le taux"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Si renseigné, ce montant sera utilisé à la place du taux en %
                  </p>
                </div>
                <div>
                  <Label htmlFor="display_order">Ordre d'affichage</Label>
                  <Input
                    id="display_order"
                    type="number"
                    value={formData.display_order}
                    onChange={(e) => setFormData({ ...formData, display_order: parseInt(e.target.value) })}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit" className="bg-red-600 hover:bg-red-700">
                  {editingType ? 'Modifier' : 'Créer'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Ordre</TableHead>
                <TableHead>Code</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Prix de base</TableHead>
                <TableHead>Type prix</TableHead>
                <TableHead>Commission</TableHead>
                <TableHead>Statut</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {types.map((type) => (
                <TableRow key={type.id}>
                  <TableCell>{type.display_order}</TableCell>
                  <TableCell className="font-mono text-sm">{type.code}</TableCell>
                  <TableCell className="font-medium">{type.name}</TableCell>
                  <TableCell>{type.base_price.toFixed(2)} €</TableCell>
                  <TableCell>
                    <Badge variant={type.price_type === 'per_day' ? 'default' : 'outline'}>
                      {type.price_type === 'per_day' ? '/jour' : 'Forfait'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <div className="inline-flex items-center gap-2 cursor-help">
                            <span className="font-medium">
                              {type.commission_amount > 0 
                                ? `${type.commission_amount.toFixed(2)} €` 
                                : `${type.commission_rate}%`}
                            </span>
                            <Badge 
                              variant={type.commission_amount > 0 ? 'default' : 'outline'}
                              className={type.commission_amount > 0 
                                ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                                : 'bg-blue-50 text-blue-700 border-blue-200'}
                            >
                              {type.commission_amount > 0 ? 'Fixe' : '%'}
                            </Badge>
                          </div>
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs space-y-1">
                            <p><strong>Montant fixe :</strong> {type.commission_amount > 0 ? `${type.commission_amount.toFixed(2)} €` : 'Non défini'}</p>
                            <p><strong>Taux (%) :</strong> {type.commission_rate}%</p>
                            <p className="text-muted-foreground pt-1 border-t mt-1">
                              {type.commission_amount > 0 
                                ? 'Le montant fixe est appliqué' 
                                : 'Le taux en % est appliqué'}
                            </p>
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </TableCell>
                  <TableCell>
                    <Badge variant={type.is_active ? 'default' : 'secondary'}>
                      {type.is_active ? 'Actif' : 'Inactif'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-2">
                      <Button variant="ghost" size="sm" onClick={() => startEdit(type)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => toggleActive(type.id, type.is_active)}
                      >
                        {type.is_active ? 'Désactiver' : 'Activer'}
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Le type d'assurance "{type.name}" sera supprimé définitivement.
                              Cette action est irréversible.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => deleteType(type.id, type.name)}
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
