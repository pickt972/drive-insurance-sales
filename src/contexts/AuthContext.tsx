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

const DEFAULT_PASSWORDS: Record<string, string> = {
  'admin': 'admin123',
  'vendeur1': 'vendeur123',
  'vendeur2': 'vendeur123'
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

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
        setUsers(DEFAULT_USERS);
      } else {
        setUsers(JSON.parse(storedUsers));
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
      localStorage.removeItem('aloelocation_current_user');
      setUsers(DEFAULT_USERS);
      localStorage.setItem('aloelocation_users', JSON.stringify(DEFAULT_USERS));
      localStorage.setItem('aloelocation_passwords', JSON.stringify(DEFAULT_PASSWORDS));
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
    updatePassword
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