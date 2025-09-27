import React, { createContext, useContext, useEffect, useState } from 'react';
import { User } from 'firebase/auth';
import { useFirebaseAuth } from '@/hooks/useFirebaseAuth';

interface Profile {
  id: string;
  username: string;
  role: 'admin' | 'employee';
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  isAdmin: boolean;
  signIn: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const {
    user,
    profile,
    loading,
    isAdmin,
    signInWithUsername,
    signOut
  } = useFirebaseAuth();

  const signIn = async (username: string, password: string) => {
    return await signInWithUsername(username, password);
  };

  const value = {
    user,
    profile,
    loading,
    isAdmin,
    signIn,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};