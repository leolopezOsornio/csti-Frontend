// src/router/PrivateRoutes.tsx
import { Navigate, Outlet } from 'react-router-dom';

export const PrivateRoutes = () => {
    // TODO: Más adelante conectaremos esto con tu backend en Django/AuthContext
    // Por ahora lo simulamos. Cambia a 'true' para probar cómo te deja pasar.
    const isAuthenticated = false;

    // Si está autenticado, renderiza las rutas hijas (<Outlet />)
    // Si no, lo redirige a la ruta /login
    return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />;
};