import { useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Car, User, Lock, Mail, Eye, EyeOff, UserPlus } from "lucide-react";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "/lovable-uploads/eb56420e-3e12-4ccc-acb0-00c755b5ab58.png";

export const LoginPage = () => {
  const { signInWithUsername, loading } = useSupabaseAuth();
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [creatingUsers, setCreatingUsers] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) return;
    
    setIsLoading(true);
    await signInWithUsername(username.toLowerCase().trim(), password);
    setIsLoading(false);
  };

  const handleForgotPassword = async () => {
    if (!username) {
      toast({
        title: "Nom d'utilisateur requis",
        description: "Veuillez saisir votre nom d'utilisateur.",
        variant: "destructive",
      });
      return;
    }
    try {
      setSendingReset(true);
      const { error } = await supabase.functions.invoke('password-reset-request', {
        body: {
          username: username.toLowerCase().trim(),
          origin: window.location.origin,
        },
      });
      if (error) throw error;
      setShowForgotPassword(true);
      toast({
        title: "Demande envoyée",
        description: "L'administrateur a été notifié par email.",
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

  const createDefaultUsers = async () => {
    setCreatingUsers(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-default-users');
      
      if (error) {
        throw error;
      }

      toast({
        title: "Utilisateurs créés",
        description: data.message || "Les utilisateurs par défaut ont été créés avec succès.",
      });
      
      // Afficher les détails si disponibles
      if (data.results) {
        console.log('Résultats création utilisateurs:', data.results);
      }
      
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

  return (
    <div className="mobile-container bg-gradient-hero">
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-sm shadow-elevated">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-lg overflow-hidden bg-white p-2 shadow-lg ring-1 ring-gray-200">
              <img 
                src={logoImage} 
                alt="Aloe Location Logo" 
                className="w-full h-full object-contain"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-primary">Aloe Location</h1>
              <p className="text-muted-foreground text-sm">
                Suivi des ventes d'assurances
              </p>
            </div>
          </CardHeader>
          
          <CardContent className="space-y-6">
            <div className="text-center space-y-3">
              <div className="flex justify-center">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={createDefaultUsers}
                  disabled={creatingUsers}
                  className="text-xs"
                >
                  <UserPlus className="h-3 w-3 mr-1" />
                  {creatingUsers ? 'Création...' : 'Créer les utilisateurs'}
                </Button>
              </div>
              
              <div>
                <h2 className="text-xl font-semibold mb-2">Se connecter</h2>
                <p className="text-sm text-muted-foreground">
                  Accédez à votre espace de vente
                </p>
              </div>
            </div>

            {showForgotPassword && (
              <Alert>
                <Mail className="h-4 w-4" />
                <AlertDescription>
                  Votre demande de réinitialisation de mot de passe a été envoyée à l'administrateur. 
                  Vous recevrez un email avec votre nouveau mot de passe.
                </AlertDescription>
              </Alert>
            )}
            
            <form onSubmit={handleSignIn} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Nom d'utilisateur
                </Label>
                <Input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre nom d'utilisateur"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password" className="flex items-center gap-2">
                  <Lock className="h-4 w-4" />
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Votre mot de passe"
                    required
                    className="pr-10"
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
              
              <Button
                type="submit"
                disabled={isLoading || !username || !password}
                className="w-full"
                size="lg"
              >
                {isLoading ? 'Connexion...' : 'Se connecter'}
              </Button>
            </form>
            
            <div className="text-center">
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={handleForgotPassword}
                disabled={sendingReset}
                className="text-muted-foreground hover:text-primary"
              >
                {sendingReset ? 'Envoi…' : 'Mot de passe oublié ?'}
              </Button>
            </div>

            <div className="text-center">
              <p className="text-xs text-muted-foreground">
                En vous connectant, vous acceptez nos conditions d'utilisation
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};