// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';

// Componentes de autenticación
import Login from '../pages/auth/Login/Login'; 
import Register from '../pages/auth/Register/Register'; 
import RecoverPassword from '../pages/auth/RecoverPassword/RecoverPassword'; 
import VerifyAccount from '../pages/auth/VerifyAccount/VerifyAccount'; 

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* === RUTAS PÚBLICAS === */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar-password" element={<RecoverPassword />} />
          <Route path="/verificar-cuenta" element={<VerifyAccount />} />
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