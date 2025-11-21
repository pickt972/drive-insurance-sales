import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
}

interface AuthState {
  user: User | null;
  profile: Profile | null;
  isAdmin: boolean;
  loading: boolean;
  error: Error | null;
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    profile: null,
    isAdmin: false,
    loading: true,
    error: null,
  });
  const { toast } = useToast();

  // Fonction pour charger le profil utilisateur
  const loadProfile = async (userId: string): Promise<Profile | null> => {
    try {
      // Temporary workaround until Supabase types are regenerated
      const supabaseAny = supabase as any;
      const { data, error } = await supabaseAny
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) throw error;
      
      if (import.meta.env.DEV) {
        console.log('✅ Profile loaded:', data);
      }
      return data;
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('❌ Error loading profile:', error);
      }
      return null;
    }
  };

  // Initialisation et écoute des changements d'auth
  useEffect(() => {
    let isMounted = true;

    // Récupérer la session actuelle
    const initAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) throw error;

        if (session?.user && isMounted) {
          const profile = await loadProfile(session.user.id);
          
          setState({
            user: session.user,
            profile,
            isAdmin: profile?.role === 'admin',
            loading: false,
            error: null,
          });

          if (import.meta.env.DEV) {
            console.log('🔐 Auth initialized:', {
              user: session.user.email,
              role: profile?.role,
              isAdmin: profile?.role === 'admin',
            });
          }
        } else if (isMounted) {
          setState({
            user: null,
            profile: null,
            isAdmin: false,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('❌ Auth initialization error:', error);
        }
        if (isMounted) {
          setState({
            user: null,
            profile: null,
            isAdmin: false,
            loading: false,
            error: error as Error,
          });
        }
      }
    };

    initAuth();

    // Écouter les changements d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (import.meta.env.DEV) {
          console.log('🔄 Auth state changed:', event);
        }

        if (event === 'SIGNED_IN' && session?.user && isMounted) {
          const profile = await loadProfile(session.user.id);
          
          setState({
            user: session.user,
            profile,
            isAdmin: profile?.role === 'admin',
            loading: false,
            error: null,
          });
        } else if (event === 'SIGNED_OUT' && isMounted) {
          setState({
            user: null,
            profile: null,
            isAdmin: false,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user && isMounted) {
          const profile = await loadProfile(session.user.id);
          
          setState(prev => ({
            ...prev,
            user: session.user,
            profile,
            isAdmin: profile?.role === 'admin',
          }));
        }
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Fonction de connexion
  const signIn = async (email: string, password: string) => {
    try {
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      if (data.user) {
        const profile = await loadProfile(data.user.id);
        
        setState({
          user: data.user,
          profile,
          isAdmin: profile?.role === 'admin',
          loading: false,
          error: null,
        });

        toast({
          title: '✅ Connexion réussie',
          description: `Bienvenue ${profile?.full_name || email}`,
        });

        return { success: true, isAdmin: profile?.role === 'admin' };
      }
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ Sign in error:', error);
      }
      
      setState(prev => ({ 
        ...prev, 
        loading: false, 
        error: error as Error 
      }));

      toast({
        title: '❌ Erreur de connexion',
        description: error.message || 'Email ou mot de passe incorrect',
        variant: 'destructive',
      });

      return { success: false, isAdmin: false };
    }
  };

  // Fonction de déconnexion
  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      setState({
        user: null,
        profile: null,
        isAdmin: false,
        loading: false,
        error: null,
      });

      toast({
        title: '👋 Déconnexion réussie',
        description: 'À bientôt !',
      });
    } catch (error: any) {
      if (import.meta.env.DEV) {
        console.error('❌ Sign out error:', error);
      }
      toast({
        title: '❌ Erreur',
        description: 'Impossible de se déconnecter',
        variant: 'destructive',
      });
    }
  };

  return {
    user: state.user,
    profile: state.profile,
    isAdmin: state.isAdmin,
    loading: state.loading,
    error: state.error,
    signIn,
    signOut,
  };
}
