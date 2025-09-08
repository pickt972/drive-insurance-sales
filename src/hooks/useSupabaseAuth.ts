import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // Écouter les changements d'état d'authentification
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // Récupérer le profil utilisateur
          setTimeout(async () => {
            await fetchUserProfile(session.user.id);
          }, 0);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Vérifier une session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        fetchUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchUserProfile = async (userId: string) => {
    try {
      const { data, error } = await (supabase as any)
        .schema('api')
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Erreur lors de la récupération du profil:', error);
        return;
      }

      setProfile(data as Profile);
    } catch (error) {
      console.error('Erreur lors de la récupération du profil:', error);
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      // Récupérer l'email associé au nom d'utilisateur via Edge Function
      const { data: emailResp, error: emailError } = await supabase.functions.invoke('get-user-email', {
        body: { username },
      });

      if (emailError || !emailResp?.email) {
        toast({
          title: "Erreur de connexion",
          description: "Nom d'utilisateur ou mot de passe incorrect",
          variant: "destructive",
        });
        return { success: false, error: emailError?.message || 'Utilisateur non trouvé' };
      }

      // Se connecter avec l'email et le mot de passe
      const { data, error } = await supabase.auth.signInWithPassword({
        email: emailResp.email,
        password,
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: "Nom d'utilisateur ou mot de passe incorrect",
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Connexion réussie",
        description: "Bienvenue !",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Erreur lors de la connexion:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
      return { success: false, error: "Une erreur est survenue" };
    }
  };
  const signUp = async (email: string, password: string, username: string) => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: redirectUrl,
          data: {
            username: username,
          }
        }
      });

      if (error) {
        toast({
          title: "Erreur d'inscription",
          description: error.message,
          variant: "destructive",
        });
        return { success: false, error: error.message };
      }

      toast({
        title: "Inscription réussie",
        description: "Vérifiez votre email pour confirmer votre compte",
      });

      return { success: true, data };
    } catch (error) {
      console.error('Erreur lors de l\'inscription:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de l'inscription",
        variant: "destructive",
      });
      return { success: false, error: "Une erreur est survenue" };
    }
  };

  const signInWithGoogle = async () => {
    try {
      const redirectUrl = `${window.location.origin}/`;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          skipBrowserRedirect: true,
        },
      });

      if (error) {
        toast({
          title: "Erreur de connexion",
          description: error.message,
          variant: "destructive",
        });
        return;
      }

      if (data?.url) {
        try {
          // Si l'app n'est PAS dans une iframe, rediriger normalement
          if (window.top === window.self) {
            window.location.href = data.url;
            return;
          }

          // Sinon, ouvrir dans un nouvel onglet pour contourner les restrictions d'iframe
          const win = window.open(data.url, '_blank', 'noopener,noreferrer');
          if (!win) {
            // Fallback ultime: tenter la redirection dans l'iframe
            window.location.href = data.url;
          } else {
            win.opener = null;
          }
        } catch (e) {
          // En cas d'erreur de sécurité, tenter l'ouverture en nouvel onglet
          const win = window.open(data.url, '_blank', 'noopener,noreferrer');
          if (!win) {
            toast({
              title: "Autoriser l'ouverture de fenêtre",
              description: "Veuillez autoriser l'ouverture de fenêtres pop-up pour procéder à la connexion Google.",
            });
          }
        }
      }
    } catch (error) {
      console.error('Erreur lors de la connexion Google:', error);
      toast({
        title: "Erreur",
        description: "Une erreur est survenue lors de la connexion",
        variant: "destructive",
      });
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        toast({
          title: "Erreur de déconnexion",
          description: error.message,
          variant: "destructive",
        });
      } else {
        toast({
          title: "Déconnexion réussie",
          description: "À bientôt !",
        });
      }
    } catch (error) {
      console.error('Erreur lors de la déconnexion:', error);
    }
  };

  const createUserProfile = async (userData: {
    username: string;
    role?: 'admin' | 'employee';
  }) => {
    if (!user) return null;

    try {
      console.log('Tentative de création de profil:', userData, 'pour user:', user.id);
      
      const { data, error } = await (supabase as any)
        .schema('api')
        .from('profiles')
        .insert({
          user_id: user.id,
          username: userData.username,
          role: userData.role || 'employee',
        })
        .select()
        .single();

      if (error) {
        console.error('Erreur détaillée lors de la création du profil:', error);
        toast({
          title: "Erreur",
          description: `Impossible de créer le profil utilisateur: ${error.message}`,
          variant: "destructive",
        });
        return null;
      }

      console.log('Profil créé avec succès:', data);
      setProfile(data as Profile);
      return data;
    } catch (error) {
      console.error('Erreur lors de la création du profil:', error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: profile?.role === 'admin',
    signInWithUsername,
    signOut,
    createUserProfile,
    fetchUserProfile,
  };
};