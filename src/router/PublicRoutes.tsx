// src/router/PublicRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';

export const PublicRoutes = () => {
  // Simulador de sesión temporal
  const isAuthenticated = false;

  // Si YA está logueado, lo mandamos al home. Si no, lo dejamos ver el login/registro.
  return isAuthenticated ? <Navigate to="/home" replace /> : <Outlet />;
};