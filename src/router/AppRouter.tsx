// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';

// Componentes temporales para que veas que funciona (luego los borramos)
import Login from '../pages/auth/Login/Login'; // Asegúrate de agregar esta importación arriba
import Register from '../pages/auth/Register/Register'; // Asegúrate de agregar esta importación arriba

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* === RUTAS PÚBLICAS === */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
        </Route>

        {/* === RUTAS PRIVADAS === */}
        <Route element={<PrivateRoutes />}>
          {/* <Route path="/home" element={<MockHome />} /> */}
          {/* Aquí agregarás el carrito, el perfil, el checkout, etc. */}
        </Route>

        {/* CATCH-ALL: Si escriben una URL que no existe, los mandamos al login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
};