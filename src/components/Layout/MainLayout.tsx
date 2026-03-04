// src/components/Layout/MainLayout.tsx
import { Outlet } from 'react-router-dom';
import Navbar from '../Navbar/Navbar';
import Footer from '../Footer/Footer';

const MainLayout = () => {
  return (
    <>
      <Navbar />
      {/* El minHeight asegura que el footer siempre quede abajo aunque haya poco contenido */}
      <main style={{ minHeight: 'calc(100vh - 300px)' }}> 
        <Outlet /> {/* Aquí se renderizarán el Home, Perfil, etc. */}
      </main>
      <Footer />
    </>
  );
};

export default MainLayout;