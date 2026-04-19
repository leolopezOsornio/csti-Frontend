// src/contexts/AuthContext.tsx
import { createContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { authService } from '../services/Auth.service';

// 1. Definimos la forma de los datos del usuario
export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  perfil: {
    role: string; // 'admin' o 'user'
  };
}

// 2. Ampliamos el contexto para incluir al usuario
interface AuthContextType {
  isAuthenticated: boolean;
  user: User | null; // Puede ser null si no está logueado
  login: (token: string) => Promise<void>; // Lo hacemos Promise para esperar los datos
  logout: () => void;
  isLoading: boolean; // Para mostrar un spinner mientras validamos la sesión al recargar
}

export const AuthContext = createContext<AuthContextType>({
  isAuthenticated: false,
  user: null,
  login: async () => {},
  logout: () => {},
  isLoading: true,
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Función para obtener y guardar el perfil
  const fetchUserProfile = async () => {
    try {
      const userData = await authService.getUserProfile();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      // Si falla (ej. token expirado), cerramos sesión por seguridad
      logout();
    } finally {
      setIsLoading(false); 
    }
  };

  // Al cargar la app, revisamos si hay token
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('access_token');
      if (token) {
        // Si hay token, pedimos los datos del usuario
        await fetchUserProfile();
      } else {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (token: string) => {
    localStorage.setItem('access_token', token);
    // Inmediatamente después de guardar el token, pedimos el perfil
    await fetchUserProfile();
  };

  const logout = () => {
    authService.logout();
    setIsAuthenticated(false);
    setUser(null); // Borramos los datos
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};