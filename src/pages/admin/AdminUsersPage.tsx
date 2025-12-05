import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { UserPlus, Search, CheckCircle, XCircle, Edit, MoreHorizontal, Eye, EyeOff, KeyRound, GripVertical, Filter, Trash2 } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { validatePassword } from '@/lib/passwordValidation';
import { PasswordStrengthIndicator } from '@/components/PasswordStrengthIndicator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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

interface User {
  id: string;
  email: string;
  full_name: string;
  role: string;
  agency: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

interface EditFormData {
  full_name: string;
  email: string;
  agency: string;
  phone: string;
  role: 'admin' | 'user';
}

interface CreateFormData {
  username: string;
  full_name: string;
  password: string;
  agency: string;
  phone: string;
  role: 'admin' | 'user';
}

// Sortable row component
function SortableUserRow({ 
  user, 
  children 
}: { 
  user: User; 
  children: React.ReactNode;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: user.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style} className={isDragging ? 'bg-muted' : ''}>
      <TableCell style={{ width: '50px', minWidth: '50px' }} className="px-2">
        <button 
          {...attributes} 
          {...listeners} 
          className="cursor-grab active:cursor-grabbing p-2 hover:bg-gray-100 rounded flex items-center justify-center"
          title="Glisser pour réordonner"
        >
          <GripVertical className="h-5 w-5 text-gray-600" />
        </button>
      </TableCell>
      {children}
    </TableRow>
  );
}

