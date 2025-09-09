import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LoginForm } from "@/components/LoginForm";
import { useSupabaseAuth } from "@/hooks/useSupabaseAuth";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";

const AuthPage = () => {
  const navigate = useNavigate();
  const { isAuthenticated: supabaseAuthenticated, signInWithUsername } = useSupabaseAuth();
  const { isAuthenticated: localAuthenticated } = useAuth();
  const [usernames, setUsernames] = useState<string[]>([]);

  // Charger la liste des utilisateurs depuis Supabase
  useEffect(() => {
    const loadUsernames = async () => {
      const { data, error } = await (supabase as any)
        .schema('api')
        .from('profiles')
        .select('username')
        .eq('is_active', true)
        .order('username');
      if (!error && data) {
        setUsernames(data.map((p: any) => p.username));
      }
    };
    loadUsernames();
  }, []);
  
  // Rediriger si déjà connecté
  useEffect(() => {
    if (supabaseAuthenticated || localAuthenticated) {
      navigate('/', { replace: true });
    }
  }, [supabaseAuthenticated, localAuthenticated, navigate]);

  // Si déjà connecté, ne pas afficher la page de connexion
  if (supabaseAuthenticated || localAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <LoginForm 
          onLogin={signInWithUsername}
          usernames={usernames}
        />
      </div>
    </div>
  );
};

export default AuthPage;