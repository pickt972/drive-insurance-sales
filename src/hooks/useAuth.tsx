import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

export interface Profile {
  id: string;
  email: string;
  full_name: string;
  agency: string | null;
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  role: string | null;
  session: Session | null;
  isLoading: boolean;
  isAdmin: boolean;
  isAuthenticated: boolean;
  signIn: (identifier: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer le profil
  const fetchProfile = useCallback(async (userId: string) => {
    console.log('[AUTH] fetchProfile called for:', userId);
    try {
      const { data, error } = await (supabase as any)
        .from('profiles')
        .select('id, email, full_name, agency, is_active')
        .eq('id', userId)
        .maybeSingle();

      console.log('[AUTH] Profile result:', data, 'Error:', error);
      return data || null;
    } catch (err) {
      console.error('[AUTH] fetchProfile exception:', err);
      return null;
    }
  }, []);

  // Récupérer le rôle via RPC pour éviter les problèmes de RLS
  const fetchRole = useCallback(async (userId: string) => {
    console.log('[AUTH] fetchRole called for:', userId);
    try {
      const { data, error } = await (supabase as any)
        .rpc('get_user_role', { _user_id: userId });

      console.log('[AUTH] Role result:', data, 'Error:', error);
      
      if (error) {
        console.error('[AUTH] Role fetch error:', error);
        return 'user';
      }
      
      return data || 'user';
    } catch (err) {
      console.error('[AUTH] fetchRole exception:', err);
      return 'user';
    }
  }, []);

  // Initialisation
  useEffect(() => {
    let mounted = true;
    console.log('[AUTH] useEffect init started');

    const initialize = async () => {
      try {
        console.log('[AUTH] Getting session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        console.log('[AUTH] Session:', currentSession?.user?.email, 'Error:', error);

        if (error || !currentSession?.user) {
          console.log('[AUTH] No session, setting isLoading false');
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession.user);

          console.log('[AUTH] Fetching profile and role...');
          const [userProfile, userRole] = await Promise.all([
            fetchProfile(currentSession.user.id),
            fetchRole(currentSession.user.id)
          ]);

          console.log('[AUTH] Got profile:', userProfile);
          console.log('[AUTH] Got role:', userRole);

          if (mounted) {
            setProfile(userProfile);
            setRole(userRole);
            setIsLoading(false);
            console.log('[AUTH] Init complete. isAdmin:', userRole === 'admin');
          }
        }
      } catch (err) {
        console.error('[AUTH] Init error:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listener pour les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, newSession) => {
        console.log('[AUTH] onAuthStateChange:', event, newSession?.user?.email);

        if (!mounted) return;

        if (event === 'SIGNED_OUT' || !newSession?.user) {
          setSession(null);
          setUser(null);
          setProfile(null);
          setRole(null);
          setIsLoading(false);
          return;
        }

        if (event === 'SIGNED_IN' && newSession?.user) {
          setSession(newSession);
          setUser(newSession.user);
          setIsLoading(true);

          // Petit délai pour laisser le trigger créer le profil si nécessaire
          await new Promise(resolve => setTimeout(resolve, 200));

          const [userProfile, userRole] = await Promise.all([
            fetchProfile(newSession.user.id),
            fetchRole(newSession.user.id)
          ]);

          console.log('[AUTH] After SIGNED_IN - profile:', userProfile, 'role:', userRole);

          if (mounted) {
            setProfile(userProfile);
            setRole(userRole);
            setIsLoading(false);
          }
        }
      }
    );

    initialize();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfile, fetchRole]);

  const signIn = async (identifier: string, password: string) => {
    try {
      setIsLoading(true);

      // IMPORTANT: Utiliser le bon domaine
      const email = identifier.includes('@')
        ? identifier.toLowerCase().trim()
        : `${identifier.toLowerCase().trim()}@aloelocation.internal`;

      console.log('[AUTH] signIn attempt:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('[AUTH] signIn error:', error);
        setIsLoading(false);
        return { error };
      }

      console.log('[AUTH] signIn success:', data.user?.id);
      // onAuthStateChange gère le reste
      return { error: null };
    } catch (err) {
      console.error('[AUTH] signIn exception:', err);
      setIsLoading(false);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    console.log('[AUTH] signOut');
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setRole(null);
    setSession(null);
  };

  const value: AuthContextType = {
    user,
    profile,
    role,
    session,
    isLoading,
    isAdmin: role === 'admin',
    isAuthenticated: !!user && !!profile,
    signIn,
    signOut,
  };

  console.log('[AUTH] Render - isLoading:', isLoading, 'role:', role, 'isAdmin:', role === 'admin');

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
