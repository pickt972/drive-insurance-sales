import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';
import { versioningSystem } from '@/lib/versioning';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser, Session } from '@supabase/supabase-js';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  role: 'admin' | 'employee';
  isActive: boolean;
  createdAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  loading: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => void;
  users: User[];
  addUser: (username: string, firstName: string, lastName: string, password: string, role?: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (username: string, newRole: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  removeUser: (username: string) => Promise<{ success: boolean; error?: string }>;
  fetchUsers: () => void;
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

// Données par défaut
const DEFAULT_USERS: User[] = [
  {
    id: '1',
    username: 'admin',
    firstName: 'Administrateur',
    lastName: 'Système',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'vendeur1',
    firstName: 'Jean',
    lastName: 'Dupont',
    role: 'employee',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    username: 'vendeur2',
    firstName: 'Marie',
    lastName: 'Martin',
    role: 'employee',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '4',
    username: 'julie',
    firstName: 'Julie',
    lastName: 'Misat',
    role: 'employee',
    isActive: true,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_INSURANCE_TYPES: InsuranceType[] = [
  { id: '1', name: 'Assurance Tous Risques', commission: 25.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '2', name: 'Assurance Vol/Incendie', commission: 18.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '3', name: 'Assurance Bris de Glace', commission: 12.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '4', name: 'Assurance Conducteur Additionnel', commission: 8.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '5', name: 'Assurance Annulation', commission: 15.00, isActive: true, createdAt: new Date().toISOString() },
  { id: '6', name: 'Assurance Assistance Panne', commission: 10.00, isActive: true, createdAt: new Date().toISOString() }
];

const DEFAULT_SALES: Sale[] = [
  {
    id: '1',
    employeeName: 'vendeur1',
    clientName: 'Pierre Durand',
    clientEmail: 'pierre.durand@email.com',
    clientPhone: '06.12.34.56.78',
    reservationNumber: 'LOC-2024-001',
    insuranceTypes: ['Assurance Tous Risques', 'Assurance Vol/Incendie'],
    commissionAmount: 43.00,
    notes: 'Client fidèle',
    createdAt: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: '2',
    employeeName: 'vendeur2',
    clientName: 'Sophie Martin',
    clientEmail: 'sophie.martin@email.com',
    reservationNumber: 'LOC-2024-002',
    insuranceTypes: ['Assurance Tous Risques'],
    commissionAmount: 25.00,
    createdAt: new Date(Date.now() - 172800000).toISOString()
  }
];

const DEFAULT_OBJECTIVES: Objective[] = [
  {
    id: '1',
    employeeName: 'vendeur1',
    objectiveType: 'amount',
    targetAmount: 500.00,
    targetSalesCount: 20,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    description: 'Objectif mensuel Jean Dupont',
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    employeeName: 'vendeur2',
    objectiveType: 'sales_count',
    targetAmount: 400.00,
    targetSalesCount: 15,
    period: 'monthly',
    startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString(),
    endDate: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0).toISOString(),
    description: 'Objectif mensuel Marie Martin',
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin': 'admin123',
  'vendeur1': 'vendeur123',
  'vendeur2': 'vendeur123',
  'julie': 'julie123'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  // Initialiser l'admin au premier lancement
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        const { data, error } = await supabase.functions.invoke('initialize-admin');
        if (error) {
          console.error('Erreur initialisation admin:', error);
        } else {
          console.log('Initialisation admin:', data);
        }
      } catch (error) {
        console.error('Erreur appel initialize-admin:', error);
      }
    };

    initializeAdmin();
  }, []);

  // Initialiser l'authentification Supabase
  useEffect(() => {
    // Écouter les changements d'auth
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setSupabaseUser(session?.user ?? null);
        
        // Charger le profil utilisateur si connecté
        if (session?.user) {
          setTimeout(() => {
            loadUserProfile(session.user.id);
          }, 0);
        } else {
          setUser(null);
        }
      }
    );

    // Vérifier la session existante
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setSupabaseUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Charger les données initiales
  useEffect(() => {
    if (user) {
      fetchInsuranceTypes();
      fetchSales();
      fetchObjectives();
    }
  }, [user]);

  const loadUserProfile = async (userId: string) => {
    try {
      const supabaseClient: any = supabase;
      const result: any = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .single();
      
      const { data, error } = result;

      if (error) throw error;

      if (data) {
        const userProfile: User = {
          id: data.id,
          username: data.username,
          firstName: data.first_name || '',
          lastName: data.last_name || '',
          role: data.role as 'admin' | 'employee',
          isActive: data.is_active,
          createdAt: data.created_at
        };
        setUser(userProfile);
      }
    } catch (error) {
      console.error('Erreur chargement profil:', error);
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const email = `${username.toLowerCase()}@aloelocation.internal`;
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { success: false, error: 'Nom d\'utilisateur ou mot de passe incorrect' };
      }

      if (data.user) {
        toast({
          title: "Connexion réussie",
          description: `Bienvenue !`,
        });
      }

      return { success: true };
    } catch (error) {
      console.error('Erreur connexion:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  const addUser = async (username: string, firstName: string, lastName: string, password: string, role: 'admin' | 'employee' = 'employee'): Promise<{ success: boolean; error?: string }> => {
    try {
      versioningSystem.createVersion(
        `Ajout utilisateur: ${firstName} ${lastName}`,
        [`Nouvel utilisateur: ${username} (${role})`],
        user?.firstName + ' ' + user?.lastName || 'Système'
      );

      const { data, error } = await supabase.functions.invoke('create-user', {
        body: { username, firstName, lastName, password, role }
      });

      if (error) throw error;
      if (!data.success) {
        return { success: false, error: data.error || 'Erreur lors de la création' };
      }

      await fetchUsers();

      toast({
        title: "Utilisateur créé",
        description: `${firstName} ${lastName} (${username}) créé avec succès`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur création utilisateur:', error);
      return { success: false, error: error.message || 'Erreur lors de la création' };
    }
  };

  const updateUserRole = async (username: string, newRole: 'admin' | 'employee'): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsers = localStorage.getItem('aloelocation_users');
      if (!storedUsers) {
        return { success: false, error: 'Erreur système' };
      }

      const usersList: User[] = JSON.parse(storedUsers);
      const updatedUsers = usersList.map(u => 
        u.username === username ? { ...u, role: newRole } : u
      );

      localStorage.setItem('aloelocation_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);

      // Mettre à jour l'utilisateur connecté si c'est lui
      if (user?.username === username) {
        const updatedUser = { ...user, role: newRole };
        setUser(updatedUser);
        localStorage.setItem('aloelocation_current_user', JSON.stringify(updatedUser));
      }

      toast({
        title: "Rôle modifié",
        description: `Le rôle de ${username} a été mis à jour`,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur modification rôle:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const updateUser = async (username: string, updates: { firstName?: string; lastName?: string; role?: 'admin' | 'employee' }): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsers = localStorage.getItem('aloelocation_users');
      const storedPasswords = localStorage.getItem('aloelocation_passwords');
      if (!storedUsers) {
        return { success: false, error: 'Erreur système' };
      }

      const usersList: User[] = JSON.parse(storedUsers);
      const passwordsList: Record<string, string> = JSON.parse(storedPasswords || '{}');
      
      const updatedUsers = usersList.map(u => 
        u.username === username ? { ...u, ...updates } : u
      );

      localStorage.setItem('aloelocation_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);

      toast({
        title: "Utilisateur modifié",
        description: `Les informations de ${username} ont été mises à jour`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification utilisateur:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const updatePassword = async (username: string, newPassword: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedPasswords = localStorage.getItem('aloelocation_passwords');
      if (!storedPasswords) {
        return { success: false, error: 'Erreur système' };
      }

      const passwordsList: Record<string, string> = JSON.parse(storedPasswords);
      passwordsList[username] = newPassword;

      localStorage.setItem('aloelocation_passwords', JSON.stringify(passwordsList));

      toast({
        title: "Mot de passe modifié",
        description: `Le mot de passe de ${username} a été mis à jour`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification mot de passe:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const removeUser = async (username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsers = localStorage.getItem('aloelocation_users');
      if (!storedUsers) {
        return { success: false, error: 'Erreur système' };
      }

      const usersList: User[] = JSON.parse(storedUsers);
      const updatedUsers = usersList.map(u => 
        u.username === username ? { ...u, isActive: false } : u
      );

      localStorage.setItem('aloelocation_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);

      toast({
        title: "Utilisateur désactivé",
        description: `${username} a été désactivé`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur désactivation utilisateur:', error);
      return { success: false, error: 'Erreur lors de la désactivation' };
    }
  };

  const fetchUsers = async () => {
    try {
      const supabaseClient: any = supabase;
      const result: any = await supabaseClient
        .from('profiles')
        .select('*')
        .eq('is_active', true)
        .order('username');
      
      const { data, error } = result;

      if (error) throw error;

      const usersList: User[] = (data || []).map((profile: any) => ({
        id: profile.id,
        username: profile.username,
        firstName: profile.first_name || '',
        lastName: profile.last_name || '',
        role: profile.role as 'admin' | 'employee',
        isActive: profile.is_active,
        createdAt: profile.created_at
      }));

      setUsers(usersList);
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
    }
  };

  // Gestion des assurances
  const fetchInsuranceTypes = () => {
    const stored = localStorage.getItem('aloelocation_insurance_types');
    if (stored) {
      setInsuranceTypes(JSON.parse(stored));
    }
  };

  const addInsuranceType = async (name: string, commission: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const newType: InsuranceType = {
        id: Date.now().toString(),
        name,
        commission,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const updated = [...insuranceTypes, newType];
      localStorage.setItem('aloelocation_insurance_types', JSON.stringify(updated));
      setInsuranceTypes(updated);

      toast({
        title: "Assurance ajoutée",
        description: `${name} a été ajouté`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout assurance:', error);
      return { success: false, error: 'Erreur lors de l\'ajout' };
    }
  };

  const updateInsuranceType = async (id: string, name: string, commission: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = insuranceTypes.map(t => 
        t.id === id ? { ...t, name, commission } : t
      );

      localStorage.setItem('aloelocation_insurance_types', JSON.stringify(updated));
      setInsuranceTypes(updated);

      toast({
        title: "Assurance modifiée",
        description: `${name} a été modifié`,
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification assurance:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const removeInsuranceType = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = insuranceTypes.map(t => 
        t.id === id ? { ...t, isActive: false } : t
      );

      localStorage.setItem('aloelocation_insurance_types', JSON.stringify(updated));
      setInsuranceTypes(updated);

      toast({
        title: "Assurance désactivée",
        description: "L'assurance a été désactivée",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur désactivation assurance:', error);
      return { success: false, error: 'Erreur lors de la désactivation' };
    }
  };

  // Gestion des ventes
  const fetchSales = () => {
    const stored = localStorage.getItem('aloelocation_sales');
    if (stored) {
      setSales(JSON.parse(stored));
    }
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const newSale: Sale = {
        ...sale,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updated = [newSale, ...sales];
      localStorage.setItem('aloelocation_sales', JSON.stringify(updated));
      setSales(updated);

      toast({
        title: "Vente ajoutée",
        description: "La vente a été enregistrée",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout vente:', error);
      return { success: false, error: 'Erreur lors de l\'ajout' };
    }
  };

  const deleteSale = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = sales.filter(s => s.id !== id);
      localStorage.setItem('aloelocation_sales', JSON.stringify(updated));
      setSales(updated);

      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression vente:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  };

  const updateSale = async (id: string, updates: Partial<Omit<Sale, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = sales.map(s => 
        s.id === id ? { ...s, ...updates } : s
      );

      localStorage.setItem('aloelocation_sales', JSON.stringify(updated));
      setSales(updated);

      toast({
        title: "Vente modifiée",
        description: "La vente a été mise à jour",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification vente:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  // Gestion des objectifs
  const fetchObjectives = () => {
    const stored = localStorage.getItem('aloelocation_objectives');
    if (stored) {
      setObjectives(JSON.parse(stored));
    }
  };

  const addObjective = async (objective: Omit<Objective, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const newObjective: Objective = {
        ...objective,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updated = [...objectives, newObjective];
      localStorage.setItem('aloelocation_objectives', JSON.stringify(updated));
      setObjectives(updated);

      toast({
        title: "Objectif ajouté",
        description: "L'objectif a été créé",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout objectif:', error);
      return { success: false, error: 'Erreur lors de l\'ajout' };
    }
  };

  const updateObjective = async (id: string, updates: Partial<Objective>): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = objectives.map(o => 
        o.id === id ? { ...o, ...updates } : o
      );

      localStorage.setItem('aloelocation_objectives', JSON.stringify(updated));
      setObjectives(updated);

      toast({
        title: "Objectif modifié",
        description: "L'objectif a été mis à jour",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification objectif:', error);
      return { success: false, error: 'Erreur lors de la modification' };
    }
  };

  const removeObjective = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updated = objectives.filter(o => o.id !== id);
      localStorage.setItem('aloelocation_objectives', JSON.stringify(updated));
      setObjectives(updated);

      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression objectif:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  };

  const value: AuthContextType = {
    user,
    profile: user,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
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