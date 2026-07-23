import React, { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import * as SecureStore from 'expo-secure-store';
import User from '@/models/user';

const AUTH_USER_STORAGE_KEY = 'auth_user';

type AuthContextValue = {
  authUser: User | null;
  getAuthUser: () => User | null;
  setAuthUser: (user: User | null) => void;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthContextProvider({ children }: { children: ReactNode }) {
  const [authUser, setAuthUserState] = useState<User | null>(null);

  useEffect(() => {
    async function loadAuthUser() {
      const storedUser = await SecureStore.getItemAsync(AUTH_USER_STORAGE_KEY);
      if (storedUser) {
        try {
          setAuthUserState(JSON.parse(storedUser));
        } catch {
          setAuthUserState(null);
        }
      }
    }

    loadAuthUser();
  }, []);

  const setAuthUser = (user: User | null) => {
    setAuthUserState(user);

    if (user) {
      SecureStore.setItemAsync(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
    } else {
      SecureStore.deleteItemAsync(AUTH_USER_STORAGE_KEY);
    }
  };

  return (
    <AuthContext.Provider value={{ authUser, getAuthUser: () => authUser, setAuthUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used inside AuthContextProvider');
  return ctx;
}
