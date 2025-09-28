import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, User, Lock, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  
  const { isAuthenticated, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

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
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-success/5 p-6">
      <div className="modern-form max-w-md w-full animate-smooth-scale-in">
        <div className="text-center mb-8">
          <div className="icon-wrapper mx-auto mb-6 w-20 h-20">
            <div className="w-full h-full bg-gradient-to-br from-primary to-primary-variant rounded-3xl flex items-center justify-center animate-float-gentle">
              <span className="text-2xl font-bold text-primary-foreground">AL</span>
            </div>
          </div>
          <h1 className="gradient-text text-4xl mb-2">Aloe Location</h1>
          <p className="text-muted-foreground text-lg">Gestion des ventes d'assurances</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="username" className="flex items-center gap-3 text-base font-semibold">
                <User className="h-4 w-4" />
                Nom d'utilisateur
              </Label>
              <Input
                id="username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Votre nom d'utilisateur"
                className="friendly-input text-base"
                required
              />
            </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="flex items-center gap-3 text-base font-semibold">
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
                  className="friendly-input text-base pr-12"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 rounded-xl hover:bg-muted/50"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

          {error && (
            <div className="modern-card p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/30">
              <Alert variant="destructive" className="border-0 bg-transparent">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            </div>
          )}

          <Button 
            type="submit" 
            className="modern-button w-full py-4 text-lg font-bold" 
            disabled={loading}
          >
            <LogIn className="h-5 w-5 mr-3" />
            {loading ? "🔄 Connexion..." : "🚀 Se connecter"}
          </Button>
        </form>
      </div>
    </div>
  );
};