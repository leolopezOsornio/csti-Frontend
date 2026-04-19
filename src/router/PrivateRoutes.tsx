// src/router/PrivateRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const PrivateRoutes = () => {
    const { isAuthenticated, isLoading } = useContext(AuthContext);

    if (isLoading) {
        return <div>Cargando...</div>;
    }

    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};