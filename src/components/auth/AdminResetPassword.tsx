import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Lock, Mail, Shield } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export const AdminResetPassword = () => {
  const { toast } = useToast();
  const [username, setUsername] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [userEmail, setUserEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [resetSuccess, setResetSuccess] = useState(false);

  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let password = '';
    for (let i = 0; i < 12; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setNewPassword(password);
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !newPassword) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase.functions.invoke('admin-reset-password', {
        body: {
          username,
          newPassword,
          userEmail: userEmail || undefined,
        },
      });

      if (error) throw error;

      setResetSuccess(true);
      toast({
        title: "Mot de passe réinitialisé",
        description: `Le mot de passe de ${username} a été mis à jour avec succès.`,
      });

      // Reset form
      setUsername("");
      setNewPassword("");
      setUserEmail("");
      
      setTimeout(() => {
        setResetSuccess(false);
      }, 5000);

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

  return (
    <div className="max-w-md mx-auto p-4">
      <Card className="shadow-elevated">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center shadow-primary">
            <Shield className="h-8 w-8 text-white" />
          </div>
          <div>
            <CardTitle className="text-2xl font-bold text-primary">
              Réinitialisation Admin
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              Réinitialisez le mot de passe d'un utilisateur
            </p>
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {resetSuccess && (
            <Alert>
              <Shield className="h-4 w-4" />
              <AlertDescription>
                Le mot de passe a été réinitialisé avec succès. L'utilisateur a été notifié par email.
              </AlertDescription>
            </Alert>
          )}
          
          <form onSubmit={handleResetPassword} className="space-y-4">
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
                placeholder="Nom d'utilisateur à réinitialiser"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="userEmail" className="flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email utilisateur (optionnel)
              </Label>
              <Input
                id="userEmail"
                type="email"
                value={userEmail}
                onChange={(e) => setUserEmail(e.target.value)}
                placeholder="email@example.com"
              />
              <p className="text-xs text-muted-foreground">
                Si fourni, l'utilisateur recevra le nouveau mot de passe par email
              </p>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newPassword" className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                Nouveau mot de passe
              </Label>
              <div className="flex gap-2">
                <Input
                  id="newPassword"
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Nouveau mot de passe"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={generateRandomPassword}
                >
                  Générer
                </Button>
              </div>
            </div>
            
            <Button
              type="submit"
              disabled={isLoading || !username || !newPassword}
              className="w-full"
              size="lg"
            >
              {isLoading ? 'Réinitialisation...' : 'Réinitialiser le mot de passe'}
            </Button>
          </form>

          <div className="text-center">
            <p className="text-xs text-muted-foreground">
              Cette action réinitialisera immédiatement le mot de passe de l'utilisateur
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};