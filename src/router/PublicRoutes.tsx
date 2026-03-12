// src/router/PublicRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const PublicRoutes = () => {
  // Leemos el estado real desde nuestro contexto global
  const { isAuthenticated } = useContext(AuthContext);

  // Si YA está logueado, lo mandamos al home para que no vea el login de nuevo.
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};