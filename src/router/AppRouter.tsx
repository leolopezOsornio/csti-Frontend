// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate, Link } from 'react-router-dom';
import { useContext } from 'react';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';
import { AuthContext } from '../contexts/AuthContext';

import Login from '../pages/auth/Login/Login'; 
import Register from '../pages/auth/Register/Register'; 
import RecoverPassword from '../pages/auth/RecoverPassword/RecoverPassword'; 
import VerifyAccount from '../pages/auth/VerifyAccount/VerifyAccount'; 

// COMPONENTE TEMPORAL DEL CATÁLOGO (Ruta Abierta)
const HomeTemporal = () => {
  // Ahora también leemos 'isAuthenticated' para cambiar la interfaz dinámicamente
  const { isAuthenticated, logout } = useContext(AuthContext); 

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Catálogo de Productos 🛒</h1>
      <p>Cualquiera puede ver esta página, logueado o no.</p>
      
      {/* Renderizado condicional: Mostramos cosas distintas dependiendo del estado */}
      {isAuthenticated ? (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid green', borderRadius: '10px' }}>
          <p style={{ color: 'green', fontWeight: 'bold' }}>🟢 Estás logueado. (Aquí podrías ver tu carrito o tu perfil)</p>
          <button 
            onClick={logout} 
            style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid gray', borderRadius: '10px' }}>
          <p style={{ color: 'gray', fontWeight: 'bold' }}>⚪ Eres un invitado. (Solo puedes ver los productos)</p>
          <Link to="/login">
            <button style={{ padding: '10px 20px', marginTop: '10px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
              Ir a Iniciar Sesión
            </button>
          </Link>
        </div>
      )}
    </div>
  );
};

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
        {/* Sacamos el /home de la protección */}
        <Route path="/home" element={<HomeTemporal />} />

        {/* CATCH-ALL: Es mejor mandar a los perdidos al catálogo en lugar del login */}
        <Route path="*" element={<Navigate to="/home" replace />} />
        
      </Routes>
    </BrowserRouter>
  );
};