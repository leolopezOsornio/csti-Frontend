// src/pages/Profile/Profile.tsx
import { useContext } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faUser, faHeart } from '@fortawesome/free-regular-svg-icons';
import {
  faMapLocationDot,
  faBoxOpen,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons';

import { AuthContext } from '../../contexts/AuthContext';
import styles from './Profile.module.css';

const Profile = () => {
  const { logout } = useContext(AuthContext);

  return (
    <div className={styles.profileWrapper}>
      <div className={styles.profileGrid}>
        <aside className={styles.profileSidebar}>
          <ul className={styles.sidebarMenu}>
            <li>
              <NavLink
                to="/perfil"
                end
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
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <FontAwesomeIcon icon={faBoxOpen} />
                <span>Mis Pedidos</span>
              </NavLink>
            </li>

            <li>
              <NavLink
                to="/perfil/deseos"
                className={({ isActive }) =>
                  `${styles.sidebarLink} ${isActive ? styles.active : ''}`
                }
              >
                <FontAwesomeIcon icon={faHeart} />
                <span>Lista de Deseos</span>
              </NavLink>
            </li>

            <li className={styles.logoutItem}>
              <button
                onClick={logout}
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