import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { LogIn, User, Lock, Eye, EyeOff, AlertCircle } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";

export const AuthPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [touched, setTouched] = useState({ username: false, password: false });
  
  const { isAuthenticated, signIn, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = 'Connexion | Aloe Location';
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', "Connexion Aloe Location - Authentification par nom d'utilisateur");
  }, []);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate("/", { replace: true });
    }
  }, [isAuthenticated, authLoading, navigate]);

  // Validation en temps réel du nom d'utilisateur
  const validateUsername = (value: string) => {
    if (!value.trim()) {
      return "Le nom d'utilisateur est requis";
    }
    if (value.length < 3) {
      return "Le nom d'utilisateur doit contenir au moins 3 caractères";
    }
    return "";
  };

  // Validation en temps réel du mot de passe
  const validatePassword = (value: string) => {
    if (!value) {
      return "Le mot de passe est requis";
    }
    if (value.length < 6) {
      return "Le mot de passe doit contenir au moins 6 caractères";
    }
    return "";
  };

  const handleUsernameChange = (value: string) => {
    setUsername(value);
    if (touched.username) {
      setUsernameError(validateUsername(value));
    }
    setError(""); // Réinitialiser l'erreur globale
  };

  const handlePasswordChange = (value: string) => {
    setPassword(value);
    if (touched.password) {
      setPasswordError(validatePassword(value));
    }
    setError(""); // Réinitialiser l'erreur globale
  };

  const handleUsernameBlur = () => {
    setTouched(prev => ({ ...prev, username: true }));
    setUsernameError(validateUsername(username));
  };

  const handlePasswordBlur = () => {
    setTouched(prev => ({ ...prev, password: true }));
    setPasswordError(validatePassword(password));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Marquer tous les champs comme touchés
    setTouched({ username: true, password: true });
    
    // Valider tous les champs
    const usernameErr = validateUsername(username);
    const passwordErr = validatePassword(password);
    
    setUsernameError(usernameErr);
    setPasswordError(passwordErr);
    
    if (usernameErr || passwordErr) {
      return;
    }
    
    setLoading(true);
    setError("");

    const result = await signIn(username, password);
    
    if (!result.success) {
      // Amélioration des messages d'erreur selon le type
      const errorMsg = result.error || "";
      
      if (errorMsg.includes("Invalid login credentials") || errorMsg.includes("incorrect")) {
        setError("Nom d'utilisateur ou mot de passe incorrect. Veuillez réessayer.");
      } else if (errorMsg.includes("Email not confirmed")) {
        setError("Votre compte n'est pas encore activé. Vérifiez vos emails.");
      } else if (errorMsg.includes("too many requests") || errorMsg.includes("rate limit")) {
        setError("Trop de tentatives de connexion. Veuillez patienter 15 minutes.");
      } else if (errorMsg.includes("network") || errorMsg.includes("fetch")) {
        setError("Erreur de connexion au serveur. Vérifiez votre connexion internet.");
      } else {
        setError(errorMsg || "Erreur de connexion. Veuillez contacter l'administrateur.");
      }
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
          <div className="icon-wrapper mx-auto mb-6 w-24 h-24">
            <img 
              src="/app-icon-512.png" 
              alt="Aloe Location Trophy" 
              className="w-full h-full object-contain animate-float-gentle drop-shadow-lg"
            />
          </div>
          <h1 className="gradient-text text-3xl mb-2">Aloe Location</h1>
          <p className="text-muted-foreground text-lg">Gestion des ventes d'assurances</p>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-3">
            <Label htmlFor="username" className="flex items-center gap-3 text-base font-bold">
              <User className="h-4 w-4" />
              Nom d'utilisateur <span className="text-destructive">*</span>
            </Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => handleUsernameChange(e.target.value)}
              onBlur={handleUsernameBlur}
              placeholder="Votre nom d'utilisateur"
              className={`friendly-input text-base ${usernameError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
              required
              autoComplete="username"
            />
            {usernameError && (
              <p className="text-sm text-destructive flex items-center gap-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                {usernameError}
              </p>
            )}
          </div>

          <div className="space-y-3">
            <Label htmlFor="password" className="flex items-center gap-3 text-base font-bold">
              <Lock className="h-4 w-4" />
              Mot de passe <span className="text-destructive">*</span>
            </Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                onBlur={handlePasswordBlur}
                placeholder="••••••••"
                className={`friendly-input text-base pr-12 ${passwordError ? 'border-destructive focus-visible:ring-destructive' : ''}`}
                required
                autoComplete="current-password"
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
            {passwordError && (
              <p className="text-sm text-destructive flex items-center gap-2 mt-2">
                <AlertCircle className="h-4 w-4" />
                {passwordError}
              </p>
            )}
          </div>

          {error && (
            <div className="modern-card p-4 bg-gradient-to-r from-destructive/10 to-destructive/5 border-destructive/30 animate-gentle-shake">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-destructive flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <p className="text-sm text-destructive font-semibold">{error}</p>
                  {error.includes("incorrect") && (
                    <p className="text-xs text-muted-foreground mt-2">
                      Assurez-vous d'utiliser le bon nom d'utilisateur et mot de passe.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          <Button 
            type="submit" 
            className="modern-button w-full h-12 text-lg font-bold" 
            disabled={loading || !!usernameError || !!passwordError}
          >
            <LogIn className="h-5 w-5 mr-3" />
            {loading ? "🔄 Connexion en cours..." : "🚀 Accéder à mon compte"}
          </Button>

          <div className="text-center text-sm text-muted-foreground">
            Besoin d'aide ? Contactez votre administrateur
          </div>
        </form>
      </div>
    </div>
  );
};