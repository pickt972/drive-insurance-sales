import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { toast } from '@/hooks/use-toast';

interface User {
  id: string;
  username: string;
  firstName: string;
  lastName: string;
  email: string;
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
  addUser: (username: string, firstName: string, lastName: string, email: string, password: string, role?: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  updateUserRole: (username: string, newRole: 'admin' | 'employee') => Promise<{ success: boolean; error?: string }>;
  removeUser: (username: string) => Promise<{ success: boolean; error?: string }>;
  fetchUsers: () => void;
  updateUser: (username: string, updates: { firstName?: string; lastName?: string; email?: string; role?: 'admin' | 'employee' }) => Promise<{ success: boolean; error?: string }>;
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
    email: 'admin@aloelocation.com',
    role: 'admin',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    username: 'vendeur1',
    firstName: 'Jean',
    lastName: 'Dupont',
    email: 'vendeur1@aloelocation.com',
    role: 'employee',
    isActive: true,
    createdAt: new Date().toISOString()
  },
  {
    id: '3',
    username: 'vendeur2',
    firstName: 'Marie',
    lastName: 'Martin',
    email: 'vendeur2@aloelocation.com',
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
  'vendeur2': 'vendeur123'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [insuranceTypes, setInsuranceTypes] = useState<InsuranceType[]>([]);
  const [sales, setSales] = useState<Sale[]>([]);
  const [objectives, setObjectives] = useState<Objective[]>([]);

  // Initialiser les données au premier lancement
  useEffect(() => {
    initializeData();
  }, []);

  const initializeData = () => {
    try {
      // Initialiser les utilisateurs s'ils n'existent pas
      const storedUsers = localStorage.getItem('aloelocation_users');
      if (!storedUsers) {
        localStorage.setItem('aloelocation_users', JSON.stringify(DEFAULT_USERS));
        localStorage.setItem('aloelocation_passwords', JSON.stringify(DEFAULT_PASSWORDS));
        localStorage.setItem('aloelocation_insurance_types', JSON.stringify(DEFAULT_INSURANCE_TYPES));
        localStorage.setItem('aloelocation_sales', JSON.stringify(DEFAULT_SALES));
        localStorage.setItem('aloelocation_objectives', JSON.stringify(DEFAULT_OBJECTIVES));
        setUsers(DEFAULT_USERS);
        setInsuranceTypes(DEFAULT_INSURANCE_TYPES);
        setSales(DEFAULT_SALES);
        setObjectives(DEFAULT_OBJECTIVES);
      } else {
        setUsers(JSON.parse(storedUsers));
        const storedInsurance = localStorage.getItem('aloelocation_insurance_types');
        const storedSales = localStorage.getItem('aloelocation_sales');
        const storedObjectives = localStorage.getItem('aloelocation_objectives');
        
        setInsuranceTypes(storedInsurance ? JSON.parse(storedInsurance) : DEFAULT_INSURANCE_TYPES);
        setSales(storedSales ? JSON.parse(storedSales) : DEFAULT_SALES);
        setObjectives(storedObjectives ? JSON.parse(storedObjectives) : DEFAULT_OBJECTIVES);
      }

      // Vérifier si un utilisateur est connecté
      const storedUser = localStorage.getItem('aloelocation_current_user');
      if (storedUser) {
        const userData = JSON.parse(storedUser);
        setUser(userData);
      }
    } catch (error) {
      console.error('Erreur initialisation données:', error);
      // En cas d'erreur, réinitialiser
      localStorage.removeItem('aloelocation_users');
      localStorage.removeItem('aloelocation_passwords');
      localStorage.removeItem('aloelocation_insurance_types');
      localStorage.removeItem('aloelocation_sales');
      localStorage.removeItem('aloelocation_objectives');
      localStorage.removeItem('aloelocation_current_user');
      setUsers(DEFAULT_USERS);
      setInsuranceTypes(DEFAULT_INSURANCE_TYPES);
      setSales(DEFAULT_SALES);
      setObjectives(DEFAULT_OBJECTIVES);
      localStorage.setItem('aloelocation_users', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('aloelocation_passwords', JSON.stringify(DEFAULT_PASSWORDS));
      localStorage.setItem('aloelocation_insurance_types', JSON.stringify(DEFAULT_INSURANCE_TYPES));
      localStorage.setItem('aloelocation_sales', JSON.stringify(DEFAULT_SALES));
      localStorage.setItem('aloelocation_objectives', JSON.stringify(DEFAULT_OBJECTIVES));
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (username: string, password: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsers = localStorage.getItem('aloelocation_users');
      const storedPasswords = localStorage.getItem('aloelocation_passwords');
      
      if (!storedUsers || !storedPasswords) {
        return { success: false, error: 'Données utilisateurs non trouvées' };
      }

      const usersList: User[] = JSON.parse(storedUsers);
      const passwordsList: Record<string, string> = JSON.parse(storedPasswords);

      // Vérifier si l'utilisateur existe et est actif
      const foundUser = usersList.find(u => u.username === username && u.isActive);
      if (!foundUser) {
        return { success: false, error: 'Utilisateur non trouvé ou inactif' };
      }

      // Vérifier le mot de passe
      if (passwordsList[username] !== password) {
        return { success: false, error: 'Mot de passe incorrect' };
      }

      // Connexion réussie
      setUser(foundUser);
      localStorage.setItem('aloelocation_current_user', JSON.stringify(foundUser));
      
      toast({
        title: "Connexion réussie",
        description: `Bienvenue ${foundUser.username} !`,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur connexion:', error);
      return { success: false, error: 'Erreur lors de la connexion' };
    }
  };

  const signOut = () => {
    setUser(null);
    localStorage.removeItem('aloelocation_current_user');
    toast({
      title: "Déconnexion réussie",
      description: "À bientôt !",
    });
  };

  const addUser = async (username: string, firstName: string, lastName: string, email: string, password: string, role: 'admin' | 'employee' = 'employee'): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsers = localStorage.getItem('aloelocation_users');
      const storedPasswords = localStorage.getItem('aloelocation_passwords');
      
      if (!storedUsers || !storedPasswords) {
        return { success: false, error: 'Erreur système' };
      }

      const usersList: User[] = JSON.parse(storedUsers);
      const passwordsList: Record<string, string> = JSON.parse(storedPasswords);

      // Vérifier si l'utilisateur existe déjà
      if (usersList.find(u => u.username === username)) {
        return { success: false, error: 'Nom d\'utilisateur déjà utilisé' };
      }

      if (usersList.find(u => u.email === email)) {
        return { success: false, error: 'Email déjà utilisé' };
      }

      // Créer le nouvel utilisateur
      const newUser: User = {
        id: Date.now().toString(),
        username,
        firstName,
        lastName,
        email,
        role,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const updatedUsers = [...usersList, newUser];
      const updatedPasswords = { ...passwordsList, [username]: password };

      localStorage.setItem('aloelocation_users', JSON.stringify(updatedUsers));
      localStorage.setItem('aloelocation_passwords', JSON.stringify(updatedPasswords));
      
      setUsers(updatedUsers);

      toast({
        title: "Utilisateur créé",
        description: `${username} a été créé avec succès`,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur création utilisateur:', error);
      return { success: false, error: 'Erreur lors de la création' };
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

  const updateUser = async (username: string, updates: { firstName?: string; lastName?: string; email?: string; role?: 'admin' | 'employee' }): Promise<{ success: boolean; error?: string }> => {
    try {
      const storedUsers = localStorage.getItem('aloelocation_users');
      if (!storedUsers) {
        return { success: false, error: 'Erreur système' };
      }

      const usersList: User[] = JSON.parse(storedUsers);
      
      // Vérifier si le nouvel email est déjà utilisé
      if (updates.email) {
        const emailExists = usersList.find(u => u.email === updates.email && u.username !== username);
        if (emailExists) {
          return { success: false, error: 'Email déjà utilisé' };
        }
      }

      const updatedUsers = usersList.map(u => 
        u.username === username ? { ...u, ...updates } : u
      );

      localStorage.setItem('aloelocation_users', JSON.stringify(updatedUsers));
      setUsers(updatedUsers);

      // Mettre à jour l'utilisateur connecté si c'est lui
      if (user?.username === username) {
        const updatedUser = { ...user, ...updates };
        setUser(updatedUser);
        localStorage.setItem('aloelocation_current_user', JSON.stringify(updatedUser));
      }

      toast({
        title: "Utilisateur modifié",
        description: `Les informations de ${username} ont été mises à jour`,
      });

      return { success: true };
    } catch (error) {
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
      const updatedPasswords = { ...passwordsList, [username]: newPassword };

      localStorage.setItem('aloelocation_passwords', JSON.stringify(updatedPasswords));

      toast({
        title: "Mot de passe modifié",
        description: `Le mot de passe de ${username} a été mis à jour`,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur modification mot de passe:', error);
      return { success: false, error: 'Erreur lors de la modification du mot de passe' };
    }
  };
  const removeUser = async (username: string): Promise<{ success: boolean; error?: string }> => {
    try {
      if (username === 'admin') {
        return { success: false, error: 'Impossible de supprimer l\'administrateur principal' };
      }

      const storedUsers = localStorage.getItem('aloelocation_users');
      const storedPasswords = localStorage.getItem('aloelocation_passwords');
      
      if (!storedUsers || !storedPasswords) {
        return { success: false, error: 'Erreur système' };
      }

      const usersList: User[] = JSON.parse(storedUsers);
      const passwordsList: Record<string, string> = JSON.parse(storedPasswords);

      const updatedUsers = usersList.filter(u => u.username !== username);
      const updatedPasswords = { ...passwordsList };
      delete updatedPasswords[username];

      localStorage.setItem('aloelocation_users', JSON.stringify(updatedUsers));
      localStorage.setItem('aloelocation_passwords', JSON.stringify(updatedPasswords));
      
      setUsers(updatedUsers);

      toast({
        title: "Utilisateur supprimé",
        description: `${username} a été supprimé`,
      });

      return { success: true };
    } catch (error) {
      console.error('Erreur suppression utilisateur:', error);
      return { success: false, error: 'Erreur lors de la suppression' };
    }
  };

  const fetchUsers = () => {
    try {
      const storedUsers = localStorage.getItem('aloelocation_users');
      if (storedUsers) {
        setUsers(JSON.parse(storedUsers));
      }
    } catch (error) {
      console.error('Erreur récupération utilisateurs:', error);
    }
  };

  // Gestion des assurances
  const addInsuranceType = async (name: string, commission: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const newInsurance: InsuranceType = {
        id: Date.now().toString(),
        name,
        commission,
        isActive: true,
        createdAt: new Date().toISOString()
      };

      const updatedInsurances = [...insuranceTypes, newInsurance];
      localStorage.setItem('aloelocation_insurance_types', JSON.stringify(updatedInsurances));
      setInsuranceTypes(updatedInsurances);

      toast({
        title: "Assurance ajoutée",
        description: `${name} a été ajoutée avec succès`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateInsuranceType = async (id: string, name: string, commission: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedInsurances = insuranceTypes.map(ins => 
        ins.id === id ? { ...ins, name, commission } : ins
      );

      localStorage.setItem('aloelocation_insurance_types', JSON.stringify(updatedInsurances));
      setInsuranceTypes(updatedInsurances);

      toast({
        title: "Assurance modifiée",
        description: `${name} a été mise à jour`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const removeInsuranceType = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedInsurances = insuranceTypes.filter(ins => ins.id !== id);
      localStorage.setItem('aloelocation_insurance_types', JSON.stringify(updatedInsurances));
      setInsuranceTypes(updatedInsurances);

      toast({
        title: "Assurance supprimée",
        description: "L'assurance a été supprimée",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const fetchInsuranceTypes = () => {
    try {
      const stored = localStorage.getItem('aloelocation_insurance_types');
      if (stored) {
        setInsuranceTypes(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur récupération assurances:', error);
    }
  };

  // Gestion des ventes
  const addSale = async (sale: Omit<Sale, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const newSale: Sale = {
        ...sale,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedSales = [newSale, ...sales];
      localStorage.setItem('aloelocation_sales', JSON.stringify(updatedSales));
      setSales(updatedSales);

      toast({
        title: "Vente enregistrée",
        description: `Commission: ${sale.commissionAmount.toFixed(2)} €`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const deleteSale = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedSales = sales.filter(sale => sale.id !== id);
      localStorage.setItem('aloelocation_sales', JSON.stringify(updatedSales));
      setSales(updatedSales);

      toast({
        title: "Vente supprimée",
        description: "La vente a été supprimée",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const fetchSales = () => {
    try {
      const stored = localStorage.getItem('aloelocation_sales');
      if (stored) {
        setSales(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur récupération ventes:', error);
    }
  };

  // Gestion des objectifs
  const addObjective = async (objective: Omit<Objective, 'id' | 'createdAt'>): Promise<{ success: boolean; error?: string }> => {
    try {
      const newObjective: Objective = {
        ...objective,
        id: Date.now().toString(),
        createdAt: new Date().toISOString()
      };

      const updatedObjectives = [...objectives, newObjective];
      localStorage.setItem('aloelocation_objectives', JSON.stringify(updatedObjectives));
      setObjectives(updatedObjectives);

      toast({
        title: "Objectif créé",
        description: `Objectif pour ${objective.employeeName} créé`,
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const updateObjective = async (id: string, updates: Partial<Objective>): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedObjectives = objectives.map(obj => 
        obj.id === id ? { ...obj, ...updates } : obj
      );

      localStorage.setItem('aloelocation_objectives', JSON.stringify(updatedObjectives));
      setObjectives(updatedObjectives);

      toast({
        title: "Objectif modifié",
        description: "L'objectif a été mis à jour",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const removeObjective = async (id: string): Promise<{ success: boolean; error?: string }> => {
    try {
      const updatedObjectives = objectives.filter(obj => obj.id !== id);
      localStorage.setItem('aloelocation_objectives', JSON.stringify(updatedObjectives));
      setObjectives(updatedObjectives);

      toast({
        title: "Objectif supprimé",
        description: "L'objectif a été supprimé",
      });

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  };

  const fetchObjectives = () => {
    try {
      const stored = localStorage.getItem('aloelocation_objectives');
      if (stored) {
        setObjectives(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Erreur récupération objectifs:', error);
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
    // Assurances
    insuranceTypes,
    addInsuranceType,
    updateInsuranceType,
    removeInsuranceType,
    fetchInsuranceTypes,
    // Ventes
    sales,
    addSale,
    deleteSale,
    fetchSales,
    // Objectifs
    objectives,
    addObjective,
    updateObjective,
    removeObjective,
    fetchObjectives
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};