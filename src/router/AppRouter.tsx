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
  // Ahora extraemos 'user' y 'isLoading' del contexto
  const { isAuthenticated, user, logout, isLoading } = useContext(AuthContext); 

  // Si la app apenas está cargando y revisando el token, mostramos un pequeño mensaje
  if (isLoading) {
    return (
      <div style={{ padding: '50px', textAlign: 'center' }}>
        <h2>Cargando sesión... ⏳</h2>
      </div>
    );
  }

  return (
    <div style={{ padding: '50px', textAlign: 'center' }}>
      <h1>Catálogo de Productos 🛒</h1>
      <p>Cualquiera puede ver esta página, logueado o no.</p>
      
      {/* Renderizado condicional: Mostramos cosas distintas dependiendo del estado */}
      {isAuthenticated && user ? (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid green', borderRadius: '10px', backgroundColor: '#f0fff0' }}>
          <p style={{ color: 'green', fontSize: '1.2rem', marginBottom: '10px' }}>
            🟢 <strong>¡Sesión Activa!</strong>
          </p>
          
          {/* AQUÍ ESTAMOS LEYENDO LOS DATOS DEL USUARIO DIRECTO DESDE EL CONTEXTO */}
          <div style={{ textAlign: 'left', display: 'inline-block', backgroundColor: 'white', padding: '15px', borderRadius: '8px', border: '1px solid #c3e6cb' }}>
            <p><strong>ID:</strong> {user.id}</p>
            <p><strong>Nombre:</strong> {user.first_name}</p>
            <p><strong>Apellidos:</strong> {user.last_name}</p>
            <p><strong>Correo:</strong> {user.email}</p>
          </div>
          
          <br />

          <button 
            onClick={logout} 
            style={{ padding: '10px 20px', marginTop: '20px', cursor: 'pointer', backgroundColor: '#dc3545', color: 'white', border: 'none', borderRadius: '5px' }}
          >
            Cerrar Sesión
          </button>
        </div>
      ) : (
        <div style={{ marginTop: '30px', padding: '20px', border: '2px solid gray', borderRadius: '10px', backgroundColor: '#f8f9fa' }}>
          <p style={{ color: 'gray', fontSize: '1.2rem', marginBottom: '10px' }}>
            ⚪ <strong>Eres un invitado.</strong>
          </p>
          <p>Solo puedes ver los productos. Para comprar o ver tu perfil, por favor inicia sesión.</p>
          <Link to="/login">
            <button style={{ padding: '10px 20px', marginTop: '15px', cursor: 'pointer', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '5px' }}>
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