// src/router/AdminRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';
import { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';

export const AdminRoutes = () => {
    const { isAuthenticated, user } = useContext(AuthContext);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    const role = user?.perfil?.role;

    return role === 'admin' ? <Outlet /> : <Navigate to="/home" replace />;
};