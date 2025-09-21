import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, EyeOff, LogIn, RefreshCw, Key, UserPlus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CreateAdmin } from '@/components/admin/CreateAdmin';

export const LoginForm: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [usernames, setUsernames] = useState<string[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [showCreateAdmin, setShowCreateAdmin] = useState(false);
  const [resettingDatabase, setResettingDatabase] = useState(false);

  const { signIn } = useAuth();

  const fetchUsernames = async () => {
    try {
      setLoadingUsers(true);
      
      // Fallback immédiat : liste connue des utilisateurs (basée sur la BDD vérifiée)
      const knownUsers = ['admin', 'Alvin', 'Julie', 'Sherman'];
      setUsernames(knownUsers);
      setLoadingUsers(false);
      
      // Tentative en arrière-plan d'obtenir la liste à jour (sans bloquer l'UI)
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username')
          .eq('is_active', true)
          .order('username');

        if (!error && data && data.length > 0) {
          const fetchedUsernames = data.map(profile => profile.username);
          // Mise à jour uniquement si différent
          if (JSON.stringify(fetchedUsernames.sort()) !== JSON.stringify(knownUsers.sort())) {
            setUsernames(fetchedUsernames);
          }
        }
      } catch (backgroundError) {
        console.log('Background fetch failed, keeping fallback usernames:', backgroundError);
      }
    } catch (error) {
      console.error('Error in fetchUsernames:', error);
      // Garantir qu'on a toujours les utilisateurs de base
      setUsernames(['admin', 'Alvin', 'Julie', 'Sherman']);
      setLoadingUsers(false);
    }
  };

  const createDefaultUsers = async () => {
    try {
      setLoadingUsers(true);
      const { error } = await supabase.functions.invoke('create-default-users');
      
      if (error) throw error;
      
      toast({
        title: "Utilisateurs créés",
        description: "Les utilisateurs par défaut ont été créés avec succès",
      });
      
      await fetchUsernames();
    } catch (error) {
      console.error('Error creating default users:', error);
      toast({
        title: "Erreur",
        description: "Impossible de créer les utilisateurs par défaut",
        variant: "destructive",
      });
    } finally {
      setLoadingUsers(false);
    }
  };

  const createAdminUser = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('create-admin-user');
      
      if (error) throw error;
      
      if (data.success) {
        // Optimistic UI: ajouter immédiatement 'admin' et le sélectionner
        setUsernames((prev) => Array.from(new Set([...(prev || []), data.credentials.username || 'admin'])));
        setUsername(data.credentials.username || 'admin');
        
        toast({
          title: "Administrateur créé",
          description: `Identifiants: ${data.credentials.username} / ${data.credentials.password}`,
        });
        
        // Tentative de rafraîchissement (en arrière-plan)
        fetchUsernames();
      } else {
        toast({
          title: "Information",
          description: data.message,
        });
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      toast({
        title: "Erreur",
        description: "Erreur lors de la création de l'administrateur",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetDatabase = async () => {
    try {
      setResettingDatabase(true);
      const { data, error } = await supabase.functions.invoke('reset-database');
      
      if (error) throw error;
      
      if (data.success) {
        toast({
          title: "Base de données réinitialisée",
          description: "Un seul admin a été recréé. Vous pouvez maintenant vous connecter.",
        });
        
        // Rafraîchir la liste des utilisateurs
        await fetchUsernames();
        
        // Sélectionner automatiquement admin
        setUsername('admin');
      } else {
        throw new Error(data.error || 'Erreur inconnue');
      }
    } catch (error) {
      console.error('Error resetting database:', error);
      toast({
        title: "Erreur",
        description: "Impossible de réinitialiser la base de données",
        variant: "destructive",
      });
    } finally {
      setResettingDatabase(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!username) {
      toast({
        title: "Erreur",
        description: "Veuillez sélectionner un nom d'utilisateur",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase.functions.invoke('password-reset-request', {
        body: { username }
      });

      if (error) throw error;

      setResetSuccess(true);
      toast({
        title: "Demande envoyée",
        description: "Un email de réinitialisation va être envoyé à l'administrateur",
      });
    } catch (error) {
      console.error('Error requesting password reset:', error);
      toast({
        title: "Erreur",
        description: "Impossible d'envoyer la demande de réinitialisation",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez remplir tous les champs",
        variant: "destructive",
      });
      return;
    }

    try {
      setLoading(true);
      const result = await signIn(username, password);
      
      if (!result.success) {
        toast({
          title: "Erreur de connexion",
          description: result.error || "Identifiants incorrects",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Une erreur inattendue s'est produite",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsernames();
  }, []);

  return (
    <div className="space-y-6">
      {resetSuccess && (
        <Alert className="bg-success-light border-success">
          <AlertDescription className="text-success-foreground">
            Votre demande de réinitialisation a été envoyée. L'administrateur recevra un email.
          </AlertDescription>
        </Alert>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Sélection utilisateur */}
        <div className="space-y-2">
          <Label htmlFor="username">Nom d'utilisateur</Label>
          <div className="flex space-x-2">
            <Select value={username} onValueChange={setUsername} disabled={loadingUsers}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder={loadingUsers ? "Chargement..." : "Sélectionnez votre nom"} />
              </SelectTrigger>
              <SelectContent>
                {usernames.map((name) => (
                  <SelectItem key={name} value={name}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={fetchUsernames}
              disabled={loadingUsers}
            >
              <RefreshCw className={`h-4 w-4 ${loadingUsers ? 'animate-spin' : ''}`} />
            </Button>
          </div>
          
          {usernames.length === 0 && !loadingUsers && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground mb-3">
                Aucun utilisateur trouvé. Créez les utilisateurs par défaut.
              </p>
              <Button
                type="button"
                variant="outline"
                onClick={createDefaultUsers}
                disabled={loadingUsers}
                className="w-full"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${loadingUsers ? 'animate-spin' : ''}`} />
                Initialiser des utilisateurs par défaut
              </Button>
            </div>
          )}
        </div>

        {/* Mot de passe */}
        {!forgotPasswordMode && (
          <div className="space-y-2">
            <Label htmlFor="password">Mot de passe</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10"
                disabled={loading}
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
          </div>
        )}

        {/* Boutons */}
        <div className="space-y-3">
          {!forgotPasswordMode ? (
            <>
              <Button 
                type="submit" 
                className="w-full primary-button" 
                disabled={loading || !username || !password}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Connexion...
                  </>
                ) : (
                  <>
                    <LogIn className="h-4 w-4 mr-2" />
                    Se connecter
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => setForgotPasswordMode(true)}
              >
                <Key className="h-4 w-4 mr-2" />
                Mot de passe oublié ?
              </Button>

              <div className="flex gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={createAdminUser}
                  disabled={loading}
                  className="flex-1 text-sm"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {loading ? "Création..." : "Créer Admin"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  className="flex-1 text-sm"
                  onClick={() => setShowCreateAdmin(!showCreateAdmin)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {showCreateAdmin ? 'Masquer' : 'Admin personnalisé'}
                </Button>
              </div>

              <Button
                type="button"
                variant="destructive"
                onClick={resetDatabase}
                disabled={resettingDatabase}
                className="w-full text-sm"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${resettingDatabase ? 'animate-spin' : ''}`} />
                {resettingDatabase ? "Réinitialisation..." : "Réinitialiser la base (admin uniquement)"}
              </Button>
            </>
          ) : (
            <>
              <Button 
                type="button"
                onClick={handleForgotPassword}
                className="w-full primary-button" 
                disabled={loading || !username}
              >
                {loading ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Key className="h-4 w-4 mr-2" />
                    Demander une réinitialisation
                  </>
                )}
              </Button>
              
              <Button
                type="button"
                variant="ghost"
                className="w-full text-sm"
                onClick={() => {
                  setForgotPasswordMode(false);
                  setResetSuccess(false);
                }}
              >
                Retour à la connexion
              </Button>
            </>
          )}
        </div>
      </form>

      {showCreateAdmin && (
        <div className="mt-6">
          <CreateAdmin />
        </div>
      )}
    </div>
  );
};