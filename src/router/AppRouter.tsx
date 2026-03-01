// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';

import Login from '../pages/auth/Login/Login'; 
import Register from '../pages/auth/Register/Register'; 
import RecoverPassword from '../pages/auth/RecoverPassword/RecoverPassword'; 
import VerifyAccount from '../pages/auth/VerifyAccount/VerifyAccount'; 
import Home from '../pages/home/Home';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* === RUTAS ESTRICTAMENTE PÚBLICAS (Para invitados) === */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar-password" element={<RecoverPassword />} />
          <Route path="/verificar-cuenta" element={<VerifyAccount />} />
        </Route>

        {/* === RUTAS ESTRICTAMENTE PRIVADAS (Para usuarios logueados) === */}
        <Route element={<PrivateRoutes />}>
          {/* Aquí agregar verdaderas rutas privadas después */}
          {/* <Route path="/perfil" element={<Perfil />} /> */}
          {/* <Route path="/carrito" element={<Carrito />} /> */}
        </Route>

        {/* === RUTAS ABIERTAS / MIXTAS (Libre acceso) === */}
        <Route path="/home" element={<Home />} />

        {/* CATCH-ALL: Es mejor mandar a los perdidos al catálogo en lugar del login */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
};