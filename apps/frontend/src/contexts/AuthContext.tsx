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
        try {
          const userData = await authAPI.getMe();
          console.log('AuthContext initAuth - userData:', userData);
          // The backend only returns {message: 'Authenticated', turfId: '...'}
          // We need to fetch the full user data or handle this differently
          // For now, let's just set the token and handle user data differently
          setToken(storedToken);
          // We'll need to create a separate endpoint or modify the existing one
          // to get full user details. For now, this will work for auth purposes.
        } catch (error) {
          console.error('AuthContext initAuth error:', error);
          removeAuthToken();
        }
      }
      setIsLoading(false);
    };

    initAuth();
  }, []);

  const login = (response: AuthResponse) => {
    console.log('AuthContext login called with:', response);
    setUser(response.turf);
    setToken(response.token);
    localStorage.setItem('token', response.token);
    console.log('Token stored in localStorage');
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
