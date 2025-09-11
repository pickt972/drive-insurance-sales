import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, Mail, Lock, User as UserIcon, Eye, EyeOff } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  
  // Liste locale d'utilisateurs pour le sélecteur
  const [userOptions, setUserOptions] = useState<{ username: string; role: string; is_active: boolean }[]>([]);
  
  const navigate = useNavigate();
  const { toast } = useToast();
  const { 
    user, 
    session, 
    loading: authLoading, 
    signInWithUsername
  } = useSupabaseAuth();

  useEffect(() => {
    const loadUsers = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('username, role, is_active')
          .eq('is_active', true)
          .order('username', { ascending: true });
        if (error) throw error;
        setUserOptions(data || []);
      } catch (e) {
        console.error('Erreur chargement utilisateurs:', e);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    // Rediriger si déjà authentifié
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);


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

  const handleForgotPassword = async () => {
    if (!username) {
      toast({
        title: "Nom d'utilisateur requis",
        description: "Veuillez sélectionner un nom d'utilisateur avant de demander la réinitialisation.",
        variant: "destructive",
      });
      return;
    }

    // Utiliser directement le nom d'utilisateur
    try {
      setSendingReset(true);
      const { error } = await supabase.functions.invoke('password-reset-request', {
        body: {
          username: username,
          origin: window.location.origin,
        },
      });
      
      if (error) throw error;
      
      toast({
        title: "Demande envoyée",
        description: "L'administrateur a été notifié par email de votre demande de réinitialisation.",
      });
    } catch (err: any) {
      toast({
        title: "Échec de l'envoi",
        description: err.message || "Impossible d'envoyer la demande. Réessayez plus tard.",
        variant: "destructive",
      });
    } finally {
      setSendingReset(false);
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
          <CardTitle className="text-2xl font-bold text-primary">
            Gestionnaire de Ventes
          </CardTitle>
          <p className="text-muted-foreground">
            Connectez-vous pour accéder à votre tableau de bord
          </p>
        </CardHeader>
        
        <CardContent>
          <form onSubmit={handleSignIn} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="signin-username" className="flex items-center gap-2">
                <UserIcon className="h-4 w-4" />
                Nom d'utilisateur
              </Label>
              <Select value={username} onValueChange={setUsername}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Sélectionner un compte" />
                </SelectTrigger>
                <SelectContent className="bg-background border shadow-lg z-50">
                  {userOptions.length > 0 ? (
                    userOptions.map((u) => (
                      <SelectItem key={u.username} value={u.username}>
                        {u.username} ({u.role === 'admin' ? 'Admin' : 'Employé'})
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem disabled value="__empty">Aucun utilisateur</SelectItem>
                  )}
                </SelectContent>
              </Select>
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
                    "Se connecter"
                  )}
            </Button>
          </form>

          <div className="mt-4 text-center">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={handleForgotPassword}
              disabled={sendingReset}
              className="text-muted-foreground hover:text-primary"
            >
              {sendingReset ? 'Envoi en cours...' : 'Mot de passe oublié ?'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};