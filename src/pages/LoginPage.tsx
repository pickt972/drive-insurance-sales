import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Loader2, Car } from 'lucide-react';

export default function LoginPage() {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);

  const { signIn, user, isAdmin, isLoading, role } = useAuth();
  const navigate = useNavigate();

  const addLog = (message: string) => {
    setDebugLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
    console.log(message);
  };

  // Redirection automatique si déjà connecté
  useEffect(() => {
    if (!isLoading && user) {
      const redirectTo = isAdmin ? '/admin' : '/dashboard';
      console.log('[Login] Already authenticated, redirecting to:', redirectTo);
      navigate(redirectTo, { replace: true });
    }
  }, [user?.id, isAdmin, isLoading, navigate]); // Use user?.id for stable reference

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    // Convertir l'identifiant simple en email
    const email = identifier.includes('@') 
      ? identifier 
      : `${identifier.toLowerCase()}@aloelocation.internal`;

    addLog(`Tentative connexion: ${identifier}`);
    console.log('[Login] Attempting login for:', email);

    const result = await signIn(email, password);

    if (result.error) {
      addLog(`Erreur: ${result.error.message}`);
      setError('Identifiant ou mot de passe incorrect');
      setIsSubmitting(false);
      return;
    }

    addLog(`Connexion OK, role: ${role}, isAdmin: ${isAdmin}`);
    
    // La redirection sera gérée par le useEffect ci-dessus
    setIsSubmitting(false);
  };

  // Si en cours de chargement initial, afficher un loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-16 w-16 bg-blue-600 rounded-full flex items-center justify-center">
              <Car className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">ALOELOCATION</CardTitle>
          <CardDescription>Connectez-vous à votre compte</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label htmlFor="identifier">Identifiant</Label>
              <Input
                id="identifier"
                type="text"
                placeholder="admin, stef, marie..."
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                required
                autoComplete="username"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Mot de passe</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="current-password"
                  disabled={isSubmitting}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          {debugLogs.length > 0 && (
            <div className="mt-4 p-4 bg-gray-100 rounded text-xs max-h-40 overflow-auto">
              <p className="font-bold mb-2">Debug:</p>
              {debugLogs.map((log, i) => (
                <p key={i} className="text-gray-600">{log}</p>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
