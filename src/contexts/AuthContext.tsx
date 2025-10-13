import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface Profile {
  id: string;
  user_id: string;
  username: string;
  first_name?: string;
  last_name?: string;
  role: 'admin' | 'employee';
  is_active: boolean;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
  users: Profile[];
  addUser: (username: string, firstName: string, lastName: string, password: string, role?: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (username: string, newRole: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  removeUser: (username: string) => Promise<{ success: boolean; error?: string }>;
  fetchUsers: () => Promise<void>;
  updateUser: (username: string, updates: { firstName?: string; lastName?: string; role?: 'admin' | 'employee' }) => Promise<{ success: boolean; error?: string }>;
  updatePassword: (username: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  // Gestion des assurances
  insuranceTypes: InsuranceType[];
  addInsuranceType: (name: string, commission: number) => Promise<{ success: boolean; error?: string }>;
  updateInsuranceType: (id: string, name: string, commission: number) => Promise<{ success: boolean; error?: string }>;
  removeInsuranceType: (id: string) => Promise<{ success: boolean; error?: string }>;
  fetchInsuranceTypes: () => void;
  // Gestion des ventes
  sales: Sale[];
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  deleteSale: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateSale: (id: string, updates: Partial<Omit<Sale, 'id' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>;
  fetchSales: () => void;
  // Gestion des objectifs
  objectives: Objective[];
  addObjective: (objective: Omit<Objective, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateObjective: (id: string, updates: Partial<Objective>) => Promise<{ success: boolean; error?: string }>;
  removeObjective: (id: string) => Promise<{ success: boolean; error?: string }>;
  fetchObjectives: () => void;
}

interface InsuranceType {
  id: string;
  name: string;
  commission: number;
  isActive: boolean;
  createdAt: string;
}

interface Sale {
  id: string;
  employeeName: string;
  clientName: string;
  clientEmail?: string;
  clientPhone?: string;
  reservationNumber: string;
  insuranceTypes: string[];
  commissionAmount: number;
  notes?: string;
  createdAt: string;
}

interface Objective {
  id: string;
  employeeName: string;
  objectiveType: 'amount' | 'sales_count';
  targetAmount: number;
  targetSalesCount: number;
  period: 'monthly' | 'quarterly' | 'yearly';
  startDate: string;
  endDate: string;
  description?: string;
  createdAt: string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  // Écouter les changements d'authentification
  useEffect(() => {
    // Configurer l'écouteur d'abord
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        setTimeout(() => {
          fetchUserProfile(session.user.id);
        }, 0);
      } else {
        setProfile(null);
      }
    });

    // Puis vérifier la session existante
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
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();

      if (error) throw error;

      if (data) {
        setProfile(data);
      }
    } catch (error) {
      console.error('Erreur récupération profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Générer l'email à partir du username
      const email = `${username.toLowerCase()}@aloelocation.internal`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      toast({
        title: "Connexion réussie",
        description: `Bienvenue !`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur connexion:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  const addUser = async (username: string, firstName: string, lastName: string, password: string, role: 'admin' | 'employee' = 'employee'): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { username, firstName, lastName, password, role }
      });

      if (error) throw error;
      if (!data.success) {
        return { success: false, error: data.error };
      }

      toast({
        title: "Utilisateur créé",
        description: `${firstName} ${lastName} (${username}) créé avec succès`,
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      return { success: false, error: error.message || 'Erreur lors de la création' };
    }
  };

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('username');

      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
    }
  };

  const updateUserRole = async (username: string, newRole: 'admin' | 'employee'): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: newRole })
        .eq('username', username);

      if (updateError) throw updateError;

      // Mettre à jour aussi dans user_roles
      const userProfile = users.find(u => u.username === username);
      if (userProfile) {
        await supabase.from('user_roles').delete().eq('user_id', userProfile.user_id);
        await supabase.from('user_roles').insert({ user_id: userProfile.user_id, role: newRole });
      }

      toast({
        title: "Rôle modifié",
        description: `Le rôle de ${username} a été mis à jour`,
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification rôle:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const updateUser = async (username: string, updates: { firstName?: string; lastName?: string; role?: 'admin' | 'employee' }): Promise<{ success: boolean; error?: string }> => {
    try {
      const updateData: any = {};
      if (updates.firstName !== undefined) updateData.first_name = updates.firstName;
      if (updates.lastName !== undefined) updateData.last_name = updates.lastName;
      if (updates.role !== undefined) updateData.role = updates.role;

      const { error } = await supabase
        .from('profiles')
        .update(updateData)
        .eq('username', username);

      if (error) throw error;

      if (updates.role) {
        const userProfile = users.find(u => u.username === username);
        if (userProfile) {
          await supabase.from('user_roles').delete().eq('user_id', userProfile.user_id);
          await supabase.from('user_roles').insert({ user_id: userProfile.user_id, role: updates.role });
        }
      }

      toast({
        title: "Utilisateur modifié",
        description: `Les informations de ${username} ont été mises à jour`,
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification utilisateur:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const updatePassword = async (username: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      // Note: Nécessite les privilèges admin pour modifier le mot de passe d'un autre utilisateur
      // Cette fonctionnalité nécessiterait une edge function supplémentaire
      toast({
        title: "Fonctionnalité non disponible",
        description: "La modification de mot de passe n'est pas encore implémentée",
        variant: "destructive",
      });
      return { success: false, error: "Non implémenté" };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const removeUser = async (username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ is_active: false })
        .eq('username', username);

      if (error) throw error;

      toast({
        title: "Utilisateur désactivé",
        description: `${username} a été désactivé`,
      });

      await fetchUsers();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur désactivation utilisateur:', error);
      return { success: false, error: 'Erreur lors de la désactivation' };
    }
  };

  // Gestion des assurances
  const fetchInsuranceTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('insurance_types')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      setInsuranceTypes((data || []).map(item => ({
        id: item.id,
        name: item.name,
        commission: Number(item.commission),
        isActive: item.is_active,
        createdAt: item.created_at
      })));
    } catch (error) {
      console.error('Erreur récupération assurances:', error);
    }
  };

  const addInsuranceType = async (name: string, commission: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('insurance_types')
        .insert({ name, commission, is_active: true });

      if (error) throw error;

      toast({
        title: "Assurance ajoutée",
        description: `${name} a été ajouté`,
      });

      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout assurance:', error);
      return { success: false, error: 'Erreur lors de l\'ajout' };
    }
  };

  const updateInsuranceType = async (id: string, name: string, commission: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({ name, commission })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Assurance modifiée",
        description: `${name} a été modifié`,
      });

      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification assurance:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const removeInsuranceType = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('insurance_types')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Assurance désactivée",
        description: "L'assurance a été désactivée",
      });

      await fetchInsuranceTypes();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur désactivation assurance:', error);
      return { success: false, error: 'Erreur lors de la désactivation' };
    }
  };

  // Gestion des ventes
  const fetchSales = async () => {
    try {
      const { data, error } = await supabase
        .from('sales')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setSales((data || []).map(sale => ({
        id: sale.id,
        employeeName: sale.employee_name,
        clientName: sale.client_name,
        clientEmail: sale.client_email,
        clientPhone: sale.client_phone,
        reservationNumber: sale.reservation_number,
        insuranceTypes: [], // À implémenter avec sale_insurances
        commissionAmount: Number(sale.commission_amount),
        notes: sale.notes,
        createdAt: sale.created_at
      })));
    } catch (error) {
      console.error('Erreur récupération ventes:', error);
    }
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { data: newSale, error } = await supabase
        .from('sales')
        .insert({
          employee_name: sale.employeeName,
          client_name: sale.clientName,
          client_email: sale.clientEmail,
          client_phone: sale.clientPhone,
          reservation_number: sale.reservationNumber,
          insurance_type_id: insuranceTypes[0]?.id, // Temporaire
          commission_amount: sale.commissionAmount,
          notes: sale.notes,
          status: 'active'
        })
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "Vente ajoutée",
        description: "La vente a été enregistrée",
      });

      await fetchSales();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout vente:', error);
      return { success: false, error: 'Erreur lors de l\'ajout' };
    }
  };

  const deleteSale = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('sales')
        .update({ status: 'archived' })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Vente supprimée",
        description: "La vente a été archivée",
      });

      await fetchSales();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression vente:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  };

  const updateSale = async (id: string, updates: Partial<Omit<Sale, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> => {
    try {
      const updateData: any = {};
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error } = await supabase
        .from('sales')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Vente modifiée",
        description: "La vente a été mise à jour",
      });

      await fetchSales();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification vente:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  // Gestion des objectifs
  const fetchObjectives = async () => {
    try {
      const { data, error } = await supabase
        .from('employee_objectives')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      setObjectives((data || []).map(obj => ({
        id: obj.id,
        employeeName: obj.employee_name,
        objectiveType: obj.objective_type === 'monthly' ? 'amount' : 'sales_count', // Simplification
        targetAmount: Number(obj.target_amount),
        targetSalesCount: obj.target_sales_count,
        period: obj.objective_type,
        startDate: obj.period_start,
        endDate: obj.period_end,
        description: obj.description,
        createdAt: obj.created_at
      })));
    } catch (error) {
      console.error('Erreur récupération objectifs:', error);
    }
  };

  const addObjective = async (objective: Omit<Objective, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('employee_objectives')
        .insert({
          employee_name: objective.employeeName,
          objective_type: objective.period,
          target_amount: objective.targetAmount,
          target_sales_count: objective.targetSalesCount,
          period_start: objective.startDate,
          period_end: objective.endDate,
          description: objective.description,
          is_active: true
        });

      if (error) throw error;

      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été créé",
      });

      await fetchObjectives();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout objectif:', error);
      return { success: false, error: 'Erreur lors de l\'ajout' };
    }
  };

  const updateObjective = async (id: string, updates: Partial<Objective>): Promise<{ success: boolean; error?: string }> => {
    try {
      const updateData: any = {};
      if (updates.targetAmount !== undefined) updateData.target_amount = updates.targetAmount;
      if (updates.targetSalesCount !== undefined) updateData.target_sales_count = updates.targetSalesCount;
      if (updates.description !== undefined) updateData.description = updates.description;

      const { error } = await supabase
        .from('employee_objectives')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Objectif modifié",
        description: "L'objectif a été mis à jour",
      });

      await fetchObjectives();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification objectif:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const removeObjective = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const { error } = await supabase
        .from('employee_objectives')
        .update({ is_active: false })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Objectif désactivé",
        description: "L'objectif a été désactivé",
      });

      await fetchObjectives();
      return { success: true };
    } catch (error: any) {
      console.error('Erreur désactivation objectif:', error);
      return { success: false, error: 'Erreur lors de la désactivation' };
    }
  };

  // Charger les données au démarrage si l'utilisateur est connecté
  useEffect(() => {
    if (profile) {
      fetchUsers();
      fetchInsuranceTypes();
      fetchSales();
      fetchObjectives();
    }
  }, [profile]);

  const value: AuthContextType = {
    user,
    session,
    profile: profile ? {
      id: profile.id,
      user_id: profile.user_id,
      username: profile.username,
      first_name: profile.first_name,
      last_name: profile.last_name,
      role: profile.role,
      is_active: profile.is_active
    } as any : null,
    isAuthenticated: !!user && !!session,
    isAdmin: profile?.role === 'admin',
    loading,
    signIn,
    signOut,
    users,
    addUser,
    updateUserRole,
    removeUser,
    fetchUsers,
    updateUser,
    updatePassword,
    insuranceTypes,
    addInsuranceType,
    updateInsuranceType,
    removeInsuranceType,
    fetchInsuranceTypes,
    sales,
    addSale,
    deleteSale,
    updateSale,
    fetchSales,
    objectives,
    addObjective,
    updateObjective,
    removeObjective,
    fetchObjectives,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};