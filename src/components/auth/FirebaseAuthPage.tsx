import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader as Loader2, User, Lock, Eye, EyeOff, LogIn, UserPlus } from "lucide-react";
import { useFirebaseAuth } from "@/hooks/useFirebaseAuth";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

export const FirebaseAuthPage = () => {
  const [appName, setAppName] = useState(localStorage.getItem('app-name') || 'Aloe Location');
  const [logoUrl, setLogoUrl] = useState(localStorage.getItem('app-logo') || '/lovable-uploads/eb56420e-3e12-4ccc-acb0-00c755b5ab58.png');
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUsers, setCreatingUsers] = useState(false);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    user, 
    loading: authLoading, 
    signInWithUsername,
    addUser,
    fetchUsers,
    users
  } = useFirebaseAuth();

  // Sync app name & logo with localStorage updates
  useEffect(() => {
    const refresh = () => {
      setAppName(localStorage.getItem('app-name') || 'Aloe Location');
      setLogoUrl(localStorage.getItem('app-logo') || '/lovable-uploads/eb56420e-3e12-4ccc-acb0-00c755b5ab58.png');
    };

    const onStorage = (e: StorageEvent) => {
      if (!e.key || e.key === 'app-name' || e.key === 'app-logo') {
        refresh();
      }
    };

    const onCustomUpdate = () => refresh();

    window.addEventListener('storage', onStorage);
    window.addEventListener('app-settings-updated', onCustomUpdate as EventListener);

    return () => {
      window.removeEventListener('storage', onStorage);
      window.removeEventListener('app-settings-updated', onCustomUpdate as EventListener);
    };
  }, []);

  useEffect(() => {
    // Rediriger si déjà authentifié
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    // Charger les utilisateurs au démarrage
    fetchUsers();
  }, []);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const result = await signInWithUsername(username, password);

      if (!result.success) {
        setError(result.error || "Erreur de connexion");
        return;
      }

      // Redirection gérée par useEffect
    } catch (error: any) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const createDefaultUsers = async () => {
    setCreatingUsers(true);
    try {
      const defaultUsers = [
        { username: 'admin', email: 'admin@aloelocation.com', password: 'Admin123!', role: 'admin' as const },
        { username: 'Julie', email: 'julie@aloelocation.com', password: 'Julie123!', role: 'employee' as const },
        { username: 'Sherman', email: 'sherman@aloelocation.com', password: 'Sherman123!', role: 'employee' as const },
        { username: 'Alvin', email: 'alvin@aloelocation.com', password: 'Alvin123!', role: 'employee' as const },
        { username: 'Stef', email: 'stef@aloelocation.com', password: 'Wilfried972', role: 'admin' as const }
      ];

      let successCount = 0;
      for (const userData of defaultUsers) {
        const result = await addUser(userData.username, userData.email, userData.password, userData.role);
        if (result.success) {
          successCount++;
        }
      }

      toast({
        title: "Utilisateurs créés",
        description: `${successCount}/${defaultUsers.length} utilisateurs créés avec succès`,
      });
      
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message || "Erreur lors de la création des utilisateurs.",
        variant: "destructive",
      });
    } finally {
      setCreatingUsers(false);
    }
  };

  // Afficher un loader pendant l'initialisation de l'auth
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <div className="mx-auto w-32 h-32 rounded-lg overflow-hidden bg-white p-2 shadow-lg ring-1 ring-gray-200 mb-4">
            <img 
              src={logoUrl} 
              alt={`${appName} - logo`} 
              className="w-full h-full object-contain"
              loading="lazy"
              decoding="async"
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder.svg';
              }}
            />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            {appName}
          </CardTitle>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom d'utilisateur
              </Label>
              <Input
                id="signin-username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Entrez votre nom d'utilisateur"
              />
            </div>
                
            <div className="space-y-2">
              <Label htmlFor="signin-password" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="signin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                <>
                  <LogIn className="mr-2 h-4 w-4" />
                  Se connecter
                </>
              )}
            </Button>
          </form>

          {users.length === 0 && (
            <div className="mt-4 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Aucun utilisateur disponible.
              </p>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={createDefaultUsers}
                disabled={creatingUsers}
              >
                {creatingUsers ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Création...
                  </>
                ) : (
                  <>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Créer les utilisateurs par défaut
                  </>
                )}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};