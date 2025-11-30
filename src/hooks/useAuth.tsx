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

  // Fonction pour charger le profil utilisateur avec retry logic AUGMENTÉ
  const loadProfile = async (userId: string, retries = 10): Promise<Profile | null> => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`🔍 [${attempt}/${retries}] Loading profile for user:`, userId);
        
        // Temporary workaround until Supabase types are regenerated
        const supabaseAny = supabase as any;
        const { data, error } = await supabaseAny
          .from('profiles')
          .select('id, email, full_name, role, is_active')
          .eq('id', userId)
          .single();

        if (error) {
          // Si c'est une erreur de cache et qu'il reste des tentatives, on réessaie avec délai progressif
          if (error.code === 'PGRST002' && attempt < retries) {
            const delay = Math.min(attempt * 1000, 5000); // Max 5 secondes entre retries
            console.warn(`⚠️ [${attempt}/${retries}] Schema cache error, retrying in ${delay}ms...`);
            await new Promise(resolve => setTimeout(resolve, delay));
            continue;
          }
          console.error(`❌ [${attempt}/${retries}] Error loading profile:`, error);
          throw error;
        }
        
        console.log(`✅ [${attempt}/${retries}] Profile loaded successfully:`, data);
        return data;
      } catch (error) {
        if (attempt === retries) {
          console.error(`❌ [${attempt}/${retries}] All attempts failed:`, error);
          return null;
        }
        // Continue to next iteration
      }
    }
    return null;
  };

  // Initialisation et écoute des changements d'auth
  useEffect(() => {
    console.log('🚀 [AUTH] useEffect - Starting auth initialization');
    let isMounted = true;

    // Récupérer la session actuelle
    const initAuth = async () => {
      try {
        console.log('🔍 [AUTH] Step 1: Getting current session...');
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ [AUTH] Step 1 FAILED: Session error:', error);
          throw error;
        }

        console.log('✅ [AUTH] Step 1 SUCCESS: Session retrieved:', session ? 'YES' : 'NO', session?.user?.email);

        if (session?.user && isMounted) {
          console.log('🔍 [AUTH] Step 2: User found, loading profile...');
          const profile = await loadProfile(session.user.id);
          
          if (!profile) {
            console.error('❌ [AUTH] Step 2 FAILED: No profile found for user:', session.user.id);
          } else {
            console.log('✅ [AUTH] Step 2 SUCCESS: Profile loaded');
          }
          
          setState({
            user: session.user,
            profile,
            isAdmin: profile?.role === 'admin',
            loading: false,
            error: null,
          });

          console.log('✅ [AUTH] Auth initialized:', {
            user: session.user.email,
            role: profile?.role,
            isAdmin: profile?.role === 'admin',
          });
        } else if (isMounted) {
          console.log('ℹ️ [AUTH] No session found - user not logged in');
          setState({
            user: null,
            profile: null,
            isAdmin: false,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        console.error('❌ [AUTH] Auth initialization EXCEPTION:', error);
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
        console.log('🔄 [AUTH] Auth state changed:', event, 'Session:', session ? 'YES' : 'NO');

        if (event === 'SIGNED_IN' && session?.user && isMounted) {
          console.log('🔑 [AUTH] SIGNED_IN event - loading profile');
          const profile = await loadProfile(session.user.id);
          
          setState({
            user: session.user,
            profile,
            isAdmin: profile?.role === 'admin',
            loading: false,
            error: null,
          });
          console.log('✅ [AUTH] State updated after SIGNED_IN');
        } else if (event === 'SIGNED_OUT' && isMounted) {
          console.log('🚪 [AUTH] SIGNED_OUT event - clearing state');
          setState({
            user: null,
            profile: null,
            isAdmin: false,
            loading: false,
            error: null,
          });
        } else if (event === 'TOKEN_REFRESHED' && session?.user && isMounted) {
          console.log('🔄 [AUTH] TOKEN_REFRESHED - updating profile');
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
      console.log('🔐 Attempting sign in with:', email);
      setState(prev => ({ ...prev, loading: true, error: null }));

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      console.log('🔐 Sign in response:', { data, error });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      if (!data.user) {
        console.error('❌ No user data returned');
        throw new Error('Aucun utilisateur retourné');
      }

      console.log('✅ User signed in:', data.user.email);
      const profile = await loadProfile(data.user.id);
      console.log('✅ Profile loaded:', profile);
      
      if (!profile) {
        console.error('❌ No profile found for user');
        throw new Error('Profil utilisateur introuvable');
      }

      setState({
        user: data.user,
        profile,
        isAdmin: profile.role === 'admin',
        loading: false,
        error: null,
      });

      toast({
        title: '✅ Connexion réussie',
        description: `Bienvenue ${profile.full_name || email}`,
      });

      console.log('✅ Sign in successful, returning:', { success: true, isAdmin: profile.role === 'admin' });
      return { success: true, isAdmin: profile.role === 'admin' };
    } catch (error: any) {
      console.error('❌ Sign in error:', error);
      
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
