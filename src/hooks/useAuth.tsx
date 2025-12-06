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

// Helper pour log sécurisé (uniquement en dev)
const devLog = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.log(message, ...args);
  }
};

const devWarn = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.warn(message, ...args);
  }
};

const devError = (message: string, ...args: unknown[]) => {
  if (import.meta.env.DEV) {
    console.error(message, ...args);
  }
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Récupérer le profil avec retry et fallback
  const fetchProfile = useCallback(async (userId: string) => {
    devLog('[AUTH] fetchProfile called for:', userId);
    
    // Retry jusqu'à 3 fois
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await (supabase as any)
          .from('profiles')
          .select('id, email, full_name, agency, is_active')
          .eq('id', userId)
          .maybeSingle();

        if (!error && data) {
          devLog('[AUTH] ✅ Profile loaded:', data);
          return data;
        }

        devLog(`[AUTH] ⚠️ Profile attempt ${attempt + 1} failed:`, error);
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        devError(`[AUTH] fetchProfile exception (attempt ${attempt + 1}):`, err);
      }
    }

    // Fallback: construire depuis user_metadata
    devLog('[AUTH] 🔄 Using user_metadata fallback');
    const { data: { user } } = await supabase.auth.getUser();
    if (user?.user_metadata) {
      return {
        id: userId,
        email: user.email || '',
        full_name: user.user_metadata.full_name || '',
        agency: user.user_metadata.agency || null,
        is_active: true
      };
    }

    return null;
  }, []);

  // Récupérer le rôle via RPC avec retry - fail closed (no fallback to user_metadata)
  const fetchRole = useCallback(async (userId: string) => {
    devLog('[AUTH] fetchRole called for:', userId);
    
    // Retry jusqu'à 3 fois
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const { data, error } = await (supabase as any)
          .rpc('get_user_role', { _user_id: userId });

        if (!error && data) {
          devLog('[AUTH] ✅ Role loaded:', data);
          return data;
        }
        
        devLog(`[AUTH] ⚠️ Role attempt ${attempt + 1} failed:`, error);
        if (attempt < 2) await new Promise(resolve => setTimeout(resolve, 500));
      } catch (err) {
        devError(`[AUTH] fetchRole exception (attempt ${attempt + 1}):`, err);
      }
    }

    // Security: fail closed - default to least privileges instead of trusting user_metadata
    devWarn('[AUTH] ⚠️ Could not fetch role from database after 3 attempts - defaulting to "user" (least privileges)');
    return 'user';
  }, []);

  // Timeout de sécurité pour éviter le blocage infini
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        devWarn('[AUTH] ⚠️ Timeout after 5s - forcing isLoading to false');
        setIsLoading(false);
      }
    }, 5000);

    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Initialisation
  useEffect(() => {
    let mounted = true;
    devLog('[AUTH] useEffect init started');

    const initialize = async () => {
      try {
        devLog('[AUTH] Getting session...');
        const { data: { session: currentSession }, error } = await supabase.auth.getSession();
        
        devLog('[AUTH] Session:', currentSession?.user?.email, 'Error:', error);

        if (error || !currentSession?.user) {
          devLog('[AUTH] No session, setting isLoading false');
          if (mounted) {
            setIsLoading(false);
          }
          return;
        }

        if (mounted) {
          setSession(currentSession);
          setUser(currentSession.user);

          devLog('[AUTH] Fetching profile and role...');
          const [userProfile, userRole] = await Promise.all([
            fetchProfile(currentSession.user.id),
            fetchRole(currentSession.user.id)
          ]);

          devLog('[AUTH] Got profile:', userProfile);
          devLog('[AUTH] Got role:', userRole);

          if (mounted) {
            setProfile(userProfile);
            setRole(userRole);
            setIsLoading(false);
            devLog('[AUTH] Init complete. isAdmin:', userRole === 'admin');
          }
        }
      } catch (err) {
        devError('[AUTH] Init error:', err);
        if (mounted) {
          setIsLoading(false);
        }
      }
    };

    // Listener pour les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, newSession) => {
        devLog('[AUTH] onAuthStateChange:', event, newSession?.user?.email);

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
          
          // IMPORTANT: Utiliser setTimeout pour éviter le deadlock Supabase
          setTimeout(async () => {
            if (!mounted) return;
            
            try {
              const [userProfile, userRole] = await Promise.all([
                fetchProfile(newSession.user.id),
                fetchRole(newSession.user.id)
              ]);

              devLog('[AUTH] After SIGNED_IN - profile:', userProfile, 'role:', userRole);

              if (mounted) {
                setProfile(userProfile);
                setRole(userRole);
                setIsLoading(false);
              }
            } catch (err) {
              devError('[AUTH] Error fetching profile/role:', err);
              if (mounted) {
                setIsLoading(false);
              }
            }
          }, 0);
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

      devLog('[AUTH] signIn attempt:', email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        devError('[AUTH] signIn error:', error);
        setIsLoading(false);
        return { error };
      }

      devLog('[AUTH] signIn success:', data.user?.id);
      // onAuthStateChange gère le reste
      return { error: null };
    } catch (err) {
      devError('[AUTH] signIn exception:', err);
      setIsLoading(false);
      return { error: err as Error };
    }
  };

  const signOut = async () => {
    devLog('[AUTH] signOut');
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

  devLog('[AUTH] Render - isLoading:', isLoading, 'role:', role, 'isAdmin:', role === 'admin');

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}
