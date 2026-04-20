// src/router/ClientRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

/**
 * Guard para las rutas de la tienda (Cliente).
 * Si un administrador intenta entrar a la tienda, lo redirige al Panel de Admin.
 */
export const ClientRoutes = () => {
    const { isAuthenticated, user, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return null; // O un spinner
    }

    // Si es admin y está autenticado, no puede estar en la tienda
    if (isAuthenticated && user?.perfil?.role === 'admin') {
        return <Navigate to="/admin" replace />;
    }

    return <Outlet />;
};
