import { createContext, useContext, useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { apiPost } from 'cmm-shared';

export const ROLE_ADMIN = 'admin';

export type User = {
  id?: string;
  user_id?: string;
  name?: string;
  user_name?: string;
  role: string;
  [key: string]: any;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  role: string | null;
  login: (user_name: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('token');
      const storedUser = localStorage.getItem('user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error('[AuthContext] Error restoring session:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = async (user_name: string, password: string) => {
    try {
      const response = await apiPost('/login', { user_name, password });
      if (response?.success) {
        const { token: newToken, user: newUser } = response;

        localStorage.setItem('token', newToken);
        localStorage.setItem('user', JSON.stringify(newUser));

        setToken(newToken);
        setUser(newUser);

        return { success: true };
      }

      return {
        success: false,
        message: response?.message ?? 'Đăng nhập thất bại',
      };
    } catch (error: any) {
      return {
        success: false,
        message: error?.message ?? 'Đăng nhập thất bại',
      };
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    setToken(null);
    queryClient.clear();
  };

  const value = {
    user,
    token,
    isLoading,
    isAuthenticated: !!token,
    role: user?.role ?? null,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth() must be used within <AuthProvider>');
  }
  return ctx;
}
