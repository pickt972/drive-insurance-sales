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
  // Gestion des ventes avec pagination
  sales: Sale[];
  totalSalesCount: number;
  currentSalesPage: number;
  salesTotalPages: number;
  addSale: (sale: Omit<Sale, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  deleteSale: (id: string) => Promise<{ success: boolean; error?: string }>;
  updateSale: (id: string, updates: Partial<Omit<Sale, 'id' | 'createdAt'>>) => Promise<{ success: boolean; error?: string }>;
  fetchSales: (page?: number) => void;
  nextSalesPage: () => void;
  prevSalesPage: () => void;
  // Gestion des objectifs
  objectives: Objective[];
  addObjective: (objective: Omit<Objective, 'id' | 'createdAt'>) => Promise<{ success: boolean; error?: string }>;
  updateObjective: (id: string, updates: Partial<Objective>) => Promise<{ success: boolean; error?: string }>;
  removeObjective: (id: string) => Promise<{ success: boolean; error?: string }>;
  fetchObjectives: () => void;
  checkAdminStatus: (userId: string) => Promise<void>;
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
  const [isAdmin, setIsAdmin] = useState(false);
  
  // États pour la pagination des ventes
  const [currentSalesPage, setCurrentSalesPage] = useState(0);
  const [totalSalesCount, setTotalSalesCount] = useState(0);
  const PAGE_SIZE = 20;
  const salesTotalPages = Math.ceil(totalSalesCount / PAGE_SIZE);

  // Vérification explicite du rôle admin avec logs visibles + RETRY
  const checkAdminStatus = async (userId: string): Promise<void> => {
    try {
      if (!userId) {
        setIsAdmin(false);
        return;
      }

      const supabaseClient: any = supabase;
      
      // Retry avec délai pour schema cache
      let lastError: any = null;
      for (let attempt = 0; attempt < 3; attempt++) {
        const { data, error } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userId);

        if (!error) {
          const hasAdminRole = Array.isArray(data) && data.some((row: any) => row.role === 'admin');
          setIsAdmin(!!hasAdminRole);
          return;
        }

        lastError = error;
        const isRetryable = error?.code === 'PGRST002' || error?.message?.includes('schema cache');
        
        if (isRetryable && attempt < 2) {
          const delay = 500 * Math.pow(2, attempt);
          await new Promise(r => setTimeout(r, delay));
          continue;
        }
        
        if (import.meta.env.DEV) {
          console.error('Erreur query user_roles:', error);
        }
        setIsAdmin(false);
        return;
      }
      
      if (import.meta.env.DEV) {
        console.error('Échec après 3 tentatives:', lastError);
      }
      setIsAdmin(false);
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error('Erreur exception checkAdminStatus:', err);
      }
      setIsAdmin(false);
    }
  };


  // Initialiser l'admin au premier lancement
  useEffect(() => {
    const initializeAdmin = async () => {
      try {
        // 1) S'assurer qu'un compte admin de base existe
        await supabase.functions.invoke('initialize-admin');

        // 2) Promouvoir/assurer les rôles admin pour Stef et Nadia (idempotent)
        await supabase.functions.invoke('ensure-admins', {
          body: { usernames: ['stef', 'nadia'] }
        });
      } catch (error) {
        if (import.meta.env.DEV) {
          console.error('Erreur appel initialize/ensure-admin:', error);
        }
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
            checkAdminStatus(session.user.id);
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
        setTimeout(() => {
          loadUserProfile(session.user.id);
          checkAdminStatus(session.user.id);
        }, 0);
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

      const shouldRetry = (e: any) => {
        const msg = String(e?.message ?? e);
        return msg.includes('schema cache') || msg.includes('PGRST002') || msg.includes('503');
      };

      async function withRetry<T>(
        fn: () => Promise<{ data: T; error: any }>,
        attempts = 4,
        baseDelay = 300
      ): Promise<{ data: T; error: any }> {
        let last: any = null;
        for (let i = 0; i < attempts; i++) {
          const res = await fn();
          if (!res.error) return res;
          if (shouldRetry(res.error)) {
            await new Promise((r) => setTimeout(r, baseDelay * Math.pow(2, i)));
            last = res.error;
            continue;
          }
          return res; // non-retryable
        }
        return { data: null as unknown as T, error: last };
      }

      // Charger le profil via RPC sécurité définer
      const profileRpc: any = await withRetry(() =>
        supabaseClient
          .rpc('get_current_profile')
          .maybeSingle()
      );

      const { data: profileData, error: profileError } = profileRpc;

      if (profileError) {
        throw profileError;
      }

      if (!profileData) {
        throw new Error('Profil introuvable pour cet utilisateur');
      }

      // Vérifier le rôle admin via fonction has_role (évite RLS complexes)
      const adminCheck: any = await withRetry(() =>
        supabaseClient.rpc('has_role', { _user_id: userId, _role: 'admin' })
      );

      const { data: hasAdmin, error: adminError } = adminCheck;

      // Déterminer le rôle avec fallback robuste
      let userRole: 'admin' | 'employee' = 'employee';
      let isUserAdmin = false;
      
      if (hasAdmin === true) {
        userRole = 'admin';
        isUserAdmin = true;
      } else if (profileData?.role === 'admin') {
        userRole = 'admin';
        isUserAdmin = true;
      } else {
        // Fallback: vérifier directement dans user_roles si les RPC échouent
        const { data: rolesData } = await supabaseClient
          .from('user_roles')
          .select('role')
          .eq('user_id', userId)
          .eq('role', 'admin')
          .maybeSingle();
        
        if (rolesData) {
          userRole = 'admin';
          isUserAdmin = true;
        }
      }

      // Mettre à jour l'état isAdmin
      setIsAdmin(isUserAdmin);
      
      if (import.meta.env.DEV) {
        console.log(`✅ Admin status checked: ${isUserAdmin} for user ${profileData.username}`);
      }

      if (profileData) {
        const userProfile: User = {
          id: profileData.id,
          username: profileData.username,
          firstName: profileData.first_name || '',
          lastName: profileData.last_name || '',
          role: userRole,
          isActive: profileData.is_active,
          createdAt: profileData.created_at || new Date().toISOString(),
        } as any;
        setUser(userProfile);
      }
    } catch (error) {
      // En production, utiliser un système de logging approprié
      if (import.meta.env.DEV) {
        console.error('Erreur chargement profil:', error);
      }
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
        setTimeout(() => {
          loadUserProfile(data.user!.id);
          checkAdminStatus(data.user!.id);
        }, 0);
      }

      return { success: true };
    } catch (error) {
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSupabaseUser(null);
    setSession(null);
    setIsAdmin(false);
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

      const usersList: User[] = await Promise.all(
        (data || []).map(async (profile: any) => {
          // Charger les rôles depuis user_roles pour chaque utilisateur
          const rolesResult: any = await supabaseClient
            .from('user_roles')
            .select('role')
            .eq('user_id', profile.user_id);
          
          const { data: rolesData } = rolesResult;
          
          // Déterminer le rôle (admin si dans user_roles, sinon fallback profil)
          const hasAdminRole = rolesData?.some((r: any) => r.role === 'admin');
          const profileSaysAdmin = profile.role === 'admin';
          const userRole = (hasAdminRole || profileSaysAdmin) ? 'admin' : 'employee';

          return {
            id: profile.id,
            username: profile.username,
            firstName: profile.first_name || '',
            lastName: profile.last_name || '',
            role: userRole,
            isActive: profile.is_active,
            createdAt: profile.created_at
          };
        })
      );

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
  const fetchSales = async (page: number = currentSalesPage) => {
    try {
      const supabaseClient: any = supabase;
      
      // 1. Compter le nombre total de ventes
      const { count, error: countError } = await supabaseClient
        .from('sales')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');
      
      if (countError) throw countError;
      setTotalSalesCount(count || 0);
      
      // 2. Récupérer les ventes avec pagination
      const start = page * PAGE_SIZE;
      const end = start + PAGE_SIZE - 1;
      
      const { data: salesData, error } = await supabaseClient
        .from('sales')
        .select(`
          *,
          sale_insurances (
            insurance_type:insurance_types (
              id,
              name,
              commission
            )
          )
        `)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(start, end);

      if (error) throw error;

      // Transformer les données Supabase en format local
      const transformedSales: Sale[] = (salesData || []).map((sale: any) => ({
        id: sale.id,
        employeeName: sale.employee_name,
        clientName: sale.client_name,
        clientEmail: sale.client_email,
        clientPhone: sale.client_phone,
        reservationNumber: sale.reservation_number,
        insuranceTypes: sale.sale_insurances?.map((si: any) => si.insurance_type?.name).filter(Boolean) || [],
        commissionAmount: parseFloat(sale.commission_amount || 0),
        notes: sale.notes,
        createdAt: sale.created_at
      }));

      setSales(transformedSales);
      setCurrentSalesPage(page);
    } catch (error: any) {
      console.error('Erreur récupération ventes:', error);
      toast({
        title: "Erreur",
        description: "Impossible de charger les ventes",
        variant: "destructive",
      });
    }
  };
  
  const nextSalesPage = () => {
    if (currentSalesPage < salesTotalPages - 1) {
      fetchSales(currentSalesPage + 1);
    }
  };
  
  const prevSalesPage = () => {
    if (currentSalesPage > 0) {
      fetchSales(currentSalesPage - 1);
    }
  };

  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabaseClient: any = supabase;
      // 1. Créer la vente principale
      const { data: saleData, error: saleError } = await supabaseClient
        .from('sales')
        .insert({
          employee_name: sale.employeeName,
          client_name: sale.clientName,
          client_email: sale.clientEmail,
          client_phone: sale.clientPhone,
          reservation_number: sale.reservationNumber,
          commission_amount: sale.commissionAmount,
          notes: sale.notes,
          status: 'active',
          // Utiliser la première assurance comme référence (temporaire)
          insurance_type_id: insuranceTypes.find(it => it.name === sale.insuranceTypes[0])?.id || insuranceTypes[0]?.id
        })
        .select()
        .single();

      if (saleError) throw saleError;
      if (!saleData) throw new Error('Aucune donnée retournée');

      // 2. Créer les liens sale_insurances
      const saleInsurances = sale.insuranceTypes.map(insuranceName => {
        const insurance = insuranceTypes.find(it => it.name === insuranceName);
        return {
          sale_id: saleData.id,
          insurance_type_id: insurance?.id,
          commission_amount: insurance?.commission || 0
        };
      }).filter(si => si.insurance_type_id);

      if (saleInsurances.length > 0) {
        const { error: insurancesError } = await supabaseClient
          .from('sale_insurances')
          .insert(saleInsurances);

        if (insurancesError) throw insurancesError;
      }

      await fetchSales();

      toast({
        title: "Vente ajoutée",
        description: "La vente a été enregistrée",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur ajout vente:', error);
      return { success: false, error: error.message || 'Erreur lors de l\'ajout' };
    }
  };

  const deleteSale = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabaseClient: any = supabase;
      // Supprimer les sale_insurances (cascade devrait le faire automatiquement)
      const { error } = await supabaseClient
        .from('sales')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await fetchSales();

      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur suppression vente:', error);
      return { success: false, error: error.message || 'Erreur lors de la suppression' };
    }
  };

  const updateSale = async (id: string, updates: Partial<Omit<Sale, 'id' | 'createdAt'>>): Promise<{ success: boolean; error?: string }> => {
    try {
      const supabaseClient: any = supabase;
      // 1. Mettre à jour la vente principale
      const updateData: any = {};
      if (updates.clientName) updateData.client_name = updates.clientName;
      if (updates.clientEmail !== undefined) updateData.client_email = updates.clientEmail;
      if (updates.clientPhone !== undefined) updateData.client_phone = updates.clientPhone;
      if (updates.reservationNumber) updateData.reservation_number = updates.reservationNumber;
      if (updates.commissionAmount !== undefined) updateData.commission_amount = updates.commissionAmount;
      if (updates.notes !== undefined) updateData.notes = updates.notes;

      const { error: saleError } = await supabaseClient
        .from('sales')
        .update(updateData)
        .eq('id', id);

      if (saleError) throw saleError;

      // 2. Si les assurances ont changé, mettre à jour sale_insurances
      if (updates.insuranceTypes) {
        // Supprimer les anciennes
        await supabaseClient
          .from('sale_insurances')
          .delete()
          .eq('sale_id', id);

        // Ajouter les nouvelles
        const saleInsurances = updates.insuranceTypes.map(insuranceName => {
          const insurance = insuranceTypes.find(it => it.name === insuranceName);
          return {
            sale_id: id,
            insurance_type_id: insurance?.id,
            commission_amount: insurance?.commission || 0
          };
        }).filter(si => si.insurance_type_id);

        if (saleInsurances.length > 0) {
          const { error: insurancesError } = await supabaseClient
            .from('sale_insurances')
            .insert(saleInsurances);

          if (insurancesError) throw insurancesError;
        }
      }

      await fetchSales();

      toast({
        title: "Vente modifiée",
        description: "La vente a été mise à jour",
      });

      return { success: true };
    } catch (error: any) {
      console.error('Erreur modification vente:', error);
      return { success: false, error: error.message || 'Erreur lors de la modification' };
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
    isAuthenticated: !!session,
    isAdmin: isAdmin,
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
    totalSalesCount,
    currentSalesPage,
    salesTotalPages,
    addSale,
    deleteSale,
    updateSale,
    fetchSales,
    nextSalesPage,
    prevSalesPage,
    objectives,
    addObjective,
    updateObjective,
    removeObjective,
    fetchObjectives,
    checkAdminStatus,
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