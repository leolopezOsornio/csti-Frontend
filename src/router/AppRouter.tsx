// src/router/AppRouter.tsx
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { PrivateRoutes } from './PrivateRoutes';
import { PublicRoutes } from './PublicRoutes';
import { AdminRoutes } from './AdminRoutes';

import MainLayout from '../components/Layout/MainLayout';
import AdminLayout from '../pages/Admin/AdminLayout';

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

import Dashboard from '../pages/Admin/components/Dashboard/Dashboard';
import Users from '../pages/Admin/components/Users/Users';
import Interests from '../pages/Admin/components/Interests/Interests';
import AdminOrderDetail from '../pages/Admin/components/Orders/OrderDetail';

export const AppRouter = () => {
  return (
    <BrowserRouter>
      <Routes>

        {/* === RUTAS ESTRICTAMENTE PÚBLICAS (sin navbar ni footer) === */}
        <Route element={<PublicRoutes />}>
          <Route path="/login" element={<Login />} />
          <Route path="/registro" element={<Register />} />
          <Route path="/recuperar-password" element={<RecoverPassword />} />
          <Route path="/verificar-cuenta" element={<VerifyAccount />} />
        </Route>

        {/* === RUTAS ADMINISTRATIVAS (Layout con Sidebar) === */}
        <Route path="/admin" element={<AdminRoutes />}>
          <Route element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="pedidos" element={<div>En construcción: Lista de Pedidos</div>} />
            <Route path="pedidos/:id" element={<AdminOrderDetail />} />
            <Route path="usuarios" element={<Users />} />
            <Route path="intereses" element={<Interests />} />
          </Route>
        </Route>

        {/* === RUTAS CON NAVBAR Y FOOTER === */}
        <Route element={<MainLayout />}>

          {/* Rutas privadas normales */}
          <Route element={<PrivateRoutes />}>
            <Route path="/carrito" element={<Cart />} />
            <Route path="/payment" element={<Payment />} />

            <Route path="/perfil" element={<Profile />}>
              <Route index element={<MyProfile />} />
              <Route path="direcciones" element={<MyAddresses />} />
              <Route path="pedidos" element={<MyOrders />} />
              <Route path="pedidos/:id" element={<OrderDetail />} />
              <Route path="deseos" element={<Wishlist />} />
            </Route>
          </Route>

          {/* Rutas abiertas */}
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