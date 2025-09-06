import { useState, useEffect } from "react";
import { User } from "@/types/sales";

const DEFAULT_USERS: User[] = [
  {
    username: "admin",
    password: "admin2024", // In real app, this would be hashed
    role: "admin",
    createdAt: new Date().toISOString()
  },
  {
    username: "Julie",
    password: "julie2024",
    role: "employee", 
    createdAt: new Date().toISOString()
  },
  {
    username: "Sherman",
    password: "sherman2024",
    role: "employee",
    createdAt: new Date().toISOString()
  },
  {
    username: "Alvin",
    password: "alvin2024",
    role: "employee",
    createdAt: new Date().toISOString()
  }
];

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);

  useEffect(() => {
    const savedUsers = localStorage.getItem("app-users");
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      localStorage.setItem("app-users", JSON.stringify(DEFAULT_USERS));
    }

    const savedUser = localStorage.getItem("current-user");
    if (savedUser) {
      setCurrentUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("app-users", JSON.stringify(users));
  }, [users]);

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return { success: false, error: "Identifiant ou mot de passe incorrect" };
    }

    setCurrentUser(user);
    localStorage.setItem("current-user", JSON.stringify(user));
    return { success: true };
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem("current-user");
  };

  const addUser = (username: string, password: string, role: 'admin' | 'employee'): { success: boolean; error?: string } => {
    if (users.find(u => u.username === username)) {
      return { success: false, error: "Un utilisateur avec ce nom existe déjà" };
    }

    const newUser: User = {
      username,
      password,
      role,
      createdAt: new Date().toISOString()
    };

    setUsers(prev => [...prev, newUser]);
    return { success: true };
  };

  const removeUser = (username: string): { success: boolean; error?: string } => {
    if (username === "admin") {
      return { success: false, error: "Impossible de supprimer l'administrateur" };
    }

    setUsers(prev => prev.filter(u => u.username !== username));
    return { success: true };
  };

  const updatePassword = (username: string, newPassword: string): { success: boolean; error?: string } => {
    setUsers(prev => prev.map(u => 
      u.username === username 
        ? { ...u, password: newPassword }
        : u
    ));
    return { success: true };
  };

  return {
    currentUser,
    users,
    login,
    logout,
    addUser,
    removeUser,
    updatePassword,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin'
  };
};