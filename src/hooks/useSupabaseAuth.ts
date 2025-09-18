import { useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { Profile } from '@/types/database';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const navigate = useNavigate();

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
      // 1) Tenter de récupérer par user_id
      const { data: byId, error: byIdErr } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (byId && !byIdErr) {
        setProfile(byId as Profile);
        return;
      }

      // 2) Si non trouvé, tenter de lier un profil existant (par username) à cet user_id
      const unameFromUser = user?.user_metadata?.username || user?.user_metadata?.full_name || user?.email?.split('@')[0] || undefined;
      const desiredRole: 'admin' | 'employee' =
        (unameFromUser && unameFromUser.toLowerCase() === 'admin') || (user?.user_metadata as any)?.role === 'admin'
          ? 'admin'
          : 'employee';

      if (unameFromUser) {
        try {
          await (supabase as any).rpc('link_profile_to_user', {
            p_username: unameFromUser,
            p_user_id: userId,
          });
        } catch (rpcErr) {
          console.warn('link_profile_to_user RPC error (non bloquant):', rpcErr);
        }

        // Rechercher à nouveau
        const { data: linked, error: linkedErr } = await (supabase as any)
          .from('profiles')
          .select('*')
          .eq('user_id', userId)
          .maybeSingle();

        if (linked && !linkedErr) {
          // S’assurer du bon rôle pour l’admin
          if (linked.role !== desiredRole) {
            const { data: updated } = await (supabase as any)
              .from('profiles')
              .update({ role: desiredRole })
              .eq('user_id', userId)
              .select()
              .maybeSingle();
            setProfile((updated || linked) as Profile);
            return;
          }
          setProfile(linked as Profile);
          return;
        }
      }

      // 3) Toujours rien ? Créer le profil
      if (unameFromUser) {
        const { data: created, error: createErr } = await (supabase as any)
          .from('profiles')
          .insert({ user_id: userId, username: unameFromUser, role: desiredRole })
          .select()
          .maybeSingle();
        if (createErr) {
          console.error('Erreur création profil:', createErr);
          return;
        }
        setProfile(created as Profile);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération/liaison du profil:', error);
    }
  };

  const signInWithUsername = async (username: string, password: string) => {
    try {
      // Récupérer l'email associé au nom d'utilisateur via Edge Function
      const { data: emailResp, error: emailError } = await supabase.functions.invoke('get-user-email', {
        body: { username: username.toLowerCase().trim() },
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
        
        // Nettoyer et rediriger
        navigate('/auth', { replace: true });
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
      const desiredRole: 'admin' | 'employee' =
        userData.username?.trim().toLowerCase() === 'admin'
          ? 'admin'
          : (userData.role || 'employee');

      // Vérifier si un profil existe déjà
      const { data: existing, error: selErr } = await (supabase as any)
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (selErr) {
        console.error('Erreur sélection profil:', selErr);
      }

      if (!existing) {
        // Insérer le profil
        const { data, error } = await (supabase as any)
          .from('profiles')
          .insert({
            user_id: user.id,
            username: userData.username,
            role: desiredRole,
          })
          .select()
          .single();

        if (error) {
          console.error('Erreur création profil:', error);
          toast({
            title: "Erreur",
            description: `Impossible de créer le profil utilisateur: ${error.message}`,
            variant: "destructive",
          });
          return null;
        }

        setProfile(data as Profile);
        return data;
      } else {
        // Mettre à jour le profil existant (incluant le rôle)
        const { data, error } = await (supabase as any)
          .from('profiles')
          .update({ username: userData.username, role: desiredRole })
          .eq('user_id', user.id)
          .select()
          .single();

        if (error) {
          console.error('Erreur mise à jour profil:', error);
          toast({
            title: "Erreur",
            description: `Impossible de mettre à jour le profil utilisateur: ${error.message}`,
            variant: "destructive",
          });
          return null;
        }

        setProfile(data as Profile);
        return data;
      }
    } catch (error) {
      console.error('Erreur lors de la gestion du profil:', error);
      toast({
        title: "Erreur",
        description: `Une erreur est survenue: ${error instanceof Error ? error.message : 'Erreur inconnue'}`,
        variant: "destructive",
      });
      return null;
    }
  };

  // Nouvelles fonctions pour la gestion des utilisateurs
  const addUser = async (username: string, email: string, password: string, role: 'admin' | 'employee' = 'employee') => {
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'create',
          username,
          email,
          password,
          role
        }
      });

      if (error) throw error;

      toast({
        title: "Utilisateur créé",
        description: `${username} a été créé avec succès`,
      });

      return { success: true, data };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const updatePassword = async (username: string, newPassword: string, userEmail?: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'update',
          username,
          newPassword,
          userEmail
        }
      });

      if (error) throw error;

      toast({
        title: "Mot de passe modifié",
        description: `Le mot de passe de ${username} a été mis à jour`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const updateRole = async (username: string, newRole: 'admin' | 'employee') => {
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'update',
          username,
          newRole
        }
      });

      if (error) throw error;

      toast({
        title: "Rôle modifié",
        description: `Le rôle de ${username} a été mis à jour`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const removeUser = async (username: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('user-management', {
        body: {
          action: 'delete',
          username
        }
      });

      if (error) throw error;

      toast({
        title: "Utilisateur supprimé",
        description: `${username} a été supprimé`,
      });

      return { success: true };
    } catch (error: any) {
      toast({
        title: "Erreur",
        description: error.message,
        variant: "destructive",
      });
      return { success: false, error: error.message };
    }
  };

  const [users, setUsers] = useState<Profile[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      console.log('Chargement des utilisateurs depuis profiles...');
      
      // Essayer directement la table profiles avec une requête simple
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, username, role, is_active, created_at, updated_at, user_id')
        .eq('is_active', true)
        .order('created_at', { ascending: false });
      
      if (profilesError) {
        console.error('Erreur lors de la requête profiles:', profilesError);
        // Utiliser des utilisateurs par défaut si la base de données n'est pas disponible
        setUsers([
          { id: '1', username: 'admin', role: 'admin' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: null },
          { id: '2', username: 'vendeur1', role: 'employee' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: null },
          { id: '3', username: 'vendeur2', role: 'employee' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: null }
        ]);
      } else {
        console.log('Utilisateurs chargés:', profilesData);
        setUsers(profilesData || []);
      }
    } catch (error: any) {
      console.error('Erreur générale chargement utilisateurs:', error);
      // Utiliser des utilisateurs par défaut en cas d'erreur
      setUsers([
        { id: '1', username: 'admin', role: 'admin' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: null },
        { id: '2', username: 'vendeur1', role: 'employee' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: null },
        { id: '3', username: 'vendeur2', role: 'employee' as const, is_active: true, created_at: new Date().toISOString(), updated_at: new Date().toISOString(), user_id: null }
      ]);
    }
    setUsersLoading(false);
  };

  // Charger les utilisateurs au démarrage - toujours charger pour le menu déroulant
  useEffect(() => {
    fetchUsers();
  }, []);

  return {
    user,
    session,
    profile,
    loading,
    isAuthenticated: !!user,
    isAdmin: (profile?.role === 'admin') || (user?.user_metadata?.username?.toLowerCase?.() === 'admin') || (user?.email?.split('@')[0]?.toLowerCase?.() === 'admin') || ((user?.user_metadata as any)?.role === 'admin'),
    signInWithUsername,
    signOut,
    createUserProfile,
    fetchUserProfile,
    // Gestion des utilisateurs
    users,
    usersLoading,
    addUser,
    updatePassword,
    updateRole,
    removeUser,
    fetchUsers,
  };
};