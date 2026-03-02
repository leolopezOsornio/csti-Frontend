// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';

import MainLayout from '../components/Layout/MainLayout'; // <-- Importamos el Layout

import Login from '../pages/auth/Login/Login'; 
import Register from '../pages/auth/Register/Register'; 
import RecoverPassword from '../pages/auth/RecoverPassword/RecoverPassword'; 
import VerifyAccount from '../pages/auth/VerifyAccount/VerifyAccount'; 
import Home from '../pages/home/Home';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>
        
        {/* === RUTAS ESTRICTAMENTE PÚBLICAS (Sin Navbar ni Footer) === */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar-password" element={<RecoverPassword />} />
          <Route path="/verificar-cuenta" element={<VerifyAccount />} />
        </Route>

        {/* === RUTAS CON NAVBAR Y FOOTER === */}
        <Route element={<MainLayout />}>
          
          {/* Rutas Privadas (Requieren login) */}
          <Route element={<PrivateRoutes />}>
            {/* <Route path="/perfil" element={<Perfil />} /> */}
            {/* <Route path="/carrito" element={<Carrito />} /> */}
          </Route>

          {/* Rutas Abiertas (Home, Listado, Detalle, etc.) */}
          <Route path="/home" element={<Home />} />
          
        </Route>

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
};