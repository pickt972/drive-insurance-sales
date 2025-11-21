import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

// Temporary workaround for Supabase types during migration
const supabaseAny = supabase as any;

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: 'user' | 'admin';
  is_active: boolean;
  created_at: string;
}

export function useUsers() {
  const { isAdmin } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  // Récupérer tous les utilisateurs (admin only)
  const getUsers = async () => {
    if (!isAdmin) {
      throw new Error('Accès refusé - Admin uniquement');
    }

    try {
      setLoading(true);

      const { data, error } = await supabaseAny
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de charger les utilisateurs',
        variant: 'destructive',
      });
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Changer le rôle d'un utilisateur
  const updateUserRole = async (userId: string, newRole: 'user' | 'admin') => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      const { error } = await supabaseAny
        .from('profiles')
        .update({ role: newRole })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: '✅ Rôle modifié',
        description: `Nouveau rôle : ${newRole}`,
      });
    } catch (error) {
      console.error('Error updating role:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier le rôle',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Activer/désactiver un utilisateur
  const toggleUserActive = async (userId: string, isActive: boolean) => {
    if (!isAdmin) throw new Error('Accès refusé');

    try {
      setLoading(true);

      const { error } = await supabaseAny
        .from('profiles')
        .update({ is_active: isActive })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: isActive ? '✅ Utilisateur activé' : '⚠️ Utilisateur désactivé',
      });
    } catch (error) {
      console.error('Error toggling user active:', error);
      toast({
        title: '❌ Erreur',
        description: 'Impossible de modifier le statut',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  return {
    loading,
    getUsers,
    updateUserRole,
    toggleUserActive,
  };
}
