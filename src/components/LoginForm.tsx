import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { LogIn, User, Lock, Eye, EyeOff, Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface LoginFormProps {
  onLogin: (username: string, password: string) => { success: boolean; error?: string };
  usernames: string[];
}

export const LoginForm = ({ onLogin, usernames }: LoginFormProps) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [sendingReset, setSendingReset] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!username || !password) {
      toast({
        title: "Erreur",
        description: "Veuillez saisir un nom d'utilisateur et un mot de passe",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    
    const result = onLogin(username, password);
    
    if (!result.success) {
      toast({
        title: "Erreur de connexion",
        description: result.error,
        variant: "destructive",
      });
    }
    
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

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-subtle">
      <Card className="w-full max-w-md shadow-elegant">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center">
            <LogIn className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl">Connexion</CardTitle>
          <p className="text-muted-foreground">
            Gestion des ventes d'assurances
          </p>
        </CardHeader>
        <CardContent>
          {showForgotPassword && (
            <Alert className="mb-4">
              <Mail className="h-4 w-4" />
              <AlertDescription>
                Votre demande de réinitialisation de mot de passe a été envoyée à l'administrateur. 
                Vous recevrez un email avec votre nouveau mot de passe.
              </AlertDescription>
            </Alert>
          )}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Utilisateur
              </Label>
              <Select value={username} onValueChange={setUsername}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un utilisateur" />
                </SelectTrigger>
                <SelectContent>
                  {usernames.map((name) => (
                    <SelectItem key={name} value={name}>
                      {name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
              className="w-full bg-gradient-primary hover:bg-primary-hover"
              disabled={isLoading}
            >
              {isLoading ? "Connexion..." : "Se connecter"}
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
              {sendingReset ? 'Envoi…' : 'Mot de passe oublié ?'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};