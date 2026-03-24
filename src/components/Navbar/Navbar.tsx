import { useContext, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../contexts/AuthContext';
import { CartContext } from '../../contexts/CartContext';
import { WishlistContext } from '../../contexts/WishlistContext';
import MegaMenu from './MegaMenu';
import styles from '../Navbar/Navbar.module.css';
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
import { faHeart, faUser } from '@fortawesome/free-regular-svg-icons';

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
    <header className={styles.headerWrapper}>
      <div className={styles.topBar}>
        <div className={`container ${styles.topBarInner}`}>
          <div className={styles.topBarLeft}>
            <a href="tel:+524421234567">
              <FontAwesomeIcon icon={faPhone} /> 442 123 4567
            </a>
            <span className={styles.separator}>|</span>
            <a href="mailto:ventas@csti.com.mx">
              <FontAwesomeIcon icon={faEnvelope} /> ventas@csti.com.mx
            </a>
          </div>

          <div className={styles.topBarRight}>
            <a href="#">
              <FontAwesomeIcon icon={faHandshake} /> Conócenos
            </a>
            <a href="#">
              <FontAwesomeIcon icon={faPlug} /> Servicios
            </a>
          </div>
        </div>
      </div>

      <div className={styles.mainHeader}>
        <div className={`container ${styles.mainHeaderInner}`}>
          <div className={styles.headerLeft}>
            <Link to="/home" className={styles.brand}>
              <img
                src="/img/Fasterclick2.webp"
                alt="CSTI"
                className={styles.brandLogo}
              />
            </Link>

            <div className={styles.categoriesWrapper}>
              <MegaMenu />
            </div>
          </div>

          <div className={styles.headerCenter}>
            <form className={styles.searchBar} onSubmit={handleSearch}>
              <FontAwesomeIcon
                icon={faMagnifyingGlass}
                className={styles.searchIcon}
              />
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Buscar productos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button className={styles.searchBtn} type="submit">
                Buscar
              </button>
            </form>
          </div>

          <div className={styles.headerRight}>
            <Link
              to="/perfil/deseos"
              className={styles.iconLink}
              title="Mis Favoritos"
            >
              <FontAwesomeIcon icon={faHeart} />
              {wishlistIds.length > 0 && (
                <span className={`${styles.cartBadge} ${styles.wishlistBadge}`}>
                  {wishlistIds.length}
                </span>
              )}
            </Link>

            <Link
              to="/carrito"
              className={`${styles.iconLink} ${styles.cartLink}`}
              title="Mi Carrito"
            >
              <FontAwesomeIcon icon={faCartShopping} />
              {cartItemsCount > 0 && (
                <span className={styles.cartBadge}>{cartItemsCount}</span>
              )}
            </Link>

            {isAuthenticated && user ? (
              <div className={styles.userDropdown}>
                <Link to="/perfil" className={`${styles.iconLink} ${styles.userLink}`}>
                  <FontAwesomeIcon icon={faUser} />
                  <span className={styles.userName}>
                    Hola, {user.first_name || user.email.split('@')[0]}
                  </span>
                </Link>

                <button
                  onClick={logout}
                  className={`${styles.iconLink} ${styles.logoutLink}`}
                  title="Cerrar Sesión"
                  type="button"
                >
                  <FontAwesomeIcon icon={faRightFromBracket} />
                </button>
              </div>
            ) : (
              <Link
                to="/login"
                className={`${styles.iconLink} ${styles.userLink}`}
                title="Iniciar Sesión"
              >
                <FontAwesomeIcon icon={faUser} />
                <span className={styles.loginText}>Entrar</span>
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Navbar;