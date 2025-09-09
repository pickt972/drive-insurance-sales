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
  },
  {
    username: "Stef",
    password: "stef2024",
    role: "employee",
    createdAt: new Date().toISOString()
  }
];

export const useAuth = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [users, setUsers] = useState<User[]>(DEFAULT_USERS);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const savedUsers = localStorage.getItem("app-users");
    if (savedUsers) {
      const parsedUsers = JSON.parse(savedUsers);
      console.log("Loading users from localStorage:", parsedUsers); // Debug log
      setUsers(parsedUsers);
    } else {
      localStorage.setItem("app-users", JSON.stringify(DEFAULT_USERS));
    }

    const savedUser = localStorage.getItem("current-user");
    if (savedUser) {
      const parsedUser = JSON.parse(savedUser);
      console.log("Loading current user from localStorage:", parsedUser); // Debug log
      
      // Ensure the current user has the latest data from saved users
      const savedUsersData = savedUsers ? JSON.parse(savedUsers) : DEFAULT_USERS;
      const upToDateUser = savedUsersData.find((u: User) => u.username === parsedUser.username);
      
      if (upToDateUser) {
        console.log("Setting current user with up-to-date data:", upToDateUser); // Debug log
        setCurrentUser(upToDateUser);
        localStorage.setItem("current-user", JSON.stringify(upToDateUser));
      } else {
        setCurrentUser(parsedUser);
      }
    }

    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem("app-users", JSON.stringify(users));
  }, [users, hydrated]);

  const login = (username: string, password: string): { success: boolean; error?: string } => {
    // Get the latest user data from the users array to ensure we have the current role
    const user = users.find(u => u.username === username && u.password === password);
    
    if (!user) {
      return { success: false, error: "Identifiant ou mot de passe incorrect" };
    }

    console.log("Login - user found:", user); // Debug log
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

    setUsers(prev => {
      const updated = [...prev, newUser];
      localStorage.setItem("app-users", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const removeUser = (username: string): { success: boolean; error?: string } => {
    if (username === "admin") {
      return { success: false, error: "Impossible de supprimer l'administrateur" };
    }

    setUsers(prev => {
      const updated = prev.filter(u => u.username !== username);
      localStorage.setItem("app-users", JSON.stringify(updated));
      return updated;
    });
    return { success: true };
  };

  const updateRole = (username: string, newRole: 'admin' | 'employee'): { success: boolean; error?: string } => {
    if (username === "admin" && newRole === "employee") {
      return { success: false, error: "Impossible de retirer les privilèges administrateur au compte admin principal" };
    }

    // Update users list and persist immediately
    setUsers(prev => {
      const updated = prev.map(u =>
        u.username === username ? { ...u, role: newRole } : u
      );
      localStorage.setItem("app-users", JSON.stringify(updated));
      return updated;
    });

    // If the updated user is the current user, also update currentUser and its persistence
    if (currentUser?.username === username) {
      const updatedCurrent = { ...currentUser, role: newRole };
      setCurrentUser(updatedCurrent);
      localStorage.setItem("current-user", JSON.stringify(updatedCurrent));
    }

    return { success: true };
  };
  const updatePassword = (username: string, newPassword: string): { success: boolean; error?: string } => {
    setUsers(prev => {
      const updated = prev.map(u =>
        u.username === username ? { ...u, password: newPassword } : u
      );
      localStorage.setItem("app-users", JSON.stringify(updated));
      return updated;
    });
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
    updateRole,
    isAuthenticated: !!currentUser,
    isAdmin: currentUser?.role === 'admin'
  };
};