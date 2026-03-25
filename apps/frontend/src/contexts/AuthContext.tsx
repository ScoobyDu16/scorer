import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthResponse } from '../lib/api';
import { getAuthToken, removeAuthToken, authAPI } from '../lib/auth';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (response: AuthResponse) => void;
  logout: () => void;
  isLoading: boolean;
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
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const storedToken = getAuthToken();
      if (storedToken) {
        setToken(storedToken); // Set token first
        try {
          const userData = await authAPI.getMe();
          setUser(userData.user);
        } catch (error) {
          console.error('Failed to verify token:', error);
          // Don't immediately remove token on network errors
          // Only remove on 401 errors (handled by axios interceptor)
          // This allows users to stay logged in during network issues
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (response: AuthResponse) => {
    setUser(response.user);
    setToken(response.tokens.accessToken);
    localStorage.setItem('token', response.tokens.accessToken);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    removeAuthToken();
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};
