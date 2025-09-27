import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Settings, Plus, Euro, Users, Trash2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";

export const AdminPanel = () => {
  const [newUsername, setNewUsername] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<'admin' | 'employee'>('employee');
  const [loading, setLoading] = useState(false);
  
  const { users, addUser, updateUserRole, removeUser, fetchUsers } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newUsername || !newEmail || !newPassword) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    const result = await addUser(newUsername, newEmail, newPassword, newRole);
    
    if (result.success) {
      setNewUsername("");
      setNewEmail("");
      setNewPassword("");
      setNewRole('employee');
    }
    
    setLoading(false);
  };

  const handleRoleChange = async (username: string, currentRole: 'admin' | 'employee') => {
    const newRole = currentRole === 'admin' ? 'employee' : 'admin';
    await updateUserRole(username, newRole);
  };

  const handleRemoveUser = async (username: string) => {
    if (window.confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${username} ?`)) {
      await removeUser(username);
    }
  };

  return (
    <div className="space-y-6">
      {/* Gestion des utilisateurs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Gestion des Utilisateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAddUser} className="space-y-4 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div>
                <Label htmlFor="username">Nom d'utilisateur</Label>
                <Input
                  id="username"
                  value={newUsername}
                  onChange={(e) => setNewUsername(e.target.value)}
                  placeholder="Ex: vendeur3"
                />
              </div>
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="vendeur3@aloelocation.com"
                />
              </div>
              <div>
                <Label htmlFor="password">Mot de passe</Label>
                <Input
                  id="password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              <div>
                <Label htmlFor="role">Rôle</Label>
                <select
                  id="role"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as 'admin' | 'employee')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="employee">Employé</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full" disabled={loading}>
                  <Plus className="h-4 w-4 mr-2" />
                  {loading ? "Ajout..." : "Ajouter"}
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="font-medium">Utilisateurs existants</h3>
            {users.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div>
                    <div className="font-medium">{user.username}</div>
                    <div className="text-sm text-muted-foreground">{user.email}</div>
                  </div>
                  <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                    {user.role === 'admin' ? 'Admin' : 'Employé'}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleRoleChange(user.username, user.role)}
                  >
                    {user.role === 'admin' ? 'Rétrograder' : 'Promouvoir'}
                  </Button>
                  {user.username !== 'admin' && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleRemoveUser(user.username)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Gestion des assurances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Types d'Assurances
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <h3 className="font-medium">Types d'assurances disponibles</h3>
            {[
              { name: 'Assurance Annulation', commission: 15.00 },
              { name: 'Assurance Bagages', commission: 12.50 },
              { name: 'Assurance Médicale', commission: 20.00 },
              { name: 'Assurance Responsabilité Civile', commission: 8.00 },
              { name: 'Assurance Vol/Perte', commission: 10.00 },
              { name: 'Assurance Rapatriement', commission: 18.00 }
            ].map((insurance, index) => (
              <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{insurance.name}</span>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  <span>{insurance.commission.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Statistiques système */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            Statistiques Système
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-primary">{users.length}</div>
              <div className="text-sm text-muted-foreground">Utilisateurs</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-success">6</div>
              <div className="text-sm text-muted-foreground">Types d'assurances</div>
            </div>
            <div className="p-4 border rounded-lg text-center">
              <div className="text-2xl font-bold text-warning">LocalStorage</div>
              <div className="text-sm text-muted-foreground">Base de données</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
                />
              </div>
              <div className="flex items-end">
                <Button type="submit" className="w-full">
                  <Plus className="h-4 w-4 mr-2" />
                  Ajouter
                </Button>
              </div>
            </div>
          </form>

          <div className="space-y-3">
            <h3 className="font-medium">Assurances existantes</h3>
            {insuranceTypes.map((insurance) => (
              <div key={insurance.id} className="flex items-center justify-between p-3 border rounded-lg">
                <span className="font-medium">{insurance.name}</span>
                <div className="flex items-center gap-2">
                  <Euro className="h-4 w-4" />
                  <span>{insurance.commission.toFixed(2)} €</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};