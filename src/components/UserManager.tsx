import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { User, Users, Plus, Trash2, Key, Settings, Shield, Eye, EyeOff, Image, Upload } from "lucide-react";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useNavigate } from "react-router-dom";

export const UserManager = () => {
  const { users, addUser, removeUser, updatePassword, updateRole, usersLoading, fetchUsers } = useSupabaseAuth();
  const navigate = useNavigate();
  const [newUsername, setNewUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "employee">("employee");
  const [passwordChangeUser, setPasswordChangeUser] = useState("");
  const [newPasswordChange, setNewPasswordChange] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showNewPasswordChange, setShowNewPasswordChange] = useState(false);
  const [roleChangeUser, setRoleChangeUser] = useState("");
  const [newRoleChange, setNewRoleChange] = useState<"admin" | "employee">("employee");
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem('app-logo') || '/lovable-uploads/eb56420e-3e12-4ccc-acb0-00c755b5ab58.png');
  const [appName, setAppName] = useState(localStorage.getItem('app-name') || 'Aloe Location');
  const { toast } = useToast();

  const handleAddUser = async () => {
    if (!newUsername || !newPassword) {
      toast({
        title: "Erreur",
        description: "Nom d'utilisateur et mot de passe requis",
        variant: "destructive",
      });
      return;
    }

    if (newUsername.length < 3) {
      toast({
        title: "Erreur",
        description: "Le nom d'utilisateur doit contenir au moins 3 caractères",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    // Générer un email automatiquement basé sur le nom d'utilisateur
    const email = `${newUsername.toLowerCase()}@aloelocation.com`;
    const result = await addUser(newUsername, email, newPassword, newRole);
    
    if (result.success) {
      setNewUsername("");
      setNewPassword("");
      setNewRole("employee");
      // Recharger la liste des utilisateurs
      await fetchUsers();
    }
  };

  const handleRemoveUser = async (username: string) => {
    const result = await removeUser(username);
    
    if (result.success) {
      // Recharger la liste des utilisateurs
      await fetchUsers();
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordChangeUser || !newPasswordChange) {
      toast({
        title: "Erreur",
        description: "Utilisateur et nouveau mot de passe requis",
        variant: "destructive",
      });
      return;
    }

    if (newPasswordChange.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères",
        variant: "destructive",
      });
      return;
    }

    const result = await updatePassword(passwordChangeUser, newPasswordChange);
    
    if (result.success) {
      setPasswordChangeUser("");
      setNewPasswordChange("");
    }
  };

  const handleRoleChange = async () => {
    if (!roleChangeUser) {
      toast({
        title: "Erreur",
        description: "Utilisateur requis",
        variant: "destructive",
      });
      return;
    }

    const result = await updateRole(roleChangeUser, newRoleChange);
    
    if (result.success) {
      setRoleChangeUser("");
      setNewRoleChange("employee");
      // Recharger la liste des utilisateurs
      await fetchUsers();
    }
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newLogoUrl = e.target.value;
    setLogoUrl(newLogoUrl);
    localStorage.setItem('app-logo', newLogoUrl);
    toast({
      title: "Logo mis à jour",
      description: "Le logo de l'application a été modifié avec succès.",
    });
  };

  const handleAppNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newAppName = e.target.value;
    setAppName(newAppName);
    localStorage.setItem('app-name', newAppName);
    toast({
      title: "Nom mis à jour", 
      description: "Le nom de l'application a été modifié avec succès.",
    });
  };

  const employeeUsers = users.filter(u => u.role === "employee");
  const totalUsers = users.length;

  return (
    <Card className="shadow-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Gestion des Utilisateurs
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Access restriction notice */}
        <Alert className="border-primary/20 bg-primary/5">
          <Shield className="h-4 w-4 text-primary" />
          <AlertDescription>
            <strong>Application privée</strong> - Accès restreint à l'équipe Aloe Location uniquement. 
            L'inscription publique est désactivée pour la sécurité.
          </AlertDescription>
        </Alert>

        {/* Section Paramètres de l'Application en première position */}
        <div className="space-y-4 p-4 bg-accent/30 rounded-lg border">
          <h3 className="font-medium flex items-center gap-2">
            <Settings className="h-4 w-4" />
            Paramètres de l'Application
          </h3>
          
          {/* App Name */}
          <div className="space-y-2">
            <Label htmlFor="app-name">Nom de l'application</Label>
            <Input
              id="app-name"
              value={appName}
              onChange={handleAppNameChange}
              placeholder="Nom affiché sur la page de connexion"
            />
            <p className="text-xs text-muted-foreground">
              Ce nom sera affiché comme titre sur la page de connexion.
            </p>
          </div>

          {/* Logo Management */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Logo de l'application</Label>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg overflow-hidden bg-white p-1 shadow-lg ring-1 ring-gray-200">
                <img 
                  src={logoUrl} 
                  alt="Logo actuel" 
                  className="w-full h-full object-contain"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = '/placeholder.svg';
                  }}
                />
              </div>
              <div className="flex-1">
                <div className="flex gap-2">
                  <Input
                    value={logoUrl}
                    onChange={handleLogoChange}
                    placeholder="URL de l'image ou chemin vers le fichier"
                    className="flex-1"
                  />
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const input = document.createElement('input');
                      input.type = 'file';
                      input.accept = 'image/*';
                      input.onchange = (e) => {
                        const file = (e.target as HTMLInputElement).files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (event) => {
                            const result = event.target?.result as string;
                            setLogoUrl(result);
                            localStorage.setItem('app-logo', result);
                          };
                          reader.readAsDataURL(file);
                        }
                      };
                      input.click();
                    }}
                  >
                    Choisir
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  URL d'une image ou sélectionnez un fichier local
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Users summary */}
        <Alert>
          <Users className="h-4 w-4" />
          <AlertDescription>
            <strong>{totalUsers} utilisateurs</strong> au total : 1 administrateur et {employeeUsers.length} employé(s)
          </AlertDescription>
        </Alert>

        {/* Admin tools */}
        <div className="flex gap-2">
          <Button
            onClick={() => navigate('/admin/reset-password')}
            variant="outline"
            className="flex items-center gap-2"
          >
            <Shield className="h-4 w-4" />
            Réinitialisation Admin
          </Button>
        </div>

          <div className="space-y-4">
            <h3 className="font-medium">Utilisateurs actuels</h3>
            {usersLoading ? (
              <div className="text-center py-4">Chargement...</div>
            ) : (
              <div className="space-y-3">
                {users.map((user) => (
                  <div key={user.username} className="flex items-center justify-between p-3 border rounded-lg bg-card">
                    <div className="flex items-center gap-3">
                      <User className="h-4 w-4 text-muted-foreground" />
                      <div>
                        <div className="font-medium">{user.username}</div>
                        <div className="text-sm text-muted-foreground">
                          {user.role === "admin" ? "Administrateur" : "Employé"}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {user.role === "admin" && (
                        <span className="px-2 py-1 bg-primary/10 text-primary rounded-full text-xs">
                          Admin
                        </span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveUser(user.username)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>


        <Separator />

        {/* Add new user */}
        <div className="space-y-4">
          <h3 className="font-medium">Ajouter un nouvel utilisateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="new-username">Nom d'utilisateur</Label>
              <Input
                id="new-username"
                value={newUsername}
                onChange={(e) => setNewUsername(e.target.value)}
                placeholder="Nom de l'employé"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                >
                  {showNewPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role">Rôle</Label>
              <Select value={newRole} onValueChange={(value: "admin" | "employee") => setNewRole(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employé</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                onClick={handleAddUser}
                className="w-full bg-gradient-primary hover:bg-primary-hover"
              >
                <Plus className="mr-2 h-4 w-4" />
                Ajouter
              </Button>
            </div>
          </div>
        </div>

        <Separator />

        {/* Change password */}
        <div className="space-y-4">
          <h3 className="font-medium">Changer un mot de passe</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="password-user">Utilisateur</Label>
              <Select value={passwordChangeUser} onValueChange={setPasswordChangeUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.username} value={user.username}>
                      {user.username} ({user.role === "admin" ? "Admin" : "Employé"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password-change">Nouveau mot de passe</Label>
              <div className="relative">
                <Input
                  id="new-password-change"
                  type={showNewPasswordChange ? "text" : "password"}
                  value={newPasswordChange}
                  onChange={(e) => setNewPasswordChange(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowNewPasswordChange(!showNewPasswordChange)}
                >
                  {showNewPasswordChange ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
          </div>
          <Button
            onClick={handlePasswordChange}
            variant="outline"
            className="w-full md:w-auto"
          >
            <Key className="mr-2 h-4 w-4" />
            Changer le mot de passe
          </Button>
        </div>

        <Separator />

        {/* Change role */}
        <div className="space-y-4">
          <h3 className="font-medium">Changer le rôle d'un utilisateur</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="role-user">Utilisateur</Label>
              <Select value={roleChangeUser} onValueChange={setRoleChangeUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.username} value={user.username}>
                      {user.username} ({user.role === "admin" ? "Admin" : "Employé"})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-role-change">Nouveau rôle</Label>
              <Select value={newRoleChange} onValueChange={(value: "admin" | "employee") => setNewRoleChange(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="employee">Employé</SelectItem>
                  <SelectItem value="admin">Administrateur</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={handleRoleChange}
            variant="outline"
            className="w-full md:w-auto"
          >
            <Settings className="mr-2 h-4 w-4" />
            Changer le rôle
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};