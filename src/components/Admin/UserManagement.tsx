import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Shield, User as UserIcon, Users as UsersIcon, Trash2, UserX, KeyRound, Pencil, Eye, EyeOff } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';
import { useToast } from '@/hooks/use-toast';

export function UserManagement() {
  const { users, updateUserRole, removeUser, deleteUserPermanently, updateUserEmail, updateUser, updatePassword, loading } = useUsers();
  const { toast } = useToast();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

  const [editUser, setEditUser] = useState<{ id: string; email: string; full_name: string } | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formPassword, setFormPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (confirm(`Confirmer le changement de rôle vers "${newRole}" ?`)) {
      await updateUserRole(userId, newRole);
    }
  };

  const handleDeactivate = async (userId: string) => {
    await removeUser(userId);
  };

  const handleDeletePermanently = async (userId: string) => {
    setDeletingUserId(userId);
    try {
      await deleteUserPermanently(userId);
    } finally {
      setDeletingUserId(null);
    }
  };

  const openEdit = (user: { id: string; email: string; full_name: string }) => {
    setEditUser(user);
    setFormName(user.full_name);
    setFormEmail(user.email);
    setFormPassword('');
    setShowPassword(false);
  };

  const closeEdit = () => {
    setEditUser(null);
    setFormName('');
    setFormEmail('');
    setFormPassword('');
  };

  const handleSaveCredentials = async () => {
    if (!editUser) return;
    const nameChanged = formName.trim() && formName.trim() !== editUser.full_name;
    const emailChanged = formEmail.trim() && formEmail.trim().toLowerCase() !== editUser.email.toLowerCase();
    const passwordChanged = formPassword.trim().length > 0;

    if (!nameChanged && !emailChanged && !passwordChanged) {
      toast({ title: 'Aucune modification', description: 'Aucun champ n\'a été modifié.' });
      return;
    }

    if (emailChanged) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formEmail.trim())) {
        toast({ title: '❌ Email invalide', variant: 'destructive' });
        return;
      }
    }

    setSaving(true);
    try {
      if (nameChanged) {
        await updateUser(editUser.id, { full_name: formName.trim() });
      }
      if (emailChanged) {
        await updateUserEmail(editUser.id, formEmail.trim());
      }
      if (passwordChanged) {
        await updatePassword(editUser.id, formPassword);
      }
      closeEdit();
    } catch {
      // toasts already handled
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <Card className="modern-card animate-gentle-fade-in">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-gradient-to-br from-success/10 to-success/5">
                <UsersIcon className="h-5 w-5 text-success" />
              </div>
              <div>
                <CardTitle>Gestion des utilisateurs</CardTitle>
                <CardDescription>
                  {users.length} utilisateur{users.length > 1 ? 's' : ''} enregistré{users.length > 1 ? 's' : ''}
                </CardDescription>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email (Identifiant)</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">{user.full_name}</TableCell>
                      <TableCell className="text-muted-foreground">
                        <span className="truncate max-w-[220px] inline-block align-middle">{user.email}</span>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                          className="font-semibold"
                        >
                          {user.role === 'admin' ? (
                            <><Shield className="mr-1 h-3 w-3" />Admin</>
                          ) : (
                            <><UserIcon className="mr-1 h-3 w-3" />User</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        {format(new Date(user.created_at), 'dd/MM/yyyy', { locale: fr })}
                      </TableCell>
                      <TableCell>
                        <Badge variant={user.is_active ? 'default' : 'outline'}>
                          {user.is_active ? 'Actif' : 'Inactif'}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Select
                            value={user.role}
                            onValueChange={(value) => handleRoleChange(user.id, value as 'user' | 'admin')}
                          >
                            <SelectTrigger className="w-[100px] hover:border-primary transition-colors">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="user">User</SelectItem>
                              <SelectItem value="admin">Admin</SelectItem>
                            </SelectContent>
                          </Select>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => openEdit({ id: user.id, email: user.email, full_name: user.full_name })}
                            title="Modifier les identifiants"
                            className="h-8 w-8"
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>

                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => handleDeactivate(user.id)}
                            title={user.is_active ? 'Désactiver' : 'Réactiver'}
                            className="h-8 w-8"
                          >
                            <UserX className="h-4 w-4" />
                          </Button>

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="destructive"
                                size="icon"
                                title="Supprimer définitivement"
                                className="h-8 w-8"
                                disabled={deletingUserId === user.id}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Supprimer définitivement ?</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Cette action est <strong>irréversible</strong>. L'utilisateur <strong>{user.full_name}</strong> ({user.email}) sera supprimé définitivement ainsi que toutes ses données associées.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annuler</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeletePermanently(user.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Supprimer définitivement
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
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

      {/* Dialog modification des identifiants */}
      <Dialog open={!!editUser} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <KeyRound className="h-5 w-5" />
              Modifier les identifiants
            </DialogTitle>
            <DialogDescription>
              Mettre à jour le nom, l'email ou le mot de passe de <strong>{editUser?.full_name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label>Nom complet</Label>
              <Input
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                placeholder="Prénom Nom"
              />
            </div>
            <div className="space-y-2">
              <Label>Email (identifiant de connexion)</Label>
              <Input
                type="email"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                placeholder="nouveau@email.com"
              />
            </div>
            <div className="space-y-2">
              <Label>Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="Laisser vide pour ne pas modifier"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword((v) => !v)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Min. 8 caractères, 1 majuscule, 1 minuscule, 1 chiffre, 1 caractère spécial.
              </p>
            </div>
            <p className="text-xs text-muted-foreground">
              ⚠️ Les champs vides ou inchangés seront ignorés.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeEdit} disabled={saving}>Annuler</Button>
            <Button onClick={handleSaveCredentials} disabled={saving}>
              {saving ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
