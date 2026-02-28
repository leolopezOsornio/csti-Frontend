// src/router/PrivateRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const PrivateRoutes = () => {
    // Leemos el estado real desde nuestro contexto global
    const { isAuthenticated } = useContext(AuthContext);

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};