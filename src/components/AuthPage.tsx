import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, User, Lock, Eye, EyeOff, UserPlus } from "lucide-react";
import { useFirebase } from "@/hooks/useFirebase";
import { useNavigate } from "react-router-dom";
import { isFirebaseConfigured } from "@/lib/firebase";

export const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const { user, signIn, loading: authLoading, demoMode } = useFirebase();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && user) {
      navigate("/");
    }
  }, [user, authLoading, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const result = await signIn(username, password);
    
    if (!result.success) {
      setError(result.error || "Erreur de connexion");
    }
    
    setLoading(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 to-secondary/10 p-4">
      <Card className="w-full max-w-md shadow-lg">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold text-primary">
            Aloe Location
          </CardTitle>
          <p className="text-muted-foreground">Gestion des ventes d'assurances</p>
        </CardHeader>
        
        <CardContent>
          <div className="mb-4 p-3 bg-muted rounded-lg">
            <p className="text-sm text-muted-foreground text-center">
              {!isFirebaseConfigured && (
                <>
                  <strong className="text-warning">⚠️ Mode Démonstration</strong><br />
                  <span className="text-xs">Firebase non configuré - Fonctionnalités limitées</span><br /><br />
                </>
              )}
              <strong>Compte admin par défaut :</strong><br />
              Utilisateur: <code>admin</code><br />
              Mot de passe: <code>admin123</code>
              {demoMode && (
                <><br /><br />
                <span className="text-xs text-info">💡 Configurez Firebase dans le fichier .env pour activer toutes les fonctionnalités</span>
                </>
              )}
            </p>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
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
                  placeholder="••••••••"
                  className="pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Connexion..." : "Se connecter"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};