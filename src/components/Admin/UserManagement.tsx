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
import { Shield, User as UserIcon, Users as UsersIcon } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

export function UserManagement() {
  const { users, updateUserRole, loading } = useUsers();

  const handleRoleChange = async (userId: string, newRole: 'user' | 'admin') => {
    if (confirm(`Confirmer le changement de rôle vers "${newRole}" ?`)) {
      await updateUserRole(userId, newRole);
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
                      <Select
                        value={user.role}
                        onValueChange={(value) => handleRoleChange(user.id, value as 'user' | 'admin')}
                      >
                        <SelectTrigger className="w-[120px] hover:border-primary transition-colors">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="admin">Admin</SelectItem>
                        </SelectContent>
                      </Select>
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
