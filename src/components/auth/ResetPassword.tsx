import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Lock, Shield, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);
  const [tokenValid, setTokenValid] = useState<boolean | null>(null);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const token = searchParams.get('token');
  const username = searchParams.get('username');

  useEffect(() => {
    if (!token || !username) {
      setTokenValid(false);
      return;
    }
    
    // Vérifier que le token est valide
    const validateToken = async () => {
      try {
        const { error } = await supabase.functions.invoke('validate-reset-token', {
          body: { token, username }
        });
        setTokenValid(!error);
      } catch (err) {
        setTokenValid(false);
      }
    };
    
    validateToken();
  }, [token, username]);

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!newPassword || !confirmPassword) {
      toast({
        title: "Champs requis",
        description: "Veuillez remplir tous les champs.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      toast({
        title: "Erreur",
        description: "Les mots de passe ne correspondent pas.",
        variant: "destructive",
      });
      return;
    }

    if (newPassword.length < 6) {
      toast({
        title: "Erreur",
        description: "Le mot de passe doit contenir au moins 6 caractères.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('reset-password-with-token', {
        body: {
          token,
          username,
          newPassword,
        },
      });

      if (error) throw error;

      setResetSuccess(true);
      toast({
        title: "Mot de passe réinitialisé",
        description: "Votre mot de passe a été mis à jour avec succès.",
      });

      setTimeout(() => {
        navigate('/');
      }, 3000);

    } catch (err: any) {
      toast({
        title: "Échec de la réinitialisation",
        description: err.message || "Impossible de réinitialiser le mot de passe.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (tokenValid === null) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <Shield className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Vérification du lien...</p>
        </div>
      </div>
    );
  }

  if (tokenValid === false) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <AlertCircle className="h-12 w-12 mx-auto mb-4 text-destructive" />
            <CardTitle className="text-destructive">Lien invalide</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Ce lien de réinitialisation est invalide ou a expiré.
            </p>
            <Button onClick={() => navigate('/')} variant="outline">
              Retour à la connexion
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (resetSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md shadow-elevated">
          <CardHeader className="text-center">
            <CheckCircle className="h-12 w-12 mx-auto mb-4 text-success" />
            <CardTitle className="text-success">Mot de passe réinitialisé</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-muted-foreground">
              Votre mot de passe a été mis à jour avec succès. Vous allez être redirigé vers la page de connexion.
            </p>
            <Button onClick={() => navigate('/')}>
              Se connecter maintenant
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-elevated">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              Nouveau mot de passe
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Choisissez un nouveau mot de passe pour {username}
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          <form onSubmit={handleResetPassword} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Nouveau mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Minimum 6 caractères"
                  required
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
              <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Confirmer le mot de passe
              </Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirmez votre mot de passe"
                  required
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !newPassword || !confirmPassword}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Mise à jour...' : 'Mettre à jour le mot de passe'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Ce lien expire dans 24 heures pour des raisons de sécurité
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};