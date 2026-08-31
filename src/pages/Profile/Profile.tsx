import { useContext, useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHeart } from '@fortawesome/free-regular-svg-icons';
import {
  faMapLocationDot,
  faBoxOpen,
  faRightFromBracket,
  faFileInvoiceDollar,
  faFileLines,
  faBars,
  faXmark
} from '@fortawesome/free-solid-svg-icons';

import { AuthContext } from '../../contexts/AuthContext';
import { orderService } from '../../services/Order.service';
import { useEffect } from 'react';
import styles from '../Profile/Profile.module.css';

const Profile = () => {
  const { logout } = useContext(AuthContext);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [notificacionesCount, setNotificacionesCount] = useState(0);

  useEffect(() => {
    const fetchNotificaciones = async () => {
      try {
        const data = await orderService.getNotificaciones();
        setNotificacionesCount(data.pedidos_novedades || 0);
      } catch (error) {
        console.error('Error al obtener notificaciones', error);
      }
    };
    fetchNotificaciones();
  }, []);

  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);
  const closeSidebar = () => setIsSidebarOpen(false);

  return (
    <div className={styles.profileWrapper}>
      <div className={styles.mobileMenuContainer}>
        <button className={styles.mobileMenuBtn} onClick={toggleSidebar} aria-label="Abrir menú">
          <FontAwesomeIcon icon={faBars} className={styles.menuIcon} />
          <span>Opciones de perfil</span>
        </button>
      </div>

      {isSidebarOpen && <div className={styles.overlay} onClick={closeSidebar}></div>}

      <div className={styles.profileGrid}>
        <aside className={`${styles.profileSidebar} ${isSidebarOpen ? styles.sidebarOpen : ''}`}>
          <div className={styles.sidebarHeaderMobile}>
            <h3>Navegación</h3>
            <button className={styles.closeSidebarBtn} onClick={closeSidebar}>
              <FontAwesomeIcon icon={faXmark} />
            </button>
          </div>
                              <ul className={styles.sidebarMenu}>
            <li>
              <NavLink
                to="/perfil"
                end
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <FontAwesomeIcon icon={faUser} />
                <span>Mi Perfil</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/perfil/direcciones"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <FontAwesomeIcon icon={faMapLocationDot} />
                <span>Mis Direcciones</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/perfil/pedidos"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', width: '100%', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                    <FontAwesomeIcon icon={faBoxOpen} />
                    <span>Mis Pedidos</span>
                  </div>
                  {notificacionesCount > 0 && (
                    <span className={styles.badgeNotifSidebar}>{notificacionesCount}</span>
                  )}
                </div>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/perfil/deseos"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>Lista de Deseos</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/perfil/facturacion/datos"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <FontAwesomeIcon icon={faFileInvoiceDollar} />
                <span>Datos Fiscales</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/perfil/facturacion/historial"
                onClick={closeSidebar}
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <FontAwesomeIcon icon={faFileLines} />
                <span>Mis Facturas</span>
              </NavLink>
            </li>

            <li className={styles.logoutItem}>
              <button
                onClick={() => {
                  closeSidebar();
                  logout();
                }}
                className={`${styles.sidebarLink} ${styles.logoutLink}`}
                type="button"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                <span>Cerrar Sesión</span>
              </button>
            </li>
          </ul>
        </aside>

        <div className={styles.profileContent}>
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default Profile;


