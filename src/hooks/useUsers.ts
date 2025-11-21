import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types
const supabaseAny = supabase as any;

export interface User {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
  // Compatibilité anciens champs
  username?: string;
  firstName?: string;
  lastName?: string;
}

export function useUsers() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    if (!isAdmin) return;

    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Mapper pour compatibilité
      const mappedUsers = (data || []).map((u: any) => ({
        ...u,
        username: u.email.split('@')[0],
        firstName: u.full_name.split(' ')[0] || '',
        lastName: u.full_name.split(' ').slice(1).join(' ') || '',
      }));

      setUsers(mappedUsers);
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (userData: { email: string; password: string; full_name: string; role?: string }) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      // Créer l'utilisateur via Supabase Admin API
      const { data, error } = await supabase.auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true,
        user_metadata: {
          full_name: userData.full_name,
        },
      });

      if (error) throw error;

      // Mettre à jour le rôle si fourni
      if (userData.role && data.user) {
        await supabaseAny
          .from('profiles')
          .update({ role: userData.role })
          .eq('id', data.user.id);
      }

      toast({
        title: '✅ Utilisateur créé',
        description: userData.email,
      });

      await fetchUsers();
      return data;
    } catch (error: any) {
      console.error('Error adding user:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de créer l\'utilisateur',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateUser = async (userId: string, updates: Partial<User>) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      const { error } = await supabaseAny
        .from('profiles')
        .update({
          full_name: updates.full_name || updates.firstName + ' ' + updates.lastName,
          role: updates.role,
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '✅ Utilisateur modifié',
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error updating user:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier l\'utilisateur',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updateUserRole = async (userId: string, role: 'user' | 'admin') => {
    return updateUser(userId, { role });
  };

  const removeUser = async (userId: string) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      const { error } = await supabaseAny
        .from('profiles')
        .update({ is_active: false })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '✅ Utilisateur désactivé',
      });

      await fetchUsers();
    } catch (error) {
      console.error('Error removing user:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de désactiver l\'utilisateur',
        variant: 'destructive',
      });
      throw error;
    }
  };

  const updatePassword = async (userId: string, newPassword: string) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      const { error } = await supabase.auth.admin.updateUserById(userId, {
        password: newPassword,
      });

      if (error) throw error;

      toast({
        title: '✅ Mot de passe modifié',
      });
    } catch (error: any) {
      console.error('Error updating password:', error);
      toast({
        title: '❌ Erreur',
        description: error.message || 'Impossible de modifier le mot de passe',
        variant: 'destructive',
      });
      throw error;
    }
  };

  return {
    users,
    loading,
    fetchUsers,
    addUser,
    updateUser,
    updateUserRole,
    removeUser,
    updatePassword,
  };
}
