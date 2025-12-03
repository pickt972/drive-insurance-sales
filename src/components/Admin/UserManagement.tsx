import { useUsers } from '@/hooks/useUsers';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
import { Shield, User as UserIcon, Users as UsersIcon, Trash2, UserX } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { useState } from 'react';

export function UserManagement() {
  const { users, updateUserRole, removeUser, deleteUserPermanently, loading } = useUsers();
  const [deletingUserId, setDeletingUserId] = useState<string | null>(null);

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

  return (
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
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nom</TableHead>
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
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    Aucun utilisateur
                  </TableCell>
                </TableRow>
              ) : (
                users.map((user) => (
                  <TableRow key={user.id} className="hover:bg-muted/50 transition-colors">
                    <TableCell className="font-medium">
                      {user.full_name}
                    </TableCell>
                    <TableCell className="text-muted-foreground">{user.email}</TableCell>
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
  );
}
