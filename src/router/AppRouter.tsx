// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';
import MainLayout from '../components/Layout/MainLayout';
import Login from '../pages/auth/Login/Login';
import Register from '../pages/auth/Register/Register';
import RecoverPassword from '../pages/auth/RecoverPassword/RecoverPassword';
import VerifyAccount from '../pages/auth/VerifyAccount/VerifyAccount';
import Home from '../pages/home/Home';
import BrandDetail from '../pages/BrandDetail/BrandDetail';
import ProductDetail from '../pages/ProductDetail/ProductDetail';
import ProductList from '../pages/ProductList/ProductList';
import Cart from '../pages/cart/Cart';
import Payment from '../pages/Payment/Payment';
import Profile from '../pages/Profile/Profile';
import MyProfile from '../pages/Profile/components/MyProfile/MyProfile';
import MyAddresses from '../pages/Profile/components/MyAddresses/MyAddresses';
import MyOrders from '../pages/Profile/components/MyOrders/MyOrders';
import OrderDetail from '../pages/Profile/components/OrderDetail/OrderDetail';
import Wishlist from '../pages/Profile/components/Wishlist/Wishlist';
import AdminDashboard from '../pages/Admin/AdminDashboard/AdminDashboard';

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
            <Route path="/carrito" element={<Cart />} />
            <Route path="/payment" element={<Payment />} />
            <Route path="/admin" element={<AdminDashboard />} />
            {/* Rutas Anidadas para el Perfil de Usuario */}
            <Route path="/perfil" element={<Profile />}>
              <Route index element={<MyProfile />} /> {/* Ruta por defecto: /perfil */}
              <Route path="direcciones" element={<MyAddresses />} /> {/* /perfil/direcciones */}
              <Route path="pedidos" element={<MyOrders />} /> {/* /perfil/pedidos */}
              <Route path="pedidos/:id" element={<OrderDetail />} /> {/* /perfil/pedidos/:id */}
              <Route path="deseos" element={<Wishlist />} /> {/* /perfil/deseos */}
            </Route>
          </Route>

          {/* Rutas Abiertas (Home, Listado, Detalle, etc.) */}
          <Route path="/home" element={<Home />} />
          <Route path="/marca/:slug" element={<BrandDetail />} />
          <Route path="/producto/:clave" element={<ProductDetail />} />
          <Route path="/listado" element={<ProductList />} />

        </Route>

        {/* CATCH-ALL */}
        <Route path="*" element={<Navigate to="/home" replace />} />

      </Routes>
    </BrowserRouter>
  );
};