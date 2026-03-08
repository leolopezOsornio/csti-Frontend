// src/components/Navbar/Navbar.tsx
import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import { WishlistContext } from '../../contexts/WishlistContext';
import MegaMenu from './MegaMenu';
import './Navbar.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faPhone,
  faEnvelope,
  faHandshake,
  faPlug,
  faMagnifyingGlass,
  faCartShopping,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';
import {
  faHeart,
  faUser,
} from '@fortawesome/free-regular-svg-icons';

const Navbar = () => {
  const { isAuthenticated, user, logout } = useContext(AuthContext);
  const { cartItemsCount } = useContext(CartContext);
  const { wishlistIds } = useContext(WishlistContext);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      navigate(`/listado?desc=${encodeURIComponent(searchTerm)}`);
    }
  };

  return (
    <header className="header-wrapper">
      <div className="top-bar">
        <div className="container top-bar__inner">
          <div className="top-bar__left">
            <a href="tel:+524421234567">
              <FontAwesomeIcon icon={faPhone} /> 442 123 4567
            </a>
            <span className="separator">|</span>
            <a href="mailto:ventas@csti.mx">
              <FontAwesomeIcon icon={faEnvelope} /> ventas@csti.mx
            </a>
          </div>
          <div className="top-bar__right">
            <a href="#">
              <FontAwesomeIcon icon={faHandshake} /> Conócenos
            </a>
            <a href="#">
              <FontAwesomeIcon icon={faPlug} /> Servicios
            </a>
          </div>
        </div>
      </div>

      <div className="main-header">
        <div className="container main-header__inner">

          <div className="header-left">
            <Link to="/home" className="brand">
              <img src="/img/logo_csti.png" alt="CSTI" className="brand__logo" />
            </Link>

            <div className="categories-wrapper">
              <MegaMenu />
            </div>
          </div>

          <div className="header-center">
            <form className="search-bar" onSubmit={handleSearch}>
              <FontAwesomeIcon icon={faMagnifyingGlass} className="search-icon" />
              <input
                type="text"
                className="search-input"
                placeholder="Buscar Productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className="search-btn" type="submit">Buscar</button>
            </form>
          </div>

          <div className="header-right">
            
            <Link to="/perfil/deseos" className="icon-link" title="Mis Favoritos">
              <FontAwesomeIcon icon={faHeart} />
              {wishlistIds.length > 0 && (
                <span className="cart-badge" style={{ backgroundColor: '#ff4757' }}>
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link to="/carrito" className="icon-link cart-link" title="Mi Carrito">
              <FontAwesomeIcon icon={faCartShopping} />
              {cartItemsCount > 0 && (
                <span className="cart-badge">{cartItemsCount}</span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <div className="user-dropdown">
                <Link to="/perfil" className="icon-link user-link">
                  <FontAwesomeIcon icon={faUser} />
                  <span className="user-name">
                    Hola, {user.first_name || user.email.split('@')[0]}
                  </span>
                </Link>
                <button
                  onClick={logout}
                  className="icon-link logout-link"
                  title="Cerrar Sesión"
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <FontAwesomeIcon icon={faRightFromBracket} />
                </button>
              </div>
            ) : (
              <Link to="/login" className="icon-link user-link" title="Iniciar Sesión">
                <FontAwesomeIcon icon={faUser} />
                <span className="login-text">Entrar</span>
              </Link>
            )}
          </div>

        </div>
      </div>
    </header>
  );
};

export default Navbar;
