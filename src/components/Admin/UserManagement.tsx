import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { Shield, User as UserIcon, Users as UsersIcon, Trash2, UserX, Mail, Pencil } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

export function UserManagement() {
  const { users, updateUserRole, removeUser, deleteUserPermanently, updateUserEmail, loading } = useUsers();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);
  const [editEmailUser, setEditEmailUser] = useState<{ id: string; email: string; name: string } | null>(null);
  const [newEmail, setNewEmail] = useState('');
  const [savingEmail, setSavingEmail] = useState(false);

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

  const handleEditEmail = (user: { id: string; email: string; full_name: string }) => {
    setEditEmailUser({ id: user.id, email: user.email, name: user.full_name });
    setNewEmail(user.email);
  };

  const handleSaveEmail = async () => {
    if (!editEmailUser || !newEmail.trim()) return;
    setSavingEmail(true);
    try {
      await updateUserEmail(editEmailUser.id, newEmail.trim());
      setEditEmailUser(null);
    } catch {
      // toast already handled in hook
    } finally {
      setSavingEmail(false);
    }
  };

  const getIdentifier = (email: string) => {
    if (email.endsWith('@aloelocation.internal')) {
      return email.split('@')[0];
    }
    return email.split('@')[0];
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
                  <TableHead>Identifiant</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Date création</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      Aucun utilisateur
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                      <TableCell className="font-medium">
                        {user.full_name}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono text-xs">
                          {getIdentifier(user.email)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <span className="truncate max-w-[180px]">{user.email}</span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6 shrink-0"
                            onClick={() => handleEditEmail(user)}
                            title="Modifier l'email"
                          >
                            <Pencil className="h-3 w-3" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={user.role === 'admin' ? 'destructive' : 'secondary'}
                          className="font-semibold"
                        >
                          {user.role === 'admin' ? (
                            <>
                              <Shield className="mr-1 h-3 w-3" />
                              Admin
                            </>
                          ) : (
                            <>
                              <UserIcon className="mr-1 h-3 w-3" />
                              User
                            </>
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
                            onClick={() => handleDeactivate(user.id)}
                            title={user.is_active ? "Désactiver" : "Réactiver"}
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

      {/* Dialog modification email */}
      <Dialog open={!!editEmailUser} onOpenChange={(open) => !open && setEditEmailUser(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Mail className="h-5 w-5" />
              Modifier l'email
            </DialogTitle>
            <DialogDescription>
              Modifier l'adresse email de <strong>{editEmailUser?.name}</strong>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Nouvel email</label>
              <Input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                placeholder="nouveau@email.com"
              />
              <p className="text-xs text-muted-foreground">
                ⚠️ L'identifiant de connexion sera mis à jour automatiquement.
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditEmailUser(null)}>
              Annuler
            </Button>
            <Button onClick={handleSaveEmail} disabled={savingEmail || !newEmail.trim()}>
              {savingEmail ? 'Enregistrement...' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
