import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, User, Lock, Eye, EyeOff, AlertCircle } from 'lucide-react';

export function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!username || !password) {
      setError('Veuillez remplir tous les champs');
      return;
    }

    setIsLoading(true);

    try {
      // Convertir l'identifiant simple en email
      const email = username.includes('@') 
        ? username 
        : `${username.toLowerCase()}@aloelocation.internal`;
      
      console.log('🔐 Tentative de connexion avec:', email);
      
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) throw signInError;

      if (data.user) {
        console.log('✅ [LOGIN] Connexion réussie pour:', data.user.email);
        
        try {
          // Charger le profil immédiatement
          const supabaseAny = supabase as any;
          const { data: profile, error: profileError } = await supabaseAny
            .from('profiles')
            .select('role')
            .eq('id', data.user.id)
            .single();

          if (profileError) {
            console.error('❌ [LOGIN] Erreur chargement profil:', profileError);
            throw profileError;
          }

          console.log('🎯 [LOGIN] Profil chargé:', profile);
          console.log('🎯 [LOGIN] Rôle détecté:', profile?.role);
          
          const isAdmin = profile?.role === 'admin';
          const targetRoute = isAdmin ? '/admin' : '/dashboard';
          
          console.log('➡️ [LOGIN] Redirection vers:', targetRoute);
          console.log('🔑 [LOGIN] isAdmin:', isAdmin);
          
          navigate(targetRoute, { replace: true });
        } catch (err) {
          console.error('❌ [LOGIN] Erreur chargement profil:', err);
          setError('Erreur lors du chargement du profil');
        }
      }
    } catch (error: any) {
      setError('Identifiant ou mot de passe incorrect');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 via-white to-blue-100 p-4">
      <Card className="w-full max-w-md shadow-2xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl flex items-center justify-center shadow-lg">
              <span className="text-3xl font-bold text-white">AL</span>
            </div>
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800">ALOELOCATION</CardTitle>
          <CardDescription className="text-base text-gray-600">Connexion au système</CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-sm font-medium">Identifiant</Label>
              <div className="relative">
                <User className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  id="username"
                  type="text"
                  placeholder="stef"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="pl-10 h-12 text-base"
                  required
                  disabled={isLoading}
                  autoFocus
                  autoComplete="username"
                />
              </div>
              <p className="text-xs text-muted-foreground">Utilisez votre nom d'utilisateur (ex: stef, admin, julie...)</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm font-medium">Mot de passe</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3.5 h-5 w-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 pr-12 h-12 text-base"
                  required
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button type="submit" className="w-full h-12 text-base font-semibold" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  Connexion...
                </>
              ) : (
                'Se connecter'
              )}
            </Button>
          </form>

          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100">
            <p className="text-sm text-blue-800 text-center font-medium">💡 Connexion par nom d'utilisateur</p>
            <p className="text-xs text-blue-600 text-center mt-2">Exemples d'identifiants valides :</p>
            <p className="text-xs text-blue-700 text-center mt-1 font-mono font-semibold">admin • stef • julie • nadia</p>
          </div>
        </CardContent>

        <div className="px-6 pb-6">
          <div className="border-t pt-4">
            <p className="text-center text-xs text-gray-500">© 2025 ALOELOCATION - Martinique</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