export function AdminUsersPage() {
  const { session } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [resetPasswordDialogOpen, setResetPasswordDialogOpen] = useState(false);
  const [userToResetPassword, setUserToResetPassword] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<EditFormData>({
    full_name: '',
    email: '',
    agency: '',
    phone: '',
    role: 'user',
  });
  const [createFormData, setCreateFormData] = useState<CreateFormData>({
    username: '',
    full_name: '',
    password: '',
    agency: '',
    phone: '',
    role: 'user',
  });
  const { toast } = useToast();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    loadUsers();
  }, []);

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setUsers((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const loadUsers = async () => {
    try {
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error loading users:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de charger les utilisateurs',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setFormData({
      full_name: user.full_name || '',
      email: user.email || '',
      agency: user.agency || '',
      phone: user.phone || '',
      role: (user.role as 'admin' | 'user') || 'user',
    });
    setEditDialogOpen(true);
  };

  const openCreateDialog = () => {
    setCreateFormData({
      username: '',
      full_name: '',
      password: '',
      agency: '',
      phone: '',
      role: 'user',
    });
    setShowPassword(false);
    setCreateDialogOpen(true);
  };

  const handleFormChange = (field: keyof EditFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCreateFormChange = (field: keyof CreateFormData, value: string) => {
    setCreateFormData(prev => ({ ...prev, [field]: value }));
  };

  const createUser = async () => {
    if (!createFormData.username.trim()) {
      toast({
        title: 'Erreur',
        description: 'Le nom d\'utilisateur est requis',
        variant: 'destructive',
      });
      return;
    }

    const passwordValidation = validatePassword(createFormData.password);
    if (!passwordValidation.isValid) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe ne respecte pas toutes les règles de sécurité',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('create-user', {
        body: {
          username: createFormData.username.trim(),
          full_name: createFormData.full_name.trim() || createFormData.username.trim(),
          password: createFormData.password,
          role: createFormData.role,
          agency: createFormData.agency || null,
          phone: createFormData.phone || null,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la création');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la création');
      }

      toast({
        title: 'Succès',
        description: `Utilisateur "${createFormData.username}" créé avec succès`,
      });

      setCreateDialogOpen(false);
      loadUsers();
    } catch (error: any) {
      console.error('Error creating user:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de créer l\'utilisateur',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const saveUser = async () => {
    if (!editingUser) return;
    
    setSaving(true);
    try {
      const supabaseAny = supabase as any;
      
      // Update profile
      const { error: profileError } = await supabaseAny
        .from('profiles')
        .update({
          full_name: formData.full_name,
          agency: formData.agency || null,
          phone: formData.phone || null,
          role: formData.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingUser.id);

      if (profileError) throw profileError;

      // Update user_roles table for security
      await supabaseAny
        .from('user_roles')
        .delete()
        .eq('user_id', editingUser.id);

      await supabaseAny
        .from('user_roles')
        .upsert({
          user_id: editingUser.id,
          role: formData.role,
        }, { onConflict: 'user_id,role' });

      toast({
        title: 'Succès',
        description: 'Utilisateur modifié avec succès',
      });
      
      setEditDialogOpen(false);
      setEditingUser(null);
      loadUsers();
    } catch (error) {
      console.error('Error saving user:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de sauvegarder les modifications',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const updateUserRole = async (userId: string, newRole: 'admin' | 'user') => {
    try {
      const supabaseAny = supabase as any;
      
      const { error: profileError } = await supabaseAny
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (profileError) throw profileError;

      await supabaseAny
        .from('user_roles')
        .delete()
        .eq('user_id', userId);

      await supabaseAny
        .from('user_roles')
        .insert({ user_id: userId, role: newRole });

      toast({
        title: 'Succès',
        description: 'Rôle modifié avec succès',
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le rôle',
        variant: 'destructive',
      });
    }
  };

  const toggleUserActive = async (userId: string, isActive: boolean) => {
    try {
      const supabaseAny = supabase as any;
      const { error } = await supabaseAny
        .from('profiles')
        .update({ is_active: !isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: 'Succès',
        description: `Utilisateur ${!isActive ? 'activé' : 'désactivé'} avec succès`,
      });
      
      loadUsers();
    } catch (error) {
      console.error('Error toggling user status:', error);
      toast({
        title: 'Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
    }
  };

  const confirmDelete = (user: User) => {
    setUserToDelete(user);
    setDeleteDialogOpen(true);
  };

  const deleteUser = async () => {
    if (!userToDelete) return;

    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const response = await supabase.functions.invoke('delete-user', {
        body: { userId: userToDelete.id },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la suppression');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la suppression');
      }

      toast({
        title: 'Succès',
        description: 'Utilisateur supprimé définitivement',
      });
      
      setDeleteDialogOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (error: any) {
      console.error('Error deleting user:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de supprimer l\'utilisateur',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const openResetPasswordDialog = (user: User) => {
    setUserToResetPassword(user);
    setNewPassword('');
    setShowNewPassword(false);
    setResetPasswordDialogOpen(true);
  };

  const resetPassword = async () => {
    if (!userToResetPassword) return;

    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      toast({
        title: 'Erreur',
        description: 'Le mot de passe ne respecte pas toutes les règles de sécurité',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      const response = await supabase.functions.invoke('reset-user-password', {
        body: {
          user_id: userToResetPassword.id,
          new_password: newPassword,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || 'Erreur lors de la réinitialisation');
      }

      if (!response.data?.success) {
        throw new Error(response.data?.error || 'Erreur lors de la réinitialisation');
      }

      toast({
        title: 'Succès',
        description: `Mot de passe réinitialisé pour "${userToResetPassword.full_name}"`,
      });

      setResetPasswordDialogOpen(false);
      setUserToResetPassword(null);
      setNewPassword('');
    } catch (error: any) {
      console.error('Error resetting password:', error);
      toast({
        title: 'Erreur',
        description: error.message || 'Impossible de réinitialiser le mot de passe',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = searchTerm === '' ||
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.agency?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'active' && user.is_active) ||
      (statusFilter === 'inactive' && !user.is_active);
    
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Gestion des utilisateurs</h2>
          <p className="text-gray-600">Gérer les comptes et permissions</p>
        </div>
        <Button onClick={openCreateDialog}>
          <UserPlus className="h-4 w-4 mr-2" />
          Nouvel utilisateur
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{users.length}</div>
            <p className="text-sm text-gray-600">Total utilisateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">
              {users.filter(u => u.is_active).length}
            </div>
            <p className="text-sm text-gray-600">Actifs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-red-600">
              {users.filter(u => u.role === 'admin').length}
            </div>
            <p className="text-sm text-gray-600">Administrateurs</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">
              {users.filter(u => u.role === 'user').length}
            </div>
            <p className="text-sm text-gray-600">Employés</p>
          </CardContent>
        </Card>
      </div>

      {/* User Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex-1 min-w-[200px] max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Rechercher par nom, email ou agence..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <Select value={statusFilter} onValueChange={(v: 'all' | 'active' | 'inactive') => setStatusFilter(v)}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tous</SelectItem>
                  <SelectItem value="active">Actifs</SelectItem>
                  <SelectItem value="inactive">Inactifs</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead style={{ width: '50px', minWidth: '50px' }}></TableHead>
                    <TableHead>Nom complet</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Téléphone</TableHead>
                    <TableHead>Rôle</TableHead>
                    <TableHead>Agence</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Date création</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredUsers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8">
                        Aucun utilisateur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    <SortableContext items={filteredUsers.map(u => u.id)} strategy={verticalListSortingStrategy}>
                      {filteredUsers.map((user) => (
                        <SortableUserRow key={user.id} user={user}>
                          <TableCell className="font-medium">{user.full_name}</TableCell>
                          <TableCell className="text-sm text-gray-600">{user.email}</TableCell>
                          <TableCell className="text-sm text-gray-600">{user.phone || '-'}</TableCell>
                          <TableCell>
                            <Select
                              value={user.role}
                              onValueChange={(value: 'admin' | 'user') => updateUserRole(user.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="user">Employé</SelectItem>
                                <SelectItem value="admin">Admin</SelectItem>
                              </SelectContent>
                            </Select>
                          </TableCell>
                          <TableCell>{user.agency || '-'}</TableCell>
                          <TableCell>
                            {user.is_active ? (
                              <Badge className="bg-green-100 text-green-800">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Actif
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="h-3 w-3 mr-1" />
                                Inactif
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-sm text-gray-600">
                            {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openEditDialog(user)}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Modifier
                                </DropdownMenuItem>
                                <DropdownMenuItem 
                                  onClick={() => toggleUserActive(user.id, user.is_active)}
                                >
                                  {user.is_active ? (
                                    <>
                                      <XCircle className="h-4 w-4 mr-2" />
                                      Désactiver
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="h-4 w-4 mr-2" />
                                      Activer
                                    </>
                                  )}
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => openResetPasswordDialog(user)}>
                                  <KeyRound className="h-4 w-4 mr-2" />
                                  Réinitialiser mot de passe
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem 
                                  onClick={() => confirmDelete(user)}
                                  className="text-destructive"
                                >
                                  <Trash2 className="h-4 w-4 mr-2" />
                                  Supprimer définitivement
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </SortableUserRow>
                      ))}
                    </SortableContext>
                  )}
                </TableBody>
              </Table>
            </div>
          </DndContext>
        </CardContent>
      </Card>

      {/* Create User Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Créer un utilisateur</DialogTitle>
            <DialogDescription>
              Remplissez les informations pour créer un nouvel utilisateur.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="create_username">Nom d'utilisateur *</Label>
              <Input
                id="create_username"
                value={createFormData.username}
                onChange={(e) => handleCreateFormChange('username', e.target.value)}
                placeholder="jean.dupont"
              />
              <p className="text-xs text-gray-500">
                L'email sera : {createFormData.username.trim() || 'username'}@aloelocation.internal
              </p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create_full_name">Nom complet</Label>
              <Input
                id="create_full_name"
                value={createFormData.full_name}
                onChange={(e) => handleCreateFormChange('full_name', e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create_password">Mot de passe *</Label>
              <div className="relative">
                <Input
                  id="create_password"
                  type={showPassword ? 'text' : 'password'}
                  value={createFormData.password}
                  onChange={(e) => handleCreateFormChange('password', e.target.value)}
                  placeholder="Mot de passe sécurisé"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <PasswordStrengthIndicator password={createFormData.password} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create_phone">Téléphone</Label>
              <Input
                id="create_phone"
                value={createFormData.phone}
                onChange={(e) => handleCreateFormChange('phone', e.target.value)}
                placeholder="+596 696 12 34 56"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create_agency">Agence</Label>
              <Select
                value={createFormData.agency}
                onValueChange={(value) => handleCreateFormChange('agency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une agence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trinité">Trinité</SelectItem>
                  <SelectItem value="Le Lamentin">Le Lamentin</SelectItem>
                  <SelectItem value="Fort-de-France">Fort-de-France</SelectItem>
                  <SelectItem value="Saint-Pierre">Saint-Pierre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="create_role">Rôle</Label>
              <Select
                value={createFormData.role}
                onValueChange={(value) => handleCreateFormChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Employé</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={createUser} disabled={saving}>
              {saving ? 'Création...' : 'Créer l\'utilisateur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Modifier l'utilisateur</DialogTitle>
            <DialogDescription>
              Modifiez les informations de l'utilisateur ci-dessous.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="full_name">Nom complet</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => handleFormChange('full_name', e.target.value)}
                placeholder="Jean Dupont"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="bg-gray-100"
              />
              <p className="text-xs text-gray-500">L'email ne peut pas être modifié</p>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="phone">Téléphone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleFormChange('phone', e.target.value)}
                placeholder="+596 696 12 34 56"
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="agency">Agence</Label>
              <Select
                value={formData.agency}
                onValueChange={(value) => handleFormChange('agency', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner une agence" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Trinité">Trinité</SelectItem>
                  <SelectItem value="Le Lamentin">Le Lamentin</SelectItem>
                  <SelectItem value="Fort-de-France">Fort-de-France</SelectItem>
                  <SelectItem value="Saint-Pierre">Saint-Pierre</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="role">Rôle</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleFormChange('role', value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Employé</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={saveUser} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer définitivement</AlertDialogTitle>
            <AlertDialogDescription>
              Êtes-vous sûr de vouloir supprimer définitivement l'utilisateur "{userToDelete?.full_name}" ?
              Cette action est irréversible et toutes les données associées seront perdues.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={deleteUser} disabled={saving} className="bg-destructive hover:bg-destructive/90">
              {saving ? 'Suppression...' : 'Supprimer définitivement'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Password Dialog */}
      <Dialog open={resetPasswordDialogOpen} onOpenChange={setResetPasswordDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Réinitialiser le mot de passe</DialogTitle>
            <DialogDescription>
              Définissez un nouveau mot de passe pour {userToResetPassword?.full_name}.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="new_password">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new_password"
                  type={showNewPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Mot de passe sécurisé"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <PasswordStrengthIndicator password={newPassword} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setResetPasswordDialogOpen(false)}>
              Annuler
            </Button>
            <Button onClick={resetPassword} disabled={saving || !validatePassword(newPassword).isValid}>
              {saving ? 'Réinitialisation...' : 'Réinitialiser'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
