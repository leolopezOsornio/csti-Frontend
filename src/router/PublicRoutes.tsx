// src/router/PublicRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const PublicRoutes = () => {
  const { isAuthenticated, user, isLoading } = useContext(AuthContext);

  if (isLoading) {
    return null; // O un spinner
  }

  if (isAuthenticated) {
    return user?.perfil?.role === 'admin' 
      ? <Navigate to="/admin" replace /> 
      : <Navigate to="/home" replace />;
  }

  return <Outlet />;
};